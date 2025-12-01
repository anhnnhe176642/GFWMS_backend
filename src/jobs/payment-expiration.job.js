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
        paymentDeadline: { lt: now } // đã quá hạn
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
        const payment = order.invoice?. payment;
        
        
        // BƯỚC 1: CHECK PAYOS LẦN CUỐI 
        if (payment && payment.status === 'PENDING') {
          
          try {
            const paymentInfo = await payOSService.queryPaymentStatus(orderId);
            
            if (paymentInfo.status === 'PAID') {
              // ĐÃ THANH TOÁN!  Xử lý ngay
              console. log(`Order #${orderId} WAS PAID! Processing...`);
              
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
                const invoiceStatus = order.creditAmount > 0 ? 'CREDIT' : 'PAID';
                await tx.invoice. update({
                  where: { id: order.invoice.id },
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
                      creditLimit: { decrement: order.creditAmount } 
                    }
                  });
                  console.log(`Deducted ${order.creditAmount}đ credit`);
                }
              });
              
              recoveredCount++;
              console.log(`Order #${orderId} recovered at last minute! `);
              console.error(`CRITICAL: Payment processed at last second for order #${orderId}`);
              
              continue; // Không hủy đơn này
            }
          } catch (queryError) {
            console.error(`PayOS query error:`, queryError. message);
            // Tiếp tục hủy nếu query lỗi (để safe)
          }
        }
        
        // BƯỚC 2: HỦY ĐƠN HÀNG 
        console.log(`Cancelling order #${orderId}...`);
        
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
          if (order.creditAmount > 0) {
            await tx.creditRegistration.update({
              where: { userId: order.userId },
              data: { creditLimit: { increment: order.creditAmount } }
            });
          }
          
          // 2d. Hoàn trả Tồn kho
          for (const item of order. orderItems) {
            if (item.saleUnit === 'ROLL') {
              // Hoàn cuộn về kho
              await tx.fabric.update({
                where: { id: item.fabricId },
                data: { quantityInStock: { increment: item.quantity } }
              });
            } else if (item. saleUnit === 'METER') {
              // Hoàn mét về cửa hàng (store ID = 1)
              await tx. fabricStore.update({
                where: {
                  fabricId_storeId: {
                    fabricId: item.fabricId,
                    storeId: 1
                  }
                },
                data: { quantity: { increment: item.quantity } }
              });
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
          console.log(`Cancelling PayOS payment link`);
          
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