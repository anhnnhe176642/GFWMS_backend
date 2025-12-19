import express from 'express';
import {
  getDashboardOverview,
  getFullDashboard,
  getTotalRevenue,
  getRevenueByPeriod,
  getRevenueByCategory,
  getRevenueByColor,
  getRevenueByStore,
  getProfitStatistics,
  getProfitByProduct,
  getOrderStatistics,
  getDailyOrders,
  getTopCustomers,
  getPurchaseFrequency,
  getLowStockFabrics,
  getLowStockByCategory,
  getSalesByDay
} from '../../controllers/dashboard.controller.js';
import { authenticateToken, requirePermission } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validation.middleware.js';
import {
  dashboardOverviewQuerySchema,
  fullDashboardQuerySchema,
  revenueByPeriodQuerySchema,
  revenueByStoreQuerySchema,
  profitByProductQuerySchema,
  topCustomersQuerySchema,
  lowStockQuerySchema,
  dateRangeQuerySchema
} from '../../validations/dashboard.validation.js';
import { PERMISSIONS } from '../../constants/permissions.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     DashboardOverview:
 *       type: object
 *       properties:
 *         totalRevenue:
 *           type: number
 *           description: Tổng doanh thu
 *         grossProfit:
 *           type: number
 *           description: Lợi nhuận gộp
 *         profitMargin:
 *           type: number
 *           description: Biên lợi nhuận (%)
 *         totalOrders:
 *           type: integer
 *           description: Tổng số đơn hàng
 *         completedOrders:
 *           type: integer
 *           description: Số đơn hoàn thành
 *         averageOrderValue:
 *           type: number
 *           description: Giá trị đơn hàng trung bình (AOV)
 *         totalRollsSold:
 *           type: integer
 *           description: Tổng số cuộn vải đã bán
 *         totalMetersSold:
 *           type: number
 *           description: Tổng số mét vải đã bán
 *         totalCustomers:
 *           type: integer
 *           description: Tổng số khách hàng
 *         lowStockAlerts:
 *           type: integer
 *           description: Số lượng cảnh báo hết hàng
 *     RevenueByPeriod:
 *       type: object
 *       properties:
 *         period:
 *           type: string
 *           description: Kỳ thống kê (ngày/tháng/năm)
 *         revenue:
 *           type: number
 *           description: Doanh thu
 *         profit:
 *           type: number
 *           description: Lợi nhuận
 *         orderCount:
 *           type: integer
 *           description: Số đơn hàng
 *     RevenueByCategory:
 *       type: object
 *       properties:
 *         categoryId:
 *           type: integer
 *         categoryName:
 *           type: string
 *         revenue:
 *           type: number
 *         profit:
 *           type: number
 *         quantity:
 *           type: integer
 *         rollsSold:
 *           type: integer
 *         metersSold:
 *           type: number
 *     ProfitStatistics:
 *       type: object
 *       properties:
 *         totalRevenue:
 *           type: number
 *           description: Tổng doanh thu
 *         totalCost:
 *           type: number
 *           description: Tổng chi phí
 *         grossProfit:
 *           type: number
 *           description: Lợi nhuận gộp
 *         netProfit:
 *           type: number
 *           description: Lợi nhuận ròng
 *         profitMargin:
 *           type: number
 *           description: Biên lợi nhuận (%)
 *         orderCount:
 *           type: integer
 *           description: Số đơn hàng
 *     OrderStatistics:
 *       type: object
 *       properties:
 *         totalOrders:
 *           type: integer
 *         completedOrders:
 *           type: integer
 *         canceledOrders:
 *           type: integer
 *         pendingOrders:
 *           type: integer
 *         processingOrders:
 *           type: integer
 *         averageOrderValue:
 *           type: number
 *         ordersByStatus:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *               count:
 *                 type: integer
 *               totalAmount:
 *                 type: number
 *         ordersByType:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [ONLINE, OFFLINE]
 *               count:
 *                 type: integer
 *               totalAmount:
 *                 type: number
 *     TopCustomer:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *         username:
 *           type: string
 *         fullname:
 *           type: string
 *         phone:
 *           type: string
 *         email:
 *           type: string
 *         totalSpent:
 *           type: number
 *         orderCount:
 *           type: integer
 *         rollsBought:
 *           type: integer
 *         metersBought:
 *           type: number
 *         averageOrderValue:
 *           type: number
 *     LowStockFabric:
 *       type: object
 *       properties:
 *         fabricId:
 *           type: integer
 *         categoryName:
 *           type: string
 *         colorName:
 *           type: string
 *         hexCode:
 *           type: string
 *         uncutRolls:
 *           type: integer
 *         totalMeters:
 *           type: number
 *         status:
 *           type: string
 *           enum: [LOW_STOCK, OUT_OF_STOCK]
 */

/**
 * @swagger
 * /dashboard/overview:
 *   get:
 *     summary: Lấy tổng quan dashboard
 *     description: Trả về các chỉ số chính của dashboard bao gồm doanh thu, lợi nhuận, đơn hàng
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày bắt đầu (YYYY-MM-DD)
 *         example: "2024-01-01"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày kết thúc (YYYY-MM-DD)
 *         example: "2024-12-31"
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: integer
 *         description: ID cửa hàng để lọc
 *         example: 1
 *     responses:
 *       200:
 *         description: Lấy tổng quan dashboard thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/DashboardOverview'
 */
router.get('/overview',
  authenticateToken,
  requirePermission(PERMISSIONS.DASHBOARD_VIEW),
  validate(dashboardOverviewQuerySchema, 'query'),
  getDashboardOverview
);

/**
 * @swagger
 * /dashboard/full:
 *   get:
 *     summary: Lấy toàn bộ dữ liệu dashboard
 *     description: Trả về tất cả thống kê dashboard trong một API call
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày bắt đầu (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày kết thúc (YYYY-MM-DD)
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: integer
 *         description: ID cửa hàng
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, month, year]
 *           default: day
 *         description: Kỳ thống kê doanh thu
 *     responses:
 *       200:
 *         description: Lấy toàn bộ dữ liệu dashboard thành công
 */
router.get('/full',
  authenticateToken,
  requirePermission(PERMISSIONS.DASHBOARD_VIEW),
  validate(fullDashboardQuerySchema, 'query'),
  getFullDashboard
);

/**
 * @swagger
 * /dashboard/revenue/total:
 *   get:
 *     summary: Lấy tổng doanh thu
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lấy tổng doanh thu thành công
 */
router.get('/revenue/total',
  authenticateToken,
  requirePermission(PERMISSIONS.DASHBOARD_VIEW),
  validate(dateRangeQuerySchema, 'query'),
  getTotalRevenue
);

/**
 * @swagger
 * /dashboard/revenue/by-period:
 *   get:
 *     summary: Lấy doanh thu theo kỳ (ngày/tháng/năm)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, month, year]
 *           default: day
 *         description: Kỳ thống kê
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lấy doanh thu theo kỳ thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/RevenueByPeriod'
 */
router.get('/revenue/by-period',
  authenticateToken,
  requirePermission(PERMISSIONS.DASHBOARD_VIEW),
  validate(revenueByPeriodQuerySchema, 'query'),
  getRevenueByPeriod
);

/**
 * @swagger
 * /dashboard/revenue/by-category:
 *   get:
 *     summary: Lấy doanh thu theo loại vải
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lấy doanh thu theo loại vải thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/RevenueByCategory'
 */
router.get('/revenue/by-category',
  authenticateToken,
  requirePermission(PERMISSIONS.DASHBOARD_VIEW),
  validate(dateRangeQuerySchema, 'query'),
  getRevenueByCategory
);

/**
 * @swagger
 * /dashboard/revenue/by-color:
 *   get:
 *     summary: Lấy doanh thu theo màu sắc
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lấy doanh thu theo màu sắc thành công
 */
router.get('/revenue/by-color',
  authenticateToken,
  requirePermission(PERMISSIONS.DASHBOARD_VIEW),
  validate(dateRangeQuerySchema, 'query'),
  getRevenueByColor
);

/**
 * @swagger
 * /dashboard/revenue/by-store:
 *   get:
 *     summary: Lấy doanh thu theo cửa hàng
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Lấy doanh thu theo cửa hàng thành công
 */
router.get('/revenue/by-store',
  authenticateToken,
  requirePermission(PERMISSIONS.DASHBOARD_VIEW),
  validate(revenueByStoreQuerySchema, 'query'),
  getRevenueByStore
);

/**
 * @swagger
 * /dashboard/profit:
 *   get:
 *     summary: Lấy thống kê lợi nhuận
 *     description: Trả về lợi nhuận gộp, lợi nhuận ròng, biên lợi nhuận
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lấy thống kê lợi nhuận thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/ProfitStatistics'
 */
router.get('/profit',
  authenticateToken,
  requirePermission(PERMISSIONS.DASHBOARD_VIEW),
  validate(dateRangeQuerySchema, 'query'),
  getProfitStatistics
);

/**
 * @swagger
 * /dashboard/profit/by-product:
 *   get:
 *     summary: Lấy lợi nhuận theo sản phẩm
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Số lượng sản phẩm trả về
 *     responses:
 *       200:
 *         description: Lấy lợi nhuận theo sản phẩm thành công
 */
router.get('/profit/by-product',
  authenticateToken,
  requirePermission(PERMISSIONS.DASHBOARD_VIEW),
  validate(profitByProductQuerySchema, 'query'),
  getProfitByProduct
);

/**
 * @swagger
 * /dashboard/orders:
 *   get:
 *     summary: Lấy thống kê đơn hàng
 *     description: Tổng đơn, đơn hoàn thành/hủy/hoàn, AOV
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lấy thống kê đơn hàng thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/OrderStatistics'
 */
router.get('/orders',
  authenticateToken,
  requirePermission(PERMISSIONS.DASHBOARD_VIEW),
  validate(dateRangeQuerySchema, 'query'),
  getOrderStatistics
);

/**
 * @swagger
 * /dashboard/orders/daily:
 *   get:
 *     summary: Lấy đơn hàng theo ngày
 *     description: Chi tiết đơn hàng mỗi ngày bao gồm doanh thu, lợi nhuận, số cuộn/mét bán
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lấy đơn hàng theo ngày thành công
 */
router.get('/orders/daily',
  authenticateToken,
  requirePermission(PERMISSIONS.DASHBOARD_VIEW),
  validate(dateRangeQuerySchema, 'query'),
  getDailyOrders
);

/**
 * @swagger
 * /dashboard/customers/top:
 *   get:
 *     summary: Lấy top khách hàng
 *     description: Danh sách khách hàng mua nhiều nhất
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số lượng khách hàng trả về
 *     responses:
 *       200:
 *         description: Lấy top khách hàng thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TopCustomer'
 */
router.get('/customers/top',
  authenticateToken,
  requirePermission(PERMISSIONS.DASHBOARD_VIEW),
  validate(topCustomersQuerySchema, 'query'),
  getTopCustomers
);

/**
 * @swagger
 * /dashboard/customers/frequency:
 *   get:
 *     summary: Lấy tần suất mua hàng
 *     description: Thống kê tần suất mua hàng của khách hàng
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lấy tần suất mua hàng thành công
 */
router.get('/customers/frequency',
  authenticateToken,
  requirePermission(PERMISSIONS.DASHBOARD_VIEW),
  validate(dateRangeQuerySchema, 'query'),
  getPurchaseFrequency
);

/**
 * @swagger
 * /dashboard/inventory/low-stock:
 *   get:
 *     summary: Lấy danh sách vải sắp hết
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: integer
 *         description: ID cửa hàng (không bắt buộc, nếu không có sẽ lấy tất cả)
 *       - in: query
 *         name: threshold
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Ngưỡng số cuộn để cảnh báo
 *     responses:
 *       200:
 *         description: Lấy danh sách vải sắp hết thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LowStockFabric'
 */
router.get('/inventory/low-stock',
  authenticateToken,
  requirePermission(PERMISSIONS.DASHBOARD_VIEW),
  validate(lowStockQuerySchema, 'query'),
  getLowStockFabrics
);

/**
 * @swagger
 * /dashboard/inventory/low-stock-by-category:
 *   get:
 *     summary: Lấy vải sắp hết theo loại và màu
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: threshold
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Lấy vải sắp hết theo loại và màu thành công
 */
router.get('/inventory/low-stock-by-category',
  authenticateToken,
  requirePermission(PERMISSIONS.DASHBOARD_VIEW),
  validate(lowStockQuerySchema, 'query'),
  getLowStockByCategory
);

/**
 * @swagger
 * /dashboard/sales/daily:
 *   get:
 *     summary: Lấy doanh số theo ngày
 *     description: Chi tiết doanh số mỗi ngày với breakdown theo loại vải và màu sắc
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lấy doanh số theo ngày thành công
 */
router.get('/sales/daily',
  authenticateToken,
  requirePermission(PERMISSIONS.DASHBOARD_VIEW),
  validate(dateRangeQuerySchema, 'query'),
  getSalesByDay
);

export default router;
