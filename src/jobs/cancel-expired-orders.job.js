
import { PrismaClient } from '@prisma/client';
import cron from 'node-cron';

const prisma = new PrismaClient();

/**
 * JOB: HỦY ĐƠN HÀNG QUÁ HẠN
 * Chạy mỗi phút, tự động hủy các đơn PENDING quá hạn
 */
export const cancelExpiredOrdersJob = async () => {
  const startTime = Date.now();
  const now = new Date();
  
  try {
    
    // Tìm các đơn PENDING đã quá hạn
    const expiredOrders = await prisma.order.findMany({
      where: {
        status: 'PENDING',
        paymentDeadline: {
          lt: now
        }
      },
      include: {
        orderItems: {
          include: {
            fabric: {
              select: {
                id: true,
                length: true
              }
            }
          }
        }
      }
    });

    if (expiredOrders.length === 0) {
      return;
    }


    // Hủy từng đơn trong transaction
    let successCount = 0;
    let failCount = 0;

    for (const order of expiredOrders) {
      try {
        await prisma.$transaction(async (tx) => {
          // Update order status
          await tx.order.update({
            where: { id: order.id },
            data: {
              status: 'CANCELED',
              notes: (order.notes || '') + ` | Hủy tự động lúc ${now.toISOString()} do quá hạn thanh toán.`
            }
          });

          // Update invoice
          await tx.invoice.update({
            where: { orderId: order.id },
            data: {
              invoiceStatus: 'CANCELED'
            }
          });

          // Hoàn trả credit 
          if (order.creditAmount > 0) {
            await tx.creditRegistration.update({
              where: { userId: order.userId },
              data: {
                creditLimit: { increment: order.creditAmount }
              }
            });
            console.log(`   Restored ${order.creditAmount}đ credit for user ${order.userId}`);
          }

          // Hoàn trả tồn kho
          for (const item of order.orderItems) {
            if (item.saleUnit === 'ROLL') {
              // Hoàn cuộn về kho
              await tx.fabric.update({
                where: { id: item.fabricId },
                data: {
                  quantityInStock: { increment: item.quantity }
                }
              });
              console.log(`   Restored ${item.quantity} rolls of fabric ${item.fabricId}`);
            } else if (item.saleUnit === 'METER') {
              // Hoàn mét về cửa hàng
              await tx.fabricStore.update({
                where: {
                  fabricId_storeId: {
                    fabricId: item.fabricId,
                    storeId: 1
                  }
                },
                data: {
                  quantity: { increment: item.quantity }
                }
              });
              console.log(`   Restored ${item.quantity} meters of fabric ${item.fabricId}`);
            }
          }
        });

        successCount++;
      } catch (error) {
        console.error(`Failed to cancel order ${order.id}:`, error.message);
        failCount++;
      }
    }

    const duration = Date.now() - startTime;
    console.log(`\n Job completed in ${duration}ms`);
    console.log(`   Success: ${successCount}`);
    if (failCount > 0) {
      console.log(`Failed: ${failCount}`);
    }
    
  } catch (error) {
    console.error(`\n [${new Date().toISOString()}] Job error:`, error);
  }
};

/**
 * ========================================
 * SCHEDULE: CHẠY MỖI PHÚT
 * ========================================
 * Cron format: * * * * *
 * ┬ ┬ ┬ ┬ ┬
 * │ │ │ │ │
 * │ │ │ │ └─── Day of week (0-7, 0 or 7 = Sunday)
 * │ │ │ └───── Month (1-12)
 * │ │ └─────── Day of month (1-31)
 * │ └───────── Hour (0-23)
 * └─────────── Minute (0-59)
 */
export const startCancelExpiredOrdersJob = () => {
  // Chạy mỗi phút
  cron.schedule('* * * * *', cancelExpiredOrdersJob);
  
};