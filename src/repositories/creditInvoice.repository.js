import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Tìm Credit Invoice theo ID
 */
export const findById = async (id) => {
  return await prisma.creditInvoice.findUnique({
    where: { id: parseInt(id) },
    include: {
      credit: {
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
      },
      invoice: {
        include: {
          order: {
            select: {
              id: true,
              orderDate: true,
              status: true,
              totalAmount: true,
              notes: true
            }
          }
        }
      },
      payment: true
    }
  });
};

/**
 * Tìm Credit Invoice của user trong tháng cụ thể
 */
export const findByUserAndMonth = async (userId, startOfMonth, endOfMonth) => {
  return await prisma.creditInvoice.findFirst({
    where: {
      credit: {
        userId: userId
      },
      dueDate: {
        gte: startOfMonth,
        lte: endOfMonth
      },
      status: 'PENDING'
    },
    include: {
      credit: true,
      invoice: true,
      payment: true
    }
  });
};

/**
 * Tìm Credit Invoice đang PENDING của user cho tháng hiện tại
 */
export const findActiveMonthlyCreditInvoice = async (userId, dueDate) => {
  return await prisma.creditInvoice.findFirst({
    where: {
      credit: {
        userId: userId
      },
      dueDate: dueDate,
      status: 'PENDING'
    },
    include: {
      credit: true,
      invoice: true
    }
  });
};

/**
 * Tạo Credit Invoice mới
 */
export const create = async (data) => {
  return await prisma.creditInvoice.create({
    data: {
      creditId: data.creditId,
      dueDate: data.dueDate,
      totalCreditAmount: data.totalCreditAmount || 0,
      creditPaidAmount: data.creditPaidAmount || 0,
      status: data.status || 'PENDING'
    },
    include: {
      credit: {
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
  });
};

/**
 * Update Credit Invoice
 */
export const update = async (id, data) => {
  return await prisma.creditInvoice.update({
    where: { id: parseInt(id) },
    data,
    include: {
      credit: true,
      invoice: true,
      payment: true
    }
  });
};

/**
 * Increment totalCreditAmount
 */
export const incrementTotalCreditAmount = async (id, amount, tx = prisma) => {
  return await tx. creditInvoice.update({
    where: { id: parseInt(id) },
    data: {
      totalCreditAmount: {
        increment: amount
      }
    }
  });
};

/**
 * Increment creditPaidAmount
 */
export const incrementCreditPaidAmount = async (id, amount, tx = prisma) => {
  return await tx.creditInvoice.update({
    where: { id: parseInt(id) },
    data: {
      creditPaidAmount: {
        increment: amount
      }
    }
  });
};

/**
 * Lấy danh sách Credit Invoice của user
 */
export const findByUserId = async (userId, options = {}) => {
  const { page = 1, limit = 10, status } = options;
  const skip = (page - 1) * limit;
  
  const where = {
    credit: {
      userId: userId
    }
  };
  
  if (status) {
    where.status = status;
  }
  
  const [creditInvoices, total] = await Promise.all([
    prisma.creditInvoice.findMany({
      where,
      skip,
      take: limit,
      include: {
        credit: {
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
        },
        invoice: {
          select: {
            id: true,
            invoiceDate: true,
            invoiceStatus: true,
            totalAmount: true,
            creditAmount: true,
            paidAmount: true
          }
        },
        payment: {
          select: {
            id: true,
            status: true,
            amount: true,
            paymentDate: true,
            paymentMethod: true
          }
        }
      },
      orderBy: { dueDate: 'desc' }
    }),
    prisma.creditInvoice.count({ where })
  ]);
  
  return {
    creditInvoices,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

/**
 * Lấy tất cả Credit Invoice (Admin)
 */
export const findAll = async (options = {}) => {
  const { page = 1, limit = 10, status, search } = options;
  const skip = (page - 1) * limit;
  
  const where = {};
  
  if (status) {
    where.status = status;
  }
  
  if (search) {
    where.credit = {
      user: {
        OR: [
          { fullname: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } }
        ]
      }
    };
  }
  
  const [creditInvoices, total] = await Promise.all([
    prisma.creditInvoice.findMany({
      where,
      skip,
      take: limit,
      include: {
        credit: {
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
        },
        invoice: {
          select: {
            id: true,
            invoiceDate: true,
            invoiceStatus: true,
            totalAmount: true,
            creditAmount: true,
            paidAmount: true
          }
        },
        payment: {
          select: {
            id: true,
            status: true,
            amount: true,
            paymentDate: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma. creditInvoice.count({ where })
  ]);
  
  return {
    creditInvoices,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

/**
 * Đếm số lượng Credit Invoice theo trạng thái
 */
export const countByStatus = async (userId = null) => {
  const where = userId ? { credit: { userId } } : {};
  
  const [pending, paid, overdue, total] = await Promise.all([
    prisma.creditInvoice.count({ where: { ...where, status: 'PENDING' } }),
    prisma.creditInvoice.count({ where: { ...where, status: 'PAID' } }),
    prisma.creditInvoice.count({ 
      where: { 
        ...where, 
        status: 'PENDING',
        dueDate: { lt: new Date() }
      } 
    }),
    prisma.creditInvoice.count({ where })
  ]);
  
  return {
    pending,
    paid,
    overdue,
    total
  };
};

/**
 * Lấy Credit Invoice đã quá hạn
 */
export const findOverdue = async () => {
  return await prisma.creditInvoice.findMany({
    where: {
      status: 'PENDING',
      dueDate: {
        lt: new Date()
      }
    },
    include: {
      credit: {
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
      },
      invoice: true
    }
  });
};

/**
 * Xóa Credit Invoice (Admin only - cẩn thận)
 */
export const deleteById = async (id) => {
  return await prisma.creditInvoice.delete({
    where: { id: parseInt(id) }
  });
};