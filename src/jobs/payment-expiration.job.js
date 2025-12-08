import payOSService from '../services/payos.service.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * JOB: HỦY ĐƠN HÀNG QUÁ HẠN
 * - Check PayOS lần cuối trước khi hủy (tránh miss payment)
 * - Hoàn trả tồn kho
 * - Hoàn trả credit
 * - Update invoice
 */
export const cancelExpiredOrders = async () => {
  const startTime = Date.now();
  const now = new Date();
  
  try {
    // Tìm các đơn PENDING đã quá hạn
    const expiredOrders = await prisma.order.findMany({
      where: {
        status: 'PENDING',
        invoice: {  
          paymentDeadline: {
            lt: now
          }
        }
      },
      include: {
        user: true,
        invoice: { include: { payment: true } },
        orderItems: {
          include: {
            fabric: {
              select: { id: true, length: true }
            }
          }
        }
      }
    });
    
    if (expiredOrders.length === 0) {
      return;
    }
    let successCount = 0;
    let failCount = 0;
    let recoveredCount = 0;
    
    for (const order of expiredOrders) {
      try {
        const orderId = order.id;
        const invoiceId = order.invoice.id;
        const payment = order.invoice?. payment;
        
        
        // BƯỚC 1: CHECK PAYOS LẦN CUỐI 
        if (payment && payment.status === 'PENDING') {
          
          try {
            const paymentInfo = await payOSService. queryPaymentStatus(invoiceId);
            if (paymentInfo.status === 'PAID') {
              // ĐÃ THANH TOÁN!  Xử lý ngay
              
              await prisma.$transaction(async (tx) => {
                // Update Payment
                await tx.payment.update({
                  where: { id: payment.id },
                  data: {
                    status: 'SUCCESS',
                    transactionId: paymentInfo.id,
                    paymentDate: new Date(),
                    gatewayResponse: paymentInfo,
                    processedViaCronCheck: true
                  }
                });
                
                // Update Order
                await tx.order.update({
                  where: { id: orderId },
                  data: { 
                    status: 'PROCESSING', 
                    paidAmount: payment.amount 
                  }
                });
                
                // Update Invoice
                const invoice = order.invoice;
                const invoiceStatus = invoice.creditAmount > 0 ? 'PAID' : 'PAID';
                await tx.invoice. update({
                  where: { id:invoice.id },
                  data: { 
                    invoiceStatus, 
                    paidAmount: payment.amount 
                  }
                });
                
                // Update Credit (nếu có)
                if (order.creditAmount > 0) {
                  await tx.creditRegistration.update({
                    where: { userId: order.userId },
                    data: { 
                      creditLimit: { decrement: invoice.creditAmount  } 
                    }
                  });
                }

                if (invoice.creditInvoiceId) {
                    await tx.creditInvoice.update({
                      where: { id: invoice.creditInvoiceId },
                      data: {
                        creditPaidAmount: { increment: payment.amount }
                      }
                    });
                  }
              });
              
              recoveredCount++;
              
              continue; // Không hủy đơn này
            }
          } catch (queryError) {
            console.error(`PayOS query error:`, queryError. message);
          }
        }
        
        // BƯỚC 2: HỦY ĐƠN HÀNG  
        
        await prisma.$transaction(async (tx) => {
          // 2a. Update Order status
          await tx.order.update({
            where: { id: orderId },
            data: {
              status: 'CANCELED',
              notes: (order. notes || '') + ` | Hủy tự động lúc ${now.toISOString()} do quá hạn thanh toán.`
            }
          });
          
          // 2b. Update Invoice
          await tx.invoice.update({
            where: { orderId },
            data: { invoiceStatus: 'CANCELED' }
          });
          
          // 2c.  Hoàn trả Credit (nếu có)
          const invoice = order.invoice;
          if (invoice.creditAmount > 0 && invoice.paymentType === 'CREDIT') {
            await tx.creditRegistration.update({
              where: { userId: order.userId },
              data: { creditLimit: { increment: invoice.creditAmount } }
            });
            
            // Trừ lại từ Credit Invoice
            if (invoice.creditInvoiceId) {
              await tx.creditInvoice.update({
                where: { id: invoice.creditInvoiceId },
                data: {
                  totalCreditAmount: { decrement: invoice.creditAmount }
                }
              });
            }
          }
          
          // 2d. Hoàn trả Tồn kho (cửa hàng)
          for (const item of order.orderItems) {
            if (item.saleUnit === 'ROLL') {
              // Hoàn cuộn: cộng vào uncutRolls
              const fabricLength = item.fabric?.length || 0;
              const metersToRestore = item.quantity * fabricLength;
              const valueToRestore = item.quantity * item.costPrice;

              await tx.fabricStore.update({
                where: {
                  fabricId_storeId: {
                    fabricId: item.fabricId,
                    storeId: order.storeId
                  }
                },
                data: {
                  uncutRolls: { increment: item.quantity },
                  totalMeters: { increment: metersToRestore },
                  totalValue: { increment: valueToRestore }
                }
              });
            } else if (item.saleUnit === 'METER') {
              // Hoàn mét: thêm vào cuttingRollMeters/uncutRolls
              const fabricLength = item.fabric?.length || 0;
              const valueToRestore = item.quantity * item.costPrice;
              
              const currentStore = await tx.fabricStore.findUnique({
                where: {
                  fabricId_storeId: {
                    fabricId: item.fabricId,
                    storeId: order.storeId
                  }
                }
              });

              if (currentStore) {
                const newCuttingMeters = currentStore.cuttingRollMeters + item.quantity;
                let newUncutRolls = currentStore.uncutRolls;
                let finalCuttingMeters = newCuttingMeters;

                if (newCuttingMeters >= fabricLength) {
                  newUncutRolls = currentStore.uncutRolls + Math.floor(newCuttingMeters / fabricLength);
                  finalCuttingMeters = newCuttingMeters % fabricLength;
                }

                await tx.fabricStore.update({
                  where: {
                    fabricId_storeId: {
                      fabricId: item.fabricId,
                      storeId: order.storeId
                    }
                  },
                  data: {
                    totalMeters: { increment: item.quantity },
                    totalValue: { increment: valueToRestore },
                    uncutRolls: { increment: newUncutRolls - currentStore.uncutRolls },
                    cuttingRollMeters: finalCuttingMeters
                  }
                });
              }
            }
          }
          
          // 2e. Update Payment status (nếu có)
          if (payment) {
            await tx.payment. update({
              where: { id: payment.id },
              data: { 
                status: 'EXPIRED', 
                errorMessage: 'Payment deadline exceeded (15 minutes)' 
              }
            });
          }
        });
        
        if (payment && payment.transactionId) {
          
          try {
            const cancelResult = await payOSService. cancelPaymentLink(
              orderId,
            );
            
            if (cancelResult && cancelResult.success !== false) {
              console.log(`PayOS payment link cancelled`);
            } else {
              console.error(cancelResult?. error);
            }
          } catch (cancelError) {
            console.error(cancelError. message);
          }
        }

        successCount++;
        console.log(`Order #${orderId} cancelled successfully`);
        
      } catch (error) {
        console.error(`Failed to process order #${order.id}:`, error. message);
        failCount++;
      }
    }
    
    // Summary
    const duration = Date.now() - startTime;
    console.log(`\n   Job completed in ${duration}ms`);
    console.log(`   Cancelled: ${successCount}`);
    console.log(`   Recovered: ${recoveredCount}`);
    if (failCount > 0) {
      console.log(`   Failed: ${failCount}`);
    }
    
  } catch (error) {
    console.error(`\n[${new Date().toISOString()}]Job error:`, error);
  }
};


export const startCancelExpiredOrdersJob = () => {
  return cancelExpiredOrders;
};