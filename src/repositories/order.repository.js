
import { PrismaClient } from '@prisma/client';
import { withPrismaErrorHandling } from '../utils/prisma-error-handler.js';
import { buildWhereClause, buildPagination, buildSort, formatPaginatedResponse } from '../utils/query-builder.js';
import { ValidationError } from '../utils/errors.js';

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
    totalAmount: true,
    isOffline: true,
    customerPhone: true,
    notes: true,
    storeId: true,
    store: {
      select: {
        id: true,
        name: true,
        address: true
      }
    },
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
        paymentType: true,        
        paymentDeadline: true,   
        creditInvoiceId: true,
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
      // THÊM: VALIDATION TRƯỚC KHI TẠO ORDER
      if (shouldUpdateCredit && invoiceData. creditAmount > 0) {
        const currentCredit = await tx.creditRegistration.findUnique({
          where: { userId: orderData. userId },
          select: { 
            creditLimit: true, 
            creditUsed: true,
            status: true
          }
        });
        
        if (! currentCredit) {
          throw new Error('Không tìm thấy Credit Registration');
        }
        
        if (currentCredit.status !== 'APPROVED') {
          throw new Error('Credit chưa được duyệt');
        }
        
        const newCreditUsed = currentCredit.creditUsed + invoiceData.creditAmount;
        
        // KIỂM TRA: Không cho vượt creditLimit
        if (newCreditUsed > currentCredit.creditLimit) {
          throw new Error(
            `VI PHẠM HẠN MỨC CREDIT!\n` +
            `Hạn mức: ${currentCredit.creditLimit. toLocaleString('vi-VN')}đ\n` +
            `Đã dùng: ${currentCredit.creditUsed.toLocaleString('vi-VN')}đ\n` +
            `Cố gắng thêm: ${invoiceData. creditAmount.toLocaleString('vi-VN')}đ\n` +
            `Tổng sẽ là: ${newCreditUsed.toLocaleString('vi-VN')}đ`
          );
        }
      }
      
      // 1. Tạo order
      const order = await tx.order.create({
        data: {
          ...orderData,
          orderItems: {
            create: items
          }
        },
      });

      // 2.  Trừ tồn kho 
      await deductStockCallback(tx);

      // 3. Tạo invoice
      await tx.invoice.create({
        data: {
          ... invoiceData,
          orderId: order.id
        }
      });

      // 4.  Tăng creditUsed 
      if (shouldUpdateCredit && invoiceData.creditAmount > 0) {
        await this.#updateQuantity(
          'creditRegistration',
          { userId: orderData.userId },
          'creditUsed',
          invoiceData.creditAmount,
          true,
          tx
        );
      }
      
      const fullOrder = await tx.order. findUnique({
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
            'creditUsed',
            creditAmount,
            true,
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


  // TRỪ CUỘN NGUYÊN TỪ CỬA HÀNG (khi bán theo CUỘN)
  async decrementUncutRolls(fabricId, rollsToDeduct, fabricLength, storeId, tx = prisma) {
    const currentStore = await withPrismaErrorHandling(
      () => tx.fabricStore.findUnique({
        where: { 
          fabricId_storeId: {  
            fabricId,
            storeId
          }
        }
      })
    );

    if (!currentStore) {
      throw new ValidationError('Không tìm thấy vải trong cửa hàng');
    }

    if (currentStore.uncutRolls < rollsToDeduct) {
      throw new ValidationError(`Không đủ cuộn trong cửa hàng. Cần ${rollsToDeduct} cuộn, chỉ có ${currentStore.uncutRolls} cuộn`);
    }

    // Tính giá trị và số mét bị trừ
    const metersToDeduct = rollsToDeduct * fabricLength;
    const pricePerMeter = currentStore.totalMeters > 0 
      ? currentStore.totalValue / currentStore.totalMeters 
      : 0;
    const valueToDeduct = metersToDeduct * pricePerMeter;

    return await withPrismaErrorHandling(
      () => tx.fabricStore.update({
        where: {
          fabricId_storeId: {
            fabricId,
            storeId
          }
        },
        data: {
          uncutRolls: { decrement: rollsToDeduct },
          totalMeters: { decrement: metersToDeduct },
          totalValue: { decrement: valueToDeduct }
        }
      })
    );
  }

  // CẮT VẢI TỪ CỬA HÀNG (khi bán theo MÉT)
  async decrementStoreStock(fabricId, meters, storeId, tx = prisma) {
    // Lấy thông tin hiện tại
    const currentStore = await withPrismaErrorHandling(
      () => tx.fabricStore.findUnique({
        where: { 
          fabricId_storeId: {  
            fabricId,
            storeId
          }
        },
        include: {
          fabric: {
            select: {
              length: true
            }
          }
        }
      })
    );

    if (!currentStore) {
      throw new Error('Không tìm thấy vải trong cửa hàng');
    }

    // Tính giá trị trung bình mỗi mét
    const pricePerMeter = currentStore.totalMeters > 0 
      ? currentStore.totalValue / currentStore.totalMeters 
      : 0;
    
    const valueToDeduct = meters * pricePerMeter;
    
    // Lấy độ dài mỗi cuộn
    const metersPerRoll = currentStore.fabric.length;
    
    let newCuttingRollMeters = currentStore.cuttingRollMeters;
    let newUncutRolls = currentStore.uncutRolls;
    
    let remainingMeters = meters;
    
    // Nếu có cuộn đang cắt dở
    if (newCuttingRollMeters > 0) {
      if (remainingMeters <= newCuttingRollMeters) {
        // Cắt hết từ cuộn đang cắt dở
        newCuttingRollMeters -= remainingMeters;
        remainingMeters = 0;
      } else {
        // Cắt hết cuộn đang cắt dở và tiếp tục sang cuộn mới
        remainingMeters -= newCuttingRollMeters;
        newCuttingRollMeters = 0;
      }
    }
    
    // Nếu còn mét cần cắt, lấy từ cuộn chưa cắt
    while (remainingMeters > 0 && newUncutRolls > 0) {
      newUncutRolls -= 1;
      
      if (remainingMeters >= metersPerRoll) {
        // Cắt hết cả cuộn
        remainingMeters -= metersPerRoll;
      } else {
        // Cắt một phần cuộn, cuộn này trở thành cuộn đang cắt dở
        newCuttingRollMeters = metersPerRoll - remainingMeters;
        remainingMeters = 0;
      }
    }
    
    if (remainingMeters > 0) {
      throw new Error(`Không đủ vải để cắt. Còn thiếu ${remainingMeters.toFixed(2)} mét`);
    }

    // Cập nhật database
    return await withPrismaErrorHandling(
      () => tx.fabricStore.update({
        where: {
          fabricId_storeId: {
            fabricId,
            storeId
          }
        },
        data: {
          totalValue: Math.max(0, currentStore.totalValue - valueToDeduct),
          totalMeters: Math.max(0, currentStore.totalMeters - meters),
          uncutRolls: newUncutRolls,
          cuttingRollMeters: newCuttingRollMeters
        }
      })
    );
  }

  // CỘNG TỒN KHO CỮA HÀNG (khi xuất từ warehouse về store)
  async incrementStoreStock(fabricId, metersToAdd, rollsToAdd, metersPerRoll, storeId, tx = prisma) {
    // Tính giá trị: sử dụng giá nhập trung bình của fabric
    const fabric = await tx.fabric.findUnique({
      where: { id: fabricId },
      select: { importPrice: true }
    });
    
    const valueToAdd = metersToAdd * (fabric?.importPrice || 0) / metersPerRoll;

    return await withPrismaErrorHandling(
      () => tx.fabricStore.upsert({
        where: { 
          fabricId_storeId: {  
            fabricId,
            storeId
          }
        },
        update: { 
          totalMeters: { increment: metersToAdd },
          totalValue: { increment: valueToAdd },
          uncutRolls: { increment: rollsToAdd }
        },
        create: { 
          fabricId, 
          storeId,  
          totalMeters: metersToAdd,
          totalValue: valueToAdd,
          uncutRolls: rollsToAdd,
          cuttingRollMeters: 0,
          quantity: 0
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

  async getStoreStock(fabricId, storeId) {
    return await prisma.fabricStore.findUnique({
      where: { 
        fabricId_storeId: {  
          fabricId,
          storeId
        }
      },
      select: {
        fabricId: true,
        totalMeters: true,
        uncutRolls: true,
        cuttingRollMeters: true,
        totalValue: true
      }
    });
  }

  async getCreditRegistration(userId) {
    return await prisma.creditRegistration.findUnique({
      where: { userId },
      select: {
        id: true,
        status: true,
        creditLimit: true,
        creditUsed: true
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
            creditLimit: true,
            creditUsed: true
          }
        }
      }
    });
  }

  //lay thog tin user kèm 
  async findUserById(userId) {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        fullname: true,
        phone: true,
        email: true,
        role: true,
        managedStores: {
          select: {
            storeId: true,
            store: {
              select: {
                id: true,
                name: true,
                address: true,
                isActive: true
              }
            }
          }
        }
      }
    });
  }

  //Tìm store theo ID
  async findStoreById(storeId) {
    return await prisma.store.findUnique({
      where: { id: parseInt(storeId) },
      select: {
        id: true,
        name: true,
        address: true,
        isActive: true
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

    const searchableFields = ['customerPhone','user.fullname'];
    const filterMapping = {
      paymentType: 'invoice.paymentType'
    };
    
    const where = buildWhereClause(
      { search, ...filters },
      searchableFields,
      filterMapping
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
    const filterMapping = {
      paymentType: 'invoice.paymentType'
    };
    
    const where = buildWhereClause(
      { search, ...filters },
      searchableFields,
      filterMapping
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

  // HỎA TỒN KHO KHI HỦY/THANH TOÁN THẤT BẠI
  async restoreStockFromOrderItems(orderItems, storeId, tx = prisma) {
    for (const item of orderItems) {
      if (item.saleUnit === 'ROLL') {
        // Hoàn cuộn: cộng vào uncutRolls và totalMeters
        const fabric = item.fabric || await tx.fabric.findUnique({
          where: { id: item.fabricId },
          select: { length: true }
        });
        
        const metersToRestore = item.quantity * fabric.length;
        const costPricePerMeter = item.costPrice ? item.costPrice / fabric.length : 0;
        const valueToRestore = metersToRestore * costPricePerMeter;

        await withPrismaErrorHandling(
          () => tx.fabricStore.update({
            where: {
              fabricId_storeId: {
                fabricId: item.fabricId,
                storeId
              }
            },
            data: {
              uncutRolls: { increment: item.quantity },
              totalMeters: { increment: metersToRestore },
              totalValue: { increment: valueToRestore }
            }
          })
        );
      } else if (item.saleUnit === 'METER') {
        // Hoàn mét: thêm vào cuttingRollMeters hoặc uncutRolls
        const fabric = item.fabric || await tx.fabric.findUnique({
          where: { id: item.fabricId },
          select: { length: true }
        });

        const costPricePerMeter = item.costPrice || 0;
        const valueToRestore = item.quantity * costPricePerMeter;
        
        const currentStore = await tx.fabricStore.findUnique({
          where: {
            fabricId_storeId: {
              fabricId: item.fabricId,
              storeId
            }
          }
        });

        if (!currentStore) continue;

        // Nếu cuttingRollMeters + meters < length thì thêm vào cuttingRollMeters
        // Nếu không, mở thêm uncutRolls
        const newCuttingMeters = currentStore.cuttingRollMeters + item.quantity;
        let newUncutRolls = currentStore.uncutRolls;
        let finalCuttingMeters = newCuttingMeters;

        if (newCuttingMeters >= fabric.length) {
          // Mở thêm cuộn
          newUncutRolls = currentStore.uncutRolls + Math.floor(newCuttingMeters / fabric.length);
          finalCuttingMeters = newCuttingMeters % fabric.length;
        }

        await withPrismaErrorHandling(
          () => tx.fabricStore.update({
            where: {
              fabricId_storeId: {
                fabricId: item.fabricId,
                storeId
              }
            },
            data: {
              totalMeters: { increment: item.quantity },
              totalValue: { increment: valueToRestore },
              uncutRolls: { increment: newUncutRolls - currentStore.uncutRolls },
              cuttingRollMeters: finalCuttingMeters
            }
          })
        );
      }
    }
  }

  // LẤY DANH SÁCH ĐƠN HÀNG THEO CỬA HÀNG
  async findByStoreIdWithQuery(storeId, queryOptions = {}) {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      sortBy = 'createdAt', 
      order = 'desc',
      filters = {}
    } = queryOptions;

    const searchableFields = ['customerPhone'];
    const filterMapping = {
      paymentType: 'invoice.paymentType'
    };
    
    const where = buildWhereClause(
      { search, ...filters },
      searchableFields,
      filterMapping
    );
    
    where.storeId = parseInt(storeId);

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