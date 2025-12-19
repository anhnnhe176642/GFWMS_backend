import { PrismaClient } from '@prisma/client';
import { withPrismaErrorHandling } from '../utils/prisma-error-handler.js';

const prisma = new PrismaClient();

export class DashboardRepository {

  // ==================== REVENUE STATISTICS ====================

  /**
   * Get total revenue from completed orders
   */
  async getTotalRevenue(filters = {}) {
    const { startDate, endDate, storeId } = filters;
    
    const where = {
      status: 'DELIVERED',
      ...(startDate && endDate && {
        orderDate: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      }),
      ...(storeId && { storeId: parseInt(storeId) })
    };

    return await withPrismaErrorHandling(
      () => prisma.order.aggregate({
        where,
        _sum: {
          totalAmount: true
        },
        _count: {
          id: true
        }
      })
    );
  }

  /**
   * Get revenue by time period (day/month/year)
   */
  async getRevenueByPeriod(period = 'day', filters = {}) {
    const { startDate, endDate, storeId } = filters;

    const where = {
      status: 'DELIVERED',
      ...(startDate && endDate && {
        orderDate: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      }),
      ...(storeId && { storeId: parseInt(storeId) })
    };

    const orders = await withPrismaErrorHandling(
      () => prisma.order.findMany({
        where,
        select: {
          orderDate: true,
          totalAmount: true,
          orderItems: {
            select: {
              price: true,
              costPrice: true,
              quantity: true
            }
          }
        }
      })
    );

    // Group by period
    const groupedData = {};
    
    orders.forEach(order => {
      let key;
      const date = new Date(order.orderDate);
      
      switch (period) {
        case 'year':
          key = date.getFullYear().toString();
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'day':
        default:
          key = date.toISOString().split('T')[0];
          break;
      }

      if (!groupedData[key]) {
        groupedData[key] = {
          period: key,
          revenue: 0,
          profit: 0,
          orderCount: 0,
          totalRolls: 0,
          totalMeters: 0
        };
      }

      groupedData[key].revenue += order.totalAmount;
      groupedData[key].orderCount += 1;

      // Calculate profit
      order.orderItems.forEach(item => {
        groupedData[key].profit += (item.price - item.costPrice) * item.quantity;
      });
    });

    return Object.values(groupedData).sort((a, b) => a.period.localeCompare(b.period));
  }

  /**
   * Get revenue by fabric category
   */
  async getRevenueByCategory(filters = {}) {
    const { startDate, endDate, storeId } = filters;

    const where = {
      order: {
        status: 'DELIVERED',
        ...(startDate && endDate && {
          orderDate: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        }),
        ...(storeId && { storeId: parseInt(storeId) })
      }
    };

    const orderItems = await withPrismaErrorHandling(
      () => prisma.orderItem.findMany({
        where,
        include: {
          fabric: {
            include: {
              category: true
            }
          }
        }
      })
    );

    const categoryData = {};
    
    orderItems.forEach(item => {
      const categoryId = item.fabric.category.id;
      const categoryName = item.fabric.category.name;
      
      if (!categoryData[categoryId]) {
        categoryData[categoryId] = {
          categoryId,
          categoryName,
          revenue: 0,
          profit: 0,
          quantity: 0,
          rollsSold: 0,
          metersSold: 0
        };
      }

      const itemRevenue = item.price * item.quantity;
      const itemProfit = (item.price - item.costPrice) * item.quantity;

      categoryData[categoryId].revenue += itemRevenue;
      categoryData[categoryId].profit += itemProfit;
      categoryData[categoryId].quantity += item.quantity;

      if (item.saleUnit === 'ROLL') {
        categoryData[categoryId].rollsSold += item.quantity;
      } else {
        categoryData[categoryId].metersSold += item.quantity;
      }
    });

    return Object.values(categoryData).sort((a, b) => b.revenue - a.revenue);
  }

  /**
   * Get revenue by color
   */
  async getRevenueByColor(filters = {}) {
    const { startDate, endDate, storeId } = filters;

    const where = {
      order: {
        status: 'DELIVERED',
        ...(startDate && endDate && {
          orderDate: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        }),
        ...(storeId && { storeId: parseInt(storeId) })
      }
    };

    const orderItems = await withPrismaErrorHandling(
      () => prisma.orderItem.findMany({
        where,
        include: {
          fabric: {
            include: {
              color: true
            }
          }
        }
      })
    );

    const colorData = {};
    
    orderItems.forEach(item => {
      const colorId = item.fabric.color.id;
      const colorName = item.fabric.color.name;
      
      if (!colorData[colorId]) {
        colorData[colorId] = {
          colorId,
          colorName,
          hexCode: item.fabric.color.hexCode,
          revenue: 0,
          profit: 0,
          quantity: 0
        };
      }

      colorData[colorId].revenue += item.price * item.quantity;
      colorData[colorId].profit += (item.price - item.costPrice) * item.quantity;
      colorData[colorId].quantity += item.quantity;
    });

    return Object.values(colorData).sort((a, b) => b.revenue - a.revenue);
  }

  /**
   * Get revenue by store
   */
  async getRevenueByStore(filters = {}) {
    const { startDate, endDate } = filters;

    const where = {
      status: 'DELIVERED',
      storeId: { not: null },
      ...(startDate && endDate && {
        orderDate: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      })
    };

    const orders = await withPrismaErrorHandling(
      () => prisma.order.findMany({
        where,
        include: {
          store: true,
          orderItems: {
            select: {
              price: true,
              costPrice: true,
              quantity: true,
              saleUnit: true
            }
          }
        }
      })
    );

    const storeData = {};
    
    orders.forEach(order => {
      if (!order.store) return;
      
      const storeId = order.store.id;
      
      if (!storeData[storeId]) {
        storeData[storeId] = {
          storeId,
          storeName: order.store.name,
          storeAddress: order.store.address,
          revenue: 0,
          profit: 0,
          orderCount: 0,
          rollsSold: 0,
          metersSold: 0
        };
      }

      storeData[storeId].revenue += order.totalAmount;
      storeData[storeId].orderCount += 1;

      order.orderItems.forEach(item => {
        storeData[storeId].profit += (item.price - item.costPrice) * item.quantity;
        if (item.saleUnit === 'ROLL') {
          storeData[storeId].rollsSold += item.quantity;
        } else {
          storeData[storeId].metersSold += item.quantity;
        }
      });
    });

    return Object.values(storeData).sort((a, b) => b.revenue - a.revenue);
  }

  // ==================== PROFIT STATISTICS ====================

  /**
   * Get profit statistics (gross profit, net profit, profit margin)
   */
  async getProfitStatistics(filters = {}) {
    const { startDate, endDate, storeId } = filters;

    const where = {
      status: 'DELIVERED',
      ...(startDate && endDate && {
        orderDate: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      }),
      ...(storeId && { storeId: parseInt(storeId) })
    };

    const orders = await withPrismaErrorHandling(
      () => prisma.order.findMany({
        where,
        include: {
          orderItems: {
            select: {
              price: true,
              costPrice: true,
              quantity: true
            }
          }
        }
      })
    );

    let totalRevenue = 0;
    let totalCost = 0;
    let grossProfit = 0;

    orders.forEach(order => {
      totalRevenue += order.totalAmount;
      
      order.orderItems.forEach(item => {
        const revenue = item.price * item.quantity;
        const cost = item.costPrice * item.quantity;
        totalCost += cost;
        grossProfit += (revenue - cost);
      });
    });

    // Net profit (for simplicity, we assume no other costs)
    const netProfit = grossProfit;
    
    // Profit margin
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalCost,
      grossProfit,
      netProfit,
      profitMargin: parseFloat(profitMargin.toFixed(2)),
      orderCount: orders.length
    };
  }

  /**
   * Get profit by product (fabric)
   */
  async getProfitByProduct(filters = {}) {
    const { startDate, endDate, storeId, limit = 20 } = filters;

    const where = {
      order: {
        status: 'DELIVERED',
        ...(startDate && endDate && {
          orderDate: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        }),
        ...(storeId && { storeId: parseInt(storeId) })
      }
    };

    const orderItems = await withPrismaErrorHandling(
      () => prisma.orderItem.findMany({
        where,
        include: {
          fabric: {
            include: {
              category: true,
              color: true
            }
          }
        }
      })
    );

    const productData = {};
    
    orderItems.forEach(item => {
      const fabricId = item.fabric.id;
      
      if (!productData[fabricId]) {
        productData[fabricId] = {
          fabricId,
          categoryName: item.fabric.category.name,
          colorName: item.fabric.color.name,
          revenue: 0,
          cost: 0,
          profit: 0,
          quantitySold: 0,
          profitMargin: 0
        };
      }

      const revenue = item.price * item.quantity;
      const cost = item.costPrice * item.quantity;
      
      productData[fabricId].revenue += revenue;
      productData[fabricId].cost += cost;
      productData[fabricId].profit += (revenue - cost);
      productData[fabricId].quantitySold += item.quantity;
    });

    // Calculate profit margin for each product
    Object.values(productData).forEach(product => {
      product.profitMargin = product.revenue > 0 
        ? parseFloat(((product.profit / product.revenue) * 100).toFixed(2))
        : 0;
    });

    return Object.values(productData)
      .sort((a, b) => b.profit - a.profit)
      .slice(0, parseInt(limit));
  }

  // ==================== ORDER STATISTICS ====================

  /**
   * Get order statistics
   */
  async getOrderStatistics(filters = {}) {
    const { startDate, endDate, storeId } = filters;

    const baseWhere = {
      ...(startDate && endDate && {
        orderDate: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      }),
      ...(storeId && { storeId: parseInt(storeId) })
    };

    // Total orders
    const totalOrders = await withPrismaErrorHandling(
      () => prisma.order.count({ where: baseWhere })
    );

    // Orders by status
    const ordersByStatus = await withPrismaErrorHandling(
      () => prisma.order.groupBy({
        by: ['status'],
        where: baseWhere,
        _count: { id: true },
        _sum: { totalAmount: true }
      })
    );

    // Average Order Value (AOV)
    const deliveredOrders = await withPrismaErrorHandling(
      () => prisma.order.aggregate({
        where: { ...baseWhere, status: 'DELIVERED' },
        _avg: { totalAmount: true },
        _count: { id: true },
        _sum: { totalAmount: true }
      })
    );

    // Online vs Offline orders
    const ordersByType = await withPrismaErrorHandling(
      () => prisma.order.groupBy({
        by: ['isOffline'],
        where: baseWhere,
        _count: { id: true },
        _sum: { totalAmount: true }
      })
    );

    return {
      totalOrders,
      ordersByStatus: ordersByStatus.map(s => ({
        status: s.status,
        count: s._count.id,
        totalAmount: s._sum.totalAmount || 0
      })),
      completedOrders: ordersByStatus.find(s => s.status === 'DELIVERED')?._count.id || 0,
      canceledOrders: ordersByStatus.find(s => s.status === 'CANCELED')?._count.id || 0,
      pendingOrders: ordersByStatus.find(s => s.status === 'PENDING')?._count.id || 0,
      processingOrders: ordersByStatus.find(s => s.status === 'PROCESSING')?._count.id || 0,
      averageOrderValue: deliveredOrders._avg.totalAmount || 0,
      ordersByType: ordersByType.map(t => ({
        type: t.isOffline ? 'OFFLINE' : 'ONLINE',
        count: t._count.id,
        totalAmount: t._sum.totalAmount || 0
      }))
    };
  }

  /**
   * Get daily orders with details
   */
  async getDailyOrders(filters = {}) {
    const { startDate, endDate, storeId } = filters;

    const where = {
      ...(startDate && endDate && {
        orderDate: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      }),
      ...(storeId && { storeId: parseInt(storeId) })
    };

    const orders = await withPrismaErrorHandling(
      () => prisma.order.findMany({
        where,
        include: {
          orderItems: {
            select: {
              price: true,
              costPrice: true,
              quantity: true,
              saleUnit: true
            }
          }
        },
        orderBy: { orderDate: 'desc' }
      })
    );

    const dailyData = {};
    
    orders.forEach(order => {
      const dateKey = order.orderDate.toISOString().split('T')[0];
      
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = {
          date: dateKey,
          orderCount: 0,
          revenue: 0,
          profit: 0,
          rollsSold: 0,
          metersSold: 0,
          deliveredCount: 0,
          canceledCount: 0,
          pendingCount: 0
        };
      }

      dailyData[dateKey].orderCount += 1;
      dailyData[dateKey].revenue += order.totalAmount;

      // Status counts
      if (order.status === 'DELIVERED') dailyData[dateKey].deliveredCount += 1;
      else if (order.status === 'CANCELED') dailyData[dateKey].canceledCount += 1;
      else if (order.status === 'PENDING') dailyData[dateKey].pendingCount += 1;

      // Items details
      order.orderItems.forEach(item => {
        dailyData[dateKey].profit += (item.price - item.costPrice) * item.quantity;
        if (item.saleUnit === 'ROLL') {
          dailyData[dateKey].rollsSold += item.quantity;
        } else {
          dailyData[dateKey].metersSold += item.quantity;
        }
      });
    });

    return Object.values(dailyData).sort((a, b) => b.date.localeCompare(a.date));
  }

  // ==================== CUSTOMER STATISTICS ====================

  /**
   * Get top customers by purchase
   */
  async getTopCustomers(filters = {}) {
    const { startDate, endDate, storeId, limit = 10 } = filters;

    const where = {
      status: 'DELIVERED',
      ...(startDate && endDate && {
        orderDate: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      }),
      ...(storeId && { storeId: parseInt(storeId) })
    };

    const orders = await withPrismaErrorHandling(
      () => prisma.order.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              fullname: true,
              phone: true,
              email: true
            }
          },
          orderItems: {
            select: {
              price: true,
              costPrice: true,
              quantity: true,
              saleUnit: true
            }
          }
        }
      })
    );

    const customerData = {};
    
    orders.forEach(order => {
      const userId = order.user.id;
      
      if (!customerData[userId]) {
        customerData[userId] = {
          userId,
          username: order.user.username,
          fullname: order.user.fullname,
          phone: order.user.phone,
          email: order.user.email,
          totalSpent: 0,
          orderCount: 0,
          rollsBought: 0,
          metersBought: 0,
          profit: 0,
          averageOrderValue: 0
        };
      }

      customerData[userId].totalSpent += order.totalAmount;
      customerData[userId].orderCount += 1;

      order.orderItems.forEach(item => {
        customerData[userId].profit += (item.price - item.costPrice) * item.quantity;
        if (item.saleUnit === 'ROLL') {
          customerData[userId].rollsBought += item.quantity;
        } else {
          customerData[userId].metersBought += item.quantity;
        }
      });
    });

    // Calculate average order value
    Object.values(customerData).forEach(customer => {
      customer.averageOrderValue = customer.orderCount > 0 
        ? parseFloat((customer.totalSpent / customer.orderCount).toFixed(2))
        : 0;
    });

    return Object.values(customerData)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, parseInt(limit));
  }

  /**
   * Get purchase frequency
   */
  async getPurchaseFrequency(filters = {}) {
    const { startDate, endDate, storeId } = filters;

    const where = {
      status: 'DELIVERED',
      ...(startDate && endDate && {
        orderDate: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      }),
      ...(storeId && { storeId: parseInt(storeId) })
    };

    const orders = await withPrismaErrorHandling(
      () => prisma.order.findMany({
        where,
        select: {
          userId: true,
          orderDate: true
        },
        orderBy: { orderDate: 'asc' }
      })
    );

    // Group orders by user
    const userOrders = {};
    orders.forEach(order => {
      if (!userOrders[order.userId]) {
        userOrders[order.userId] = [];
      }
      userOrders[order.userId].push(order.orderDate);
    });

    // Calculate frequency for each user
    let totalDaysBetweenOrders = 0;
    let totalPairs = 0;

    Object.values(userOrders).forEach(dates => {
      if (dates.length < 2) return;
      
      for (let i = 1; i < dates.length; i++) {
        const daysDiff = Math.floor(
          (new Date(dates[i]) - new Date(dates[i - 1])) / (1000 * 60 * 60 * 24)
        );
        totalDaysBetweenOrders += daysDiff;
        totalPairs += 1;
      }
    });

    const averageFrequency = totalPairs > 0 
      ? parseFloat((totalDaysBetweenOrders / totalPairs).toFixed(2))
      : 0;

    // Group customers by order count
    const frequencyDistribution = {
      oneTime: 0,      // 1 order
      occasional: 0,   // 2-3 orders
      regular: 0,      // 4-10 orders
      loyal: 0         // > 10 orders
    };

    Object.values(userOrders).forEach(dates => {
      if (dates.length === 1) frequencyDistribution.oneTime += 1;
      else if (dates.length <= 3) frequencyDistribution.occasional += 1;
      else if (dates.length <= 10) frequencyDistribution.regular += 1;
      else frequencyDistribution.loyal += 1;
    });

    return {
      totalCustomers: Object.keys(userOrders).length,
      averageDaysBetweenOrders: averageFrequency,
      frequencyDistribution
    };
  }

  // ==================== INVENTORY STATISTICS ====================

  /**
   * Get low stock fabrics by category and color
   */
  async getLowStockFabrics(filters = {}) {
    const { storeId, threshold = 10 } = filters;

    let fabrics;

    if (storeId) {
      // Get from FabricStore for specific store
      fabrics = await withPrismaErrorHandling(
        () => prisma.fabricStore.findMany({
          where: {
            storeId: parseInt(storeId),
            OR: [
              { uncutRolls: { lte: parseInt(threshold) } },
              { totalMeters: { lte: parseInt(threshold) * 10 } }
            ]
          },
          include: {
            fabric: {
              include: {
                category: true,
                color: true
              }
            },
            store: {
              select: { id: true, name: true }
            }
          },
          orderBy: { uncutRolls: 'asc' }
        })
      );

      return fabrics.map(fs => ({
        fabricId: fs.fabric.id,
        categoryId: fs.fabric.category.id,
        categoryName: fs.fabric.category.name,
        colorId: fs.fabric.color.id,
        colorName: fs.fabric.color.name,
        hexCode: fs.fabric.color.hexCode,
        storeId: fs.store.id,
        storeName: fs.store.name,
        uncutRolls: fs.uncutRolls,
        totalMeters: fs.totalMeters,
        status: fs.uncutRolls === 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK'
      }));
    } else {
      // Get aggregated from all stores
      fabrics = await withPrismaErrorHandling(
        () => prisma.fabricStore.groupBy({
          by: ['fabricId'],
          _sum: {
            uncutRolls: true,
            totalMeters: true
          },
          having: {
            uncutRolls: { _sum: { lte: parseInt(threshold) } }
          }
        })
      );

      // Get fabric details
      const fabricIds = fabrics.map(f => f.fabricId);
      const fabricDetails = await withPrismaErrorHandling(
        () => prisma.fabric.findMany({
          where: { id: { in: fabricIds } },
          include: {
            category: true,
            color: true
          }
        })
      );

      const fabricMap = new Map(fabricDetails.map(f => [f.id, f]));

      return fabrics.map(f => {
        const fabric = fabricMap.get(f.fabricId);
        return {
          fabricId: f.fabricId,
          categoryId: fabric?.category.id,
          categoryName: fabric?.category.name,
          colorId: fabric?.color.id,
          colorName: fabric?.color.name,
          hexCode: fabric?.color.hexCode,
          totalUncutRolls: f._sum.uncutRolls,
          totalMeters: f._sum.totalMeters,
          status: f._sum.uncutRolls === 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK'
        };
      });
    }
  }

  /**
   * Get low stock by category
   */
  async getLowStockByCategory(filters = {}) {
    const { storeId, threshold = 10 } = filters;

    const where = storeId ? { storeId: parseInt(storeId) } : {};

    const fabricStores = await withPrismaErrorHandling(
      () => prisma.fabricStore.findMany({
        where,
        include: {
          fabric: {
            include: {
              category: true,
              color: true
            }
          }
        }
      })
    );

    // Group by category and color
    const categoryColorData = {};

    fabricStores.forEach(fs => {
      const key = `${fs.fabric.category.id}-${fs.fabric.color.id}`;
      
      if (!categoryColorData[key]) {
        categoryColorData[key] = {
          categoryId: fs.fabric.category.id,
          categoryName: fs.fabric.category.name,
          colorId: fs.fabric.color.id,
          colorName: fs.fabric.color.name,
          hexCode: fs.fabric.color.hexCode,
          totalRolls: 0,
          totalMeters: 0,
          fabricCount: 0
        };
      }

      categoryColorData[key].totalRolls += fs.uncutRolls;
      categoryColorData[key].totalMeters += fs.totalMeters;
      categoryColorData[key].fabricCount += 1;
    });

    // Filter low stock
    return Object.values(categoryColorData)
      .filter(item => item.totalRolls <= parseInt(threshold))
      .map(item => ({
        ...item,
        status: item.totalRolls === 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK'
      }))
      .sort((a, b) => a.totalRolls - b.totalRolls);
  }

  // ==================== SALES STATISTICS ====================

  /**
   * Get sales by day
   */
  async getSalesByDay(filters = {}) {
    const { startDate, endDate, storeId } = filters;

    const where = {
      order: {
        status: 'DELIVERED',
        ...(startDate && endDate && {
          orderDate: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        }),
        ...(storeId && { storeId: parseInt(storeId) })
      }
    };

    const orderItems = await withPrismaErrorHandling(
      () => prisma.orderItem.findMany({
        where,
        include: {
          order: {
            select: { orderDate: true }
          },
          fabric: {
            include: {
              category: true,
              color: true
            }
          }
        }
      })
    );

    const dailySales = {};

    orderItems.forEach(item => {
      const dateKey = item.order.orderDate.toISOString().split('T')[0];
      
      if (!dailySales[dateKey]) {
        dailySales[dateKey] = {
          date: dateKey,
          totalRevenue: 0,
          totalProfit: 0,
          rollsSold: 0,
          metersSold: 0,
          itemCount: 0,
          categories: {},
          colors: {}
        };
      }

      const revenue = item.price * item.quantity;
      const profit = (item.price - item.costPrice) * item.quantity;

      dailySales[dateKey].totalRevenue += revenue;
      dailySales[dateKey].totalProfit += profit;
      dailySales[dateKey].itemCount += 1;

      if (item.saleUnit === 'ROLL') {
        dailySales[dateKey].rollsSold += item.quantity;
      } else {
        dailySales[dateKey].metersSold += item.quantity;
      }

      // Track by category
      const categoryId = item.fabric.category.id;
      if (!dailySales[dateKey].categories[categoryId]) {
        dailySales[dateKey].categories[categoryId] = {
          name: item.fabric.category.name,
          quantity: 0,
          revenue: 0
        };
      }
      dailySales[dateKey].categories[categoryId].quantity += item.quantity;
      dailySales[dateKey].categories[categoryId].revenue += revenue;

      // Track by color
      const colorId = item.fabric.color.id;
      if (!dailySales[dateKey].colors[colorId]) {
        dailySales[dateKey].colors[colorId] = {
          name: item.fabric.color.name,
          quantity: 0,
          revenue: 0
        };
      }
      dailySales[dateKey].colors[colorId].quantity += item.quantity;
      dailySales[dateKey].colors[colorId].revenue += revenue;
    });

    // Convert nested objects to arrays
    return Object.values(dailySales)
      .map(day => ({
        ...day,
        categories: Object.values(day.categories),
        colors: Object.values(day.colors)
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  // ==================== OVERVIEW DASHBOARD ====================

  /**
   * Get dashboard overview
   */
  async getDashboardOverview(filters = {}) {
    const { startDate, endDate, storeId } = filters;

    const dateFilter = startDate && endDate ? {
      orderDate: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    } : {};

    const storeFilter = storeId ? { storeId: parseInt(storeId) } : {};

    // Total revenue from delivered orders
    const revenueData = await withPrismaErrorHandling(
      () => prisma.order.aggregate({
        where: { status: 'DELIVERED', ...dateFilter, ...storeFilter },
        _sum: { totalAmount: true },
        _count: { id: true }
      })
    );

    // Total orders
    const totalOrders = await withPrismaErrorHandling(
      () => prisma.order.count({
        where: { ...dateFilter, ...storeFilter }
      })
    );

    // Get profit from order items
    const profitOrders = await withPrismaErrorHandling(
      () => prisma.order.findMany({
        where: { status: 'DELIVERED', ...dateFilter, ...storeFilter },
        include: {
          orderItems: {
            select: {
              price: true,
              costPrice: true,
              quantity: true,
              saleUnit: true
            }
          }
        }
      })
    );

    let grossProfit = 0;
    let totalRollsSold = 0;
    let totalMetersSold = 0;

    profitOrders.forEach(order => {
      order.orderItems.forEach(item => {
        grossProfit += (item.price - item.costPrice) * item.quantity;
        if (item.saleUnit === 'ROLL') {
          totalRollsSold += item.quantity;
        } else {
          totalMetersSold += item.quantity;
        }
      });
    });

    const totalRevenue = revenueData._sum.totalAmount || 0;
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const averageOrderValue = revenueData._count.id > 0 
      ? totalRevenue / revenueData._count.id 
      : 0;

    // Total customers
    const totalCustomers = await withPrismaErrorHandling(
      () => prisma.order.findMany({
        where: { status: 'DELIVERED', ...dateFilter, ...storeFilter },
        distinct: ['userId']
      })
    );

    // Low stock count
    const lowStockCount = await withPrismaErrorHandling(
      () => prisma.fabricStore.count({
        where: {
          ...(storeId && { storeId: parseInt(storeId) }),
          uncutRolls: { lte: 10 }
        }
      })
    );

    return {
      totalRevenue,
      grossProfit,
      profitMargin: parseFloat(profitMargin.toFixed(2)),
      totalOrders,
      completedOrders: revenueData._count.id,
      averageOrderValue: parseFloat(averageOrderValue.toFixed(2)),
      totalRollsSold,
      totalMetersSold,
      totalCustomers: totalCustomers.length,
      lowStockAlerts: lowStockCount
    };
  }
}

export const dashboardRepository = new DashboardRepository();
