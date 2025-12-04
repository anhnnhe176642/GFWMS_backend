import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
//Tạo payment record 
export const create = async (data) => {
  return await prisma.payment.create({
    data: {
      invoiceId: data.invoiceId,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      status: data.status || 'PENDING',
      transactionId: data.transactionId || null,
      notes: data. notes || null,
      gatewayResponse: data.gatewayResponse || null,
      errorCode: data.errorCode || null,
      errorMessage: data. errorMessage || null
    },
    include: {
      invoice: {
        include: {
          order: {
            include: {
              user: {
                select: {
                  id: true,
                  fullname: true,
                  email: true,
                  phone: true
                }
              }
            }
          }
        }
      }
    }
  });
};

//Tìm payment theo 
export const findByInvoiceId = async (invoiceId) => {
  return await prisma.payment.findUnique({
    where: { invoiceId: parseInt(invoiceId) },
    include: {
      invoice: {
        include: {
          order: {
            include: {
              user: true
            }
          }
        }
      }
    }
  });
};

//Tìm payment theo order ID (join qua invoice)
export const findByOrderId = async (orderId) => {
  //Tìm invoice của order
  const invoice = await prisma.invoice.findUnique({
    where: { orderId: parseInt(orderId) }
  });
  
  if (!invoice) return null;
  
  return await findByInvoiceId(invoice.id);
};

//Tìm payment theo transaction ID
export const findByTransactionId = async (transactionId) => {
  if (!transactionId) return null;
  
  return await prisma.payment.findUnique({
    where: { transactionId },
    include: {
      invoice: {
        include: {
          order: true
        }
      }
    }
  });
};

//Update payment theo ID
export const updateById = async (id, data) => {
  return await prisma.payment.update({
    where: { id },
    data,
    include: {
      invoice: {
        include: {
          order: true
        }
      }
    }
  });
};

//Update payment theo invoice ID
export const updateByInvoiceId = async (invoiceId, data) => {
  return await prisma.payment. update({
    where: { invoiceId: parseInt(invoiceId) },
    data,
    include: {
      invoice: {
        include: {
          order: true
        }
      }
    }
  });
};


//Update payment theo order ID (join qua invoice)
export const updateByOrderId = async (orderId, data) => {
  // Tìm invoice của order
  const invoice = await prisma.invoice. findUnique({
    where: { orderId: parseInt(orderId) }
  });
  if (!invoice) return null;
  return await updateByInvoiceId(invoice.id, data);
};


//Upsert payment (create hoặc update)
export const upsert = async (invoiceId, transactionId, data) => {
  if (transactionId) {
    // Upsert theo transactionId (cho webhook retry)
    return await prisma. payment.upsert({
      where: { transactionId },
      create: {
        invoiceId: parseInt(invoiceId),
        transactionId,
        ... data
      },
      update: data,
      include: {
        invoice: {
          include: {
            order: true
          }
        }
      }
    });
  } else {
    // Upsert theo invoiceId
    return await prisma.payment. upsert({
      where: { invoiceId: parseInt(invoiceId) },
      create: {
        invoiceId: parseInt(invoiceId),
        ... data
      },
      update: data,
      include: {
        invoice: {
          include: {
            order: true
          }
        }
      }
    });
  }
};

//Tìm pending payments (cho reconciliation)
export const findPendingPayments = async (hours = 24) => {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  return await prisma.payment. findMany({
    where: {
      status: 'PENDING',
      paymentMethod: { contains: 'PAYOS' },
      createdAt: { gte: since }
    },
    include: {
      invoice: {
        include: {
          order: {
            include: {
              user: true
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'asc' }
  });
};


// // Get metrics (cho monitoring)
// export const getMetrics = async (hours = 24) => {
//   const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  
//   return await prisma.payment.groupBy({
//     by: ['status', 'processedViaWebhook', 'processedViaReconciliation', 'processedViaCronCheck'],
//     where: {
//       createdAt: { gte: since }
//     },
//     _count: true
//   });
// };

// // Soft delete (chuyển status thành EXPIRED)
// export const softDelete = async (id) => {
//   return await updateById(id, {
//     status: 'EXPIRED',
//     errorMessage: 'thanh toán đã bị hủy bỏ'
//   });
// };

// //Get payment history của order (nếu có nhiều attempts)
// export const getPaymentHistory = async (orderId) => {
//   // Tìm invoice của order
//   const invoice = await prisma.invoice.findUnique({
//     where: { orderId: parseInt(orderId) }
//   });
  
//   if (! invoice) return [];
  
//   // Vì invoiceId là unique, chỉ có 1 payment
//   // Nhưng để flexible cho tương lai, return array
//   const payment = await findByInvoiceId(invoice. id);
  
//   return payment ?  [payment] : [];
// };