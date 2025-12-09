import { userActivityRepository } from '../repositories/userActivity.repository.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class UserActivityService {
  /**
   * Log user activity (Polymorphic)
   * @param {string} userId 
   * @param {string} activityType - ORDER_CREATED, EXPORT_CREATED, EXPORT_COMPLETED, IMPORT_COMPLETED, PAYMENT_MADE
   * @param {string} entityType - "Order", "ExportFabric", "ImportFabric", "Payment"
   * @param {number} entityId 
   * @param {string} description 
   * @param {Object} metadata 
   */
  async logActivity(userId, activityType, entityType, entityId, description = null, metadata = null) {
    return await userActivityRepository.createActivity({
      userId,
      activityType,
      entityType,
      entityId,
      description,
      metadata,
    });
  }

  /**
   * Get user's activity history
   */
  async getUserActivityHistory(userId, page = 1, limit = 20) {
    return await userActivityRepository.getUserActivityHistory(userId, page, limit);
  }

  /**
   * Get user's activity statistics
   */
  async getUserActivityStats(userId) {
    return await userActivityRepository.getUserActivityStats(userId);
  }

  /**
   * Get recent activities by type
   */
  async getRecentActivitiesByType(userId, activityType, limit = 10) {
    return await userActivityRepository.getRecentActivitiesByType(userId, activityType, limit);
  }

  /**
   * Get activities within date range
   */
  async getActivitiesByDateRange(userId, startDate, endDate, activityType = null) {
    return await userActivityRepository.getActivitiesByDateRange(userId, startDate, endDate, activityType);
  }

  /**
   * Get activities by entity
   */
  async getActivitiesByEntity(entityType, entityId) {
    return await userActivityRepository.getActivitiesByEntity(entityType, entityId);
  }

  /**
   * Delete old activities
   */
  async deleteOldActivities(olderThanDays = 90) {
    return await userActivityRepository.deleteOldActivities(olderThanDays);
  }

  /**
   * Get detailed dashboard metrics from activity data
   */
  async getDashboardMetrics(userId) {
    const [activities, stats] = await Promise.all([
      this.getUserActivityHistory(userId, 1, 100),
      this.getUserActivityStats(userId)
    ]);

    // Group activities by type with detailed analysis
    const grouped = {
      orders: [],
      exports: { created: [], completed: [] },
      imports: [],
      payments: [],
    };

    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    for (const activity of activities.data) {
      if (activity.activityType === 'ORDER_CREATED') {
        grouped.orders.push(activity);
      } else if (activity.activityType === 'EXPORT_CREATED') {
        grouped.exports.created.push(activity);
      } else if (activity.activityType === 'EXPORT_COMPLETED') {
        grouped.exports.completed.push(activity);
      } else if (activity.activityType === 'IMPORT_COMPLETED') {
        grouped.imports.push(activity);
      } else if (activity.activityType === 'PAYMENT_MADE') {
        grouped.payments.push(activity);
      }
    }

    // Tính toán thống kê chi tiết
    const getActivityTrend = (activities) => {
      const last7 = activities.filter(a => new Date(a.createdAt) >= last7Days).length;
      const last30 = activities.filter(a => new Date(a.createdAt) >= last30Days).length;
      return {
        last7Days: last7,
        last30Days: last30,
        totalCount: activities.length
      };
    };

    return {
      activityMetrics: {
        totalActivities: activities.pagination.total,
        // Orders - chi tiết
        orderMetrics: {
          total: grouped.orders.length,
          ...getActivityTrend(grouped.orders),
          recentOrders: grouped.orders.slice(0, 5)
        },
        // Exports - chi tiết theo loại
        exportMetrics: {
          totalCreated: grouped.exports.created.length,
          totalCompleted: grouped.exports.completed.length,
          totalExports: grouped.exports.created.length + grouped.exports.completed.length,
          createdTrend: getActivityTrend(grouped.exports.created),
          completedTrend: getActivityTrend(grouped.exports.completed),
          recentExports: [...grouped.exports.created, ...grouped.exports.completed].slice(0, 5)
        },
        // Imports - chi tiết
        importMetrics: {
          total: grouped.imports.length,
          ...getActivityTrend(grouped.imports),
          recentImports: grouped.imports.slice(0, 5)
        },
        // Payments - chi tiết
        paymentMetrics: {
          total: grouped.payments.length,
          ...getActivityTrend(grouped.payments),
          recentPayments: grouped.payments.slice(0, 5)
        }
      },
      // Phân bổ hoạt động theo loại
      activityBreakdown: stats,
      // Timeline chi tiết
      activityTimeline: {
        recentActivities: activities.data.slice(0, 10),
        lastActivityAt: activities.data[0]?.createdAt,
        firstActivityAt: activities.data[activities.data.length - 1]?.createdAt,
        totalActivitiesCount: activities.pagination.total
      },
      // Xu hướng hoạt động
      trends: {
        activityLast7Days: activities.data.filter(a => new Date(a.createdAt) >= last7Days).length,
        activityLast30Days: activities.data.filter(a => new Date(a.createdAt) >= last30Days).length,
        avgActivitiesPerDay: Math.round(activities.pagination.total / Math.max(1, Math.floor((now - new Date(activities.data[activities.data.length - 1]?.createdAt || now)) / (1000 * 60 * 60 * 24))))
      }
    };
  }

  /**
   * Get comprehensive user statistics (all in one) - CHI TIẾT
   */
  async getComprehensiveUserStats(userId) {
    const [orderStats, createdOrderStats, exportStats, importStats, creditInfo, creditRequests] = await Promise.all([
      prisma.order.aggregate({
        where: { userId },
        _count: true,
        _sum: { totalAmount: true }
      }),
      prisma.order.aggregate({
        where: { createdByStaffId: userId },
        _count: true,
        _sum: { totalAmount: true }
      }),
      prisma.exportFabric.aggregate({
        where: { createdById: userId },
        _count: true
      }),
      prisma.importFabric.aggregate({
        where: { importer: userId },
        _count: true,
        _sum: { totalPrice: true }
      }),
      prisma.creditRegistration.findUnique({
        where: { userId },
        select: {
          id: true,
          creditLimit: true,
          creditUsed: true,
          status: true,
          createdAt: true
        }
      }),
      prisma.creditRequest.findMany({
        where: { userId },
        select: {
          id: true,
          requestLimit: true,
          type: true,
          status: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ]);

    // Get detailed order breakdown
    const [orderByStatus, orderDetails] = await Promise.all([
      prisma.order.findMany({
        where: { userId },
        select: { status: true },
      }),
      prisma.order.findMany({
        where: { userId },
        select: {
          id: true,
          status: true,
          totalAmount: true,
          orderDate: true,
          isOffline: true
        },
        orderBy: { orderDate: 'desc' },
        take: 10
      })
    ]);

    // Get detailed export breakdown
    const [exportByStatus, exportDetails] = await Promise.all([
      prisma.exportFabric.findMany({
        where: { createdById: userId },
        select: { status: true }
      }),
      prisma.exportFabric.findMany({
        where: { createdById: userId },
        select: {
          id: true,
          status: true,
          createdAt: true,
          warehouse: { select: { name: true } },
          store: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ]);

    // Get detailed import breakdown
    const [importByStatus, importDetails] = await Promise.all([
      prisma.importFabric.findMany({
        where: { importer: userId },
        select: { status: true }
      }),
      prisma.importFabric.findMany({
        where: { importer: userId },
        select: {
          id: true,
          status: true,
          totalPrice: true,
          importDate: true,
          warehouse: { select: { name: true } }
        },
        orderBy: { importDate: 'desc' },
        take: 10
      })
    ]);

    // Get payments with detailed breakdown
    const [invoicePayments, creditInvoicePayments] = await Promise.all([
      prisma.payment.findMany({
        where: {
          invoice: {
            order: { userId }
          },
          status: 'SUCCESS'
        },
        select: {
          id: true,
          amount: true,
          paymentDate: true,
          paymentMethod: true
        },
        orderBy: { paymentDate: 'desc' },
        take: 10
      }),
      prisma.payment.findMany({
        where: {
          creditInvoice: {
            credit: { userId }
          },
          status: 'SUCCESS'
        },
        select: {
          id: true,
          amount: true,
          paymentDate: true,
          paymentMethod: true
        },
        orderBy: { paymentDate: 'desc' },
        take: 10
      })
    ]);
    
    const totalPayments = invoicePayments.length + creditInvoicePayments.length;
    const totalPaymentAmount = 
      invoicePayments.reduce((sum, p) => sum + p.amount, 0) +
      creditInvoicePayments.reduce((sum, p) => sum + p.amount, 0);

    // Get managed stores/warehouses with details
    const [managedStores, managedWarehouses] = await Promise.all([
      prisma.userStore.findMany({
        where: { userId },
        include: {
          store: {
            select: { 
              id: true, 
              name: true, 
              address: true, 
              isActive: true,
              createdAt: true,
              _count: {
                select: {
                  orders: true,
                  exportFabrics: true
                }
              }
            }
          }
        }
      }),
      prisma.warehouseManage.findMany({
        where: { userId },
        include: {
          warehouse: {
            select: { 
              id: true, 
              name: true, 
              address: true, 
              status: true,
              createdAt: true,
              _count: {
                select: {
                  shelf: true,
                  importFabrics: true
                }
              }
            }
          }
        }
      })
    ]);

    // Calculate breakdowns
    const orderStatusBreakdown = {};
    orderByStatus.forEach(o => {
      orderStatusBreakdown[o.status] = (orderStatusBreakdown[o.status] || 0) + 1;
    });

    const exportStatusBreakdown = {};
    exportByStatus.forEach(e => {
      exportStatusBreakdown[e.status] = (exportStatusBreakdown[e.status] || 0) + 1;
    });

    const importStatusBreakdown = {};
    importByStatus.forEach(i => {
      importStatusBreakdown[i.status] = (importStatusBreakdown[i.status] || 0) + 1;
    });

    const creditAvailable = creditInfo ? (creditInfo.creditLimit - creditInfo.creditUsed) : 0;
    const creditUtilization = creditInfo ? ((creditInfo.creditUsed / creditInfo.creditLimit) * 100).toFixed(2) : 0;

    return {
      orderStats: {
        summary: {
          asCustomer: {
            totalOrders: orderStats._count || 0,
            totalSpent: orderStats._sum?.totalAmount || 0,
            averageOrderValue: (orderStats._count && orderStats._count > 0) 
              ? ((orderStats._sum?.totalAmount || 0) / orderStats._count).toFixed(2)
              : 0
          },
          asStaff: {
            totalCreated: createdOrderStats._count || 0,
            totalAmount: createdOrderStats._sum?.totalAmount || 0,
            averageOrderValue: (createdOrderStats._count && createdOrderStats._count > 0)
              ? ((createdOrderStats._sum?.totalAmount || 0) / createdOrderStats._count).toFixed(2)
              : 0
          }
        },
        breakdown: orderStatusBreakdown,
        recentOrders: orderDetails
      },
      exportStats: {
        summary: {
          totalExports: exportStats._count || 0
        },
        breakdown: exportStatusBreakdown,
        recentExports: exportDetails
      },
      importStats: {
        summary: {
          totalImports: importStats._count || 0,
          totalCost: importStats._sum?.totalPrice || 0,
          averageCost: (importStats._count && importStats._count > 0)
            ? ((importStats._sum?.totalPrice || 0) / importStats._count).toFixed(2)
            : 0
        },
        breakdown: importStatusBreakdown,
        recentImports: importDetails
      },
      paymentStats: {
        summary: {
          totalPayments,
          totalAmount: totalPaymentAmount,
          successfulPayments: invoicePayments.length + creditInvoicePayments.length,
          invoicePayments: invoicePayments.length,
          creditPayments: creditInvoicePayments.length,
          averagePayment: totalPayments > 0 ? (totalPaymentAmount / totalPayments).toFixed(2) : 0
        },
        recentPayments: [...invoicePayments, ...creditInvoicePayments]
          .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))
          .slice(0, 10)
      },
      creditInfo: creditInfo ? {
        creditLimit: creditInfo.creditLimit,
        creditUsed: creditInfo.creditUsed,
        creditAvailable,
        utilizationRate: `${creditUtilization}%`,
        status: creditInfo.status,
        createdAt: creditInfo.createdAt,
        isCritical: creditAvailable <= (creditInfo.creditLimit * 0.2) // Cảnh báo khi dùng > 80%
      } : {
        creditLimit: 0,
        creditUsed: 0,
        creditAvailable: 0,
        utilizationRate: '0%',
        status: 'INACTIVE',
        isCritical: false
      },
      creditRequests: {
        total: creditRequests.length,
        data: creditRequests,
        byStatus: {
          PENDING: creditRequests.filter(r => r.status === 'PENDING').length,
          APPROVED: creditRequests.filter(r => r.status === 'APPROVED').length,
          REJECTED: creditRequests.filter(r => r.status === 'REJECTED').length
        },
        byType: {
          INITIAL: creditRequests.filter(r => r.type === 'INITIAL').length,
          INCREASE: creditRequests.filter(r => r.type === 'INCREASE').length,
          DECREASE: creditRequests.filter(r => r.type === 'DECREASE').length
        }
      },
      managedStores: {
        total: managedStores.length,
        details: managedStores.map(us => ({
          id: us.store.id,
          name: us.store.name,
          address: us.store.address,
          isActive: us.store.isActive,
          createdAt: us.store.createdAt,
          ordersCount: us.store._count.orders,
          exportsCount: us.store._count.exportFabrics
        }))
      },
      managedWarehouses: {
        total: managedWarehouses.length,
        details: managedWarehouses.map(wm => ({
          id: wm.warehouse.id,
          name: wm.warehouse.name,
          address: wm.warehouse.address,
          status: wm.warehouse.status,
          createdAt: wm.warehouse.createdAt,
          shelvesCount: wm.warehouse._count.shelf,
          importsCount: wm.warehouse._count.importFabrics
        }))
      }
    };
  }
}

export const userActivityService = new UserActivityService();
