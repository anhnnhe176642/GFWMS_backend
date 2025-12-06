import payOSService from '../services/payos.service.js';
import * as paymentRepository from '../repositories/payment.repository.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const reconcilePendingPayments = async () => {
  try {
    
    //// Tìm payments PENDING > 5 phút
    const pendingPayments = await paymentRepository.findPendingPayments(24);
    
    if (pendingPayments.length === 0) {
      return { success: true, checked: 0, recovered: 0 };
    }
  
    
    let recoveredCount = 0;
    
    for (const payment of pendingPayments) {
      try {
        const { invoice } = payment;
        if (! invoice || !invoice.order) continue;
        
        const order = invoice.order;
        const orderId = order.id;
        const invoiceId = invoice.id;
        
        // GỌI PAYOS API để check status
        const paymentInfo = await payOSService.queryPaymentStatus(invoiceId);
        
        if (paymentInfo.status === 'PAID') {
          
          await prisma.$transaction(async (tx) => {
            await tx.payment.update({
              where: { id: payment.id },
              data: {
                status: 'SUCCESS',
                transactionId: paymentInfo.id || payment.transactionId,
                paymentDate: new Date(),
                gatewayResponse: paymentInfo,
                processedViaReconciliation: true
              }
            });
            
            if (order.status === 'PENDING') {
              await tx.order.update({
                where: { id: orderId },
                data: { status: 'PROCESSING', paidAmount: { increment: payment.amount } }
              });
              
              await tx.invoice.update({
                where: { id: invoice.id },
                data: { 
                  invoiceStatus: 'PAID', 
                  paidAmount: { increment: payment.amount } 
                }
              });

              if (invoice.creditAmount > 0 && invoice.paymentType === 'CREDIT') {
                await tx.creditRegistration.update({
                  where: { userId: order. userId },
                  data: { creditLimit: { decrement: invoice. creditAmount } }
                });
                
                // Cập nhật Credit Invoice
                if (invoice.creditInvoiceId) {
                  await tx.creditInvoice.update({
                    where: { id: invoice.creditInvoiceId },
                    data: {
                      creditPaidAmount: { increment: payment.amount }
                    }
                  });
                }
              }
            }
          });
          
          recoveredCount++;
        }
      } catch (error) {
        console.error(`[Reconciliation] Error processing payment ${payment.id}:`, error. message);
      }
    }
    
    
    return { success: true, checked: pendingPayments. length, recovered: recoveredCount };
  } catch (error) {
    return { success: false, error: error.message };
  }
};