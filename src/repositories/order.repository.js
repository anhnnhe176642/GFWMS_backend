
import { PrismaClient } from '@prisma/client';
import { withPrismaErrorHandling } from '../utils/prisma-error-handler.js';
import { buildWhereClause, buildPagination, buildSort, formatPaginatedResponse } from '../utils/query-builder.js';

const prisma = new PrismaClient();

export class OrderRepository {
  
  #orderSelectOptions = {
    id: true,
    userId: true,
    user: {
      select: {
        id: true,
        username: true,
        fullname: true,
        phone: true,
        email: true
      }
    },
    orderDate: true,
    status: true,
    paymentType: true,
    totalAmount: true,
    paidAmount: true,
    creditAmount: true,
    paymentDeadline: true,
    isOffline: true,
    customerPhone: true,
    notes: true,
    createdAt: true,
    updatedAt: true,
    orderItems: {
      select: {
        id: true,
        fabricId: true,
        quantity: true,
        saleUnit: true,
        price: true,
        fabric: {
          select: {
            id: true,
            thickness: true,
            length: true,
            width: true,
            category: { select: { id: true, name: true } },
            color: { select: { id: true, name: true, hexCode: true } },
            gloss: { select: { id: true, description: true } }
          }
        }
      }
    },
    invoice: {
      select: {
        id: true,
        invoiceStatus: true,
        totalAmount: true,
        paidAmount: true,
        creditAmount: true,
        dueDate: true,
        notes: true
      }
    },
    createdByStaff: {
      select: {
        id: true,
        fullname: true
      }
    }
  };

// CẬP NHẬT SỐ LƯỢNG (TĂNG/ GIẢM) 
  async #updateQuantity(model, where, field, amount, isIncrement = false, tx = prisma) {
    return await withPrismaErrorHandling(
      () => tx[model].update({
        where,
        data: {
          [field]: isIncrement ? { increment: amount } : { decrement: amount }
        }
      })
    );
  }

// TẠO ĐƠN HÀNG VỚI TRANSACTION
  async createOrderWithTransaction(orderData, items, invoiceData, deductStockCallback, shouldUpdateCredit = false) {
    return await withPrismaErrorHandling(
      () => prisma.$transaction(async (tx) => {
        // 1. Tạo order
        const order = await tx.order.create({
          data: {
            ...orderData,
            orderItems: {
              create: items
            }
          },
        });

        // 2. Trừ tồn kho 
        await deductStockCallback(tx);

        // 3. Tạo invoice
        await tx.invoice.create({
          data: {
            ...invoiceData,
            orderId: order.id
          }
        });

        // 4. Update credit limit nếu cần
        if (shouldUpdateCredit && orderData.creditAmount > 0) {
          await this.#updateQuantity(
            'creditRegistration',
            { userId: orderData.userId },
            'creditLimit',
            orderData.creditAmount,
            false,
            tx
          );
        }
        const fullOrder = await tx.order.findUnique({
        where: { id: order.id },
        select: this.#orderSelectOptions
      });
      return fullOrder;
      })
    );
  }

  // XÁC NHẬN THANH TOÁN VỚI TRANSACTION
  async confirmPaymentWithTransaction(orderId, updateData, invoiceData, shouldUpdateCredit = false, userId = null, creditAmount = 0) {
    return await withPrismaErrorHandling(
      () => prisma.$transaction(async (tx) => {
        // 1. Update order
        await tx.order.update({
          where: { id: orderId },
          data: updateData
        });

        // 2. Update invoice
        await tx.invoice.update({
          where: { orderId },
          data: invoiceData
        });

        // 3. Update credit limit nếu cần
        if (shouldUpdateCredit && userId && creditAmount > 0) {
          await this.#updateQuantity(
            'creditRegistration',
            { userId },
            'creditLimit',
            creditAmount,
            false,
            tx
          );
        }

        const updatedOrder = await tx.order.findUnique({
        where: { id: orderId },
        select: this.#orderSelectOptions
        });
        
        return updatedOrder;
      })
    );
  }

// GIẢM TỒN KHO FABRIC
  async decrementFabricStock(fabricId, quantity, tx = prisma) {
    return await this.#updateQuantity('fabric', { id: fabricId }, 'quantityInStock', quantity, false, tx);
  }

  async decrementStoreStock(fabricId, meters, tx = prisma) {
    return await withPrismaErrorHandling(
      () => tx.fabricStore.update({
        where: { 
          fabricId_storeId: {  
            fabricId,
            storeId: 1  // Hardcode storeId = 1
          }
        },
        data: { quantity: { decrement: meters } }
      })
    );
  }

  // CỘNG TỒN KHO CỬA HÀNG
  async incrementStoreStock(fabricId, meters, tx = prisma) {
    return await withPrismaErrorHandling(
      () => tx.fabricStore.upsert({
        where: { 
          fabricId_storeId: {  
            fabricId,
            storeId: 1  
          }
        },
        update: { quantity: { increment: meters } },
        create: { 
          fabricId, 
          storeId: 1,  
          quantity: meters 
        }
      })
    );
  }

 // LẤY CHI TIẾT ĐƠN HÀNG THEO ID
  async findById(orderId) {
    return await prisma.order.findUnique({
      where: { id: orderId },
      select: this.#orderSelectOptions
    });
  }

  async getStoreStock(fabricId) {
    return await prisma.fabricStore.findUnique({
      where: { 
        fabricId_storeId: {  
          fabricId,
          storeId: 1 // storeId = 1 chính
        }
      },
      select: {
        fabricId: true,
        quantity: true
      }
    });
  }

  async getCreditRegistration(userId) {
    return await prisma.creditRegistration.findUnique({
      where: { userId },
      select: {
        id: true,
        status: true,
        creditLimit: true
      }
    });
  }

  async findUserByPhone(phone) {
    return await prisma.user.findFirst({
      where: { phone },
      select: {
        id: true,
        username: true,
        fullname: true,
        phone: true,
        email: true,
        creditRegistration: {
          select: {
            id: true,
            status: true,
            creditLimit: true
          }
        }
      }
    });
  }

  /**
   * ========================================
   * LẤY FABRIC VỚI CATEGORY (CHO ORDER)
   * ========================================
   */
  async getFabricsForOrder(fabricIds) {
    return await prisma.fabric.findMany({
      where: {
        id: { in: fabricIds }
      },
      select: {
        id: true,
        thickness: true,
        length: true,
        width: true,
        weight: true,
        quantityInStock: true,
        sellingPrice: true,
        
        category: {
          select: {
            id: true,
            name: true,
            sellingPricePerMeter: true,
            sellingPricePerRoll: true
          }
        },
        
        color: { select: { id: true, name: true, hexCode: true } },
        gloss: { select: { id: true, description: true } }
      }
    });
  }
  

  async findWithAdvancedQuery(queryOptions = {}) {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      sortBy = 'createdAt', 
      order = 'desc',
      filters = {}
    } = queryOptions;

    const searchableFields = ['customerPhone'];
    
    const where = buildWhereClause(
      { search, ...filters },
      searchableFields
    );

    const { skip, take } = buildPagination(page, limit);
    const orderBy = buildSort(sortBy, order);

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take,
        select: this.#orderSelectOptions,
        orderBy
      }),
      prisma.order.count({ where })
    ]);

    return formatPaginatedResponse(orders, total, page, take);
  }

  async findByUserIdWithQuery(userId, queryOptions = {}) {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      sortBy = 'createdAt', 
      order = 'desc',
      filters = {}
    } = queryOptions;

    const searchableFields = ['notes'];
    
    const where = buildWhereClause(
      { search, ...filters },
      searchableFields
    );
    
    where.userId = userId;

    const { skip, take } = buildPagination(page, limit);
    const orderBy = buildSort(sortBy, order);

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take,
        select: this.#orderSelectOptions,
        orderBy
      }),
      prisma.order.count({ where })
    ]);

    return formatPaginatedResponse(orders, total, page, take);
  }


}



export const orderRepository = new OrderRepository();