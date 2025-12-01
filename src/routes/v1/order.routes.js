import express from 'express';
import {
  createOrder,
  createOfflineOrder,
  checkCustomerCredit,
  getAllOrders,       
  getMyOrders,    
  getOrderById  
} from '../../controllers/order.controller.js';
import { authenticateToken, requirePermission } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validation.middleware.js';
import {
  createOrderSchema,
  createOfflineOrderSchema,
  orderIdParamSchema,
  getAllOrdersQuerySchema,   
  getMyOrdersQuerySchema
} from '../../validations/order.validation.js';
import { PERMISSIONS } from '../../constants/permissions.js';

const router = express.Router();

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Tạo đơn hàng online (Customer)
 *     description: Khách hàng tạo đơn hàng mới với 2 hình thức thanh toán CASH hoặc CREDIT
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderItems
 *             properties:
 *               orderItems:
 *                 type: array
 *                 minItems: 1
 *                 description: Danh sách sản phẩm trong đơn hàng
 *                 items:
 *                   type: object
 *                   required:
 *                     - fabricId
 *                     - quantity
 *                     - saleUnit
 *                   properties:
 *                     fabricId:
 *                       description: ID vải
 *                       example: "1"
 *                     quantity:
 *                       description: Số lượng (mét chẵn)
 *                       example: "5"
 *                     saleUnit:
 *                       type: string
 *                       enum: [ROLL, METER]
 *                       description: Đơn vị bán (ROLL=cuộn, METER=mét)
 *                       example: METER
 *               paymentType:
 *                 type: string
 *                 enum: [CASH, CREDIT]
 *                 default: CASH
 *                 description: Phương thức thanh toán
 *                 example: CASH
 *               notes:
 *                 type: string
 *                 maxLength: 500
 *                 description: Ghi chú đơn hàng
 *                 example: Giao hàng gấp
 *           examples:
 *             cashOrder:
 *               summary: Đơn trả tiền ngay (CASH)
 *               value:
 *                 orderItems:
 *                   - fabricId: "1"
 *                     quantity: "5"
 *                     saleUnit: METER
 *                   - fabricId: "2"
 *                     quantity: "2"
 *                     saleUnit: ROLL
 *                 paymentType: CASH
 *                 notes: Giao hàng gấp
 *             creditOrder:
 *               summary: Đơn mua nợ (CREDIT)
 *               value:
 *                 orderItems:
 *                   - fabricId: "3"
 *                     quantity: "10"
 *                     saleUnit: METER
 *                 paymentType: CREDIT
 *     responses:
 *       201:
 *         description: Tạo đơn hàng thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example:  Vui lòng thanh toán trong 15 phút.
 *                 data:
 *                   type: object
 *                   properties:
 *                     order:
 *                       $ref: '#/components/schemas/Order'
 *                     paymentAmount:
 *                       description: Số tiền cần thanh toán
 *                       example: "500000"
 *                     deadline:
 *                       type: string
 *                       format: date-time
 *                       description: Hạn thanh toán
 *                     testPayment:
 *                       type: object
 *                       description: Thông tin để test thanh toán
 *                       properties:
 *                         method:
 *                           type: string
 *                           example: POST
 *                         url:
 *                           type: string
 *                           example: /api/v1/orders/1/simulate-payment
 *                         body:
 *                           type: object
 *                           properties:
 *                             success:
 *                               type: boolean
 *                               example: true
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post(
  '/',
  authenticateToken,
  validate(createOrderSchema),
  createOrder
);

/**
 * @swagger
 * /orders/my:
 *   get:
 *     summary: Lấy danh sách đơn hàng của tôi
 *     description: Customer lấy danh sách đơn hàng của mình với filter, search, pagination
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           default: 1
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           maximum: 100
 *           default: 10
 *         description: Số items mỗi trang
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm trong notes
 *         example: giao hàng gấp
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: Sắp xếp theo field
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           default: desc
 *         description: Thứ tự sắp xếp
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter theo status (có thể multi-value cách nhau bởi dấu phẩy - PENDING,PROCESSING,DELIVERED,CANCELED,FAILED)
 *         example: PENDING,PROCESSING
 *       - in: query
 *         name: paymentType
 *         schema:
 *           type: string
 *         description: Filter theo payment type (có thể multi-value - CASH,CREDIT)
 *         example: CASH
 *       - in: query
 *         name: createdFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Lọc từ ngày (YYYY-MM-DD)
 *         example: 2025-11-01
 *       - in: query
 *         name: createdTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Lọc đến ngày (YYYY-MM-DD)
 *         example: 2025-11-30
 *     responses:
 *       200:
 *         description: Lấy danh sách đơn hàng thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Lấy danh sách đơn hàng thành công
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 625
 *                       userId:
 *                         type: string
 *                       user:
 *                         type: object
 *                         properties:
 *                           username:
 *                             type: string
 *                           fullname:
 *                             type: string
 *                           phone:
 *                             type: string
 *                       status:
 *                         type: string
 *                         example: DELIVERED
 *                       paymentType:
 *                         type: string
 *                         example: CASH
 *                       totalAmount:
 *                         type: number
 *                         example: 1425000
 *                       paidAmount:
 *                         type: number
 *                         example: 1425000
 *                       creditAmount:
 *                         type: number
 *                         example: 0
 *                       notes:
 *                         type: string
 *                       orderItems:
 *                         type: array
 *                         items:
 *                           type: object
 *                       invoice:
 *                         type: object
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 5
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     totalPages:
 *                       type: integer
 *                       example: 1
 *       401:
 *         description: Unauthorized - Token không hợp lệ
 *       403:
 *         description: Forbidden - Không có quyền truy cập
 */
router.get('/my',
  authenticateToken,
  requirePermission(PERMISSIONS.ORDERS.VIEW_MY),
  validate(getMyOrdersQuerySchema, 'query'),
  getMyOrders
);


/**
 * @swagger
 * /orders/check-customer-credit:
 *   get:
 *     summary: Kiểm tra tín dụng khách hàng (Staff)
 *     description: Staff kiểm tra xem khách hàng có thể mua nợ không và hạn mức còn lại
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: phone
 *         required: true
 *         schema:
 *           type: string
 *         description: Số điện thoại khách hàng (10 số)
 *         example: "0912345678"
 *     responses:
 *       200:
 *         description: Lấy thông tin thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Lấy thông tin khách hàng thành công
 *                 data:
 *                   type: object
 *                   properties:
 *                     customer:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         fullname:
 *                           type: string
 *                           example: "Nguyễn Văn A"
 *                         phone:
 *                           type: string
 *                           example: "0912345678"
 *                         email:
 *                           type: string
 *                           example: customer@example.com
 *                     canCredit:
 *                       type: boolean
 *                       example: true
 *                       description: Khách có thể mua nợ hay không
 *                     creditLimit:
 *                       type: string
 *                       example: "5000000"
 *                       description: Hạn mức tín dụng còn lại
 *                     reason:
 *                       type: string
 *                       example: Khách hàng chưa đăng ký tín dụng
 *                       description: Lý do không thể mua nợ (nếu có)
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/check-customer-credit',
  authenticateToken,
  requirePermission(PERMISSIONS.ORDERS.CREATE_OFFLINE),
  checkCustomerCredit
);

/**
 * @swagger
 * /orders/offline:
 *   post:
 *     summary: Tạo đơn hàng offline tại cửa hàng (Staff)
 *     description: Staff tạo đơn cho khách mua tại cửa hàng, giao hàng ngay
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerPhone
 *               - orderItems
 *               - paymentType
 *             properties:
 *               customerPhone:
 *                 type: string
 *                 pattern: ^(0[3|5|7|8|9])[0-9]{8}$
 *                 description: Số điện thoại khách hàng
 *                 example: "0912345678"
 *               orderItems:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - fabricId
 *                     - quantity
 *                     - saleUnit
 *                   properties:
 *                     fabricId:
 *                       type: integer
 *                       example: 1
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *                       example: 5
 *                     saleUnit:
 *                       type: string
 *                       enum: [ROLL, METER]
 *                       example: METER
 *               paymentType:
 *                 type: string
 *                 enum: [CASH, CREDIT]
 *                 description: Phương thức thanh toán
 *                 example: CASH
 *               payExcessAmount:
 *                 type: boolean
 *                 description: Khách có trả phần vượt hạn mức không (chỉ dùng cho CREDIT vượt hạn mức)
 *                 example: true
 *               notes:
 *                 type: string
 *                 maxLength: 500
 *                 example: Khách mua tại quầy
 *           examples:
 *             cashOffline:
 *               summary: Offline - Trả tiền ngay
 *               value:
 *                 customerPhone: "0912345678"
 *                 orderItems:
 *                   - fabricId: 1
 *                     quantity: 5
 *                     saleUnit: METER
 *                 paymentType: CASH
 *                 notes: Khách mua tại quầy
 *             creditOffline:
 *               summary: Offline - Mua nợ trong hạn mức
 *               value:
 *                 customerPhone: "0912345678"
 *                 orderItems:
 *                   - fabricId: 2
 *                     quantity: 10
 *                     saleUnit: METER
 *                 paymentType: CREDIT
 *             creditExcess:
 *               summary: Offline - Mua nợ vượt hạn mức (trả phần vượt)
 *               value:
 *                 customerPhone: "0912345678"
 *                 orderItems:
 *                   - fabricId: 3
 *                     quantity: 20
 *                     saleUnit: ROLL
 *                 paymentType: CREDIT
 *                 payExcessAmount: true
 *     responses:
 *       201:
 *         description: Tạo đơn hàng offline thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Tạo đơn hàng thành công. Đã giao hàng cho khách.
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Validation error hoặc khách không thể mua nợ
 *       404:
 *         description: Không tìm thấy khách hàng
 */
router.post('/offline',
  authenticateToken,
  requirePermission(PERMISSIONS.ORDERS.CREATE_OFFLINE),
  validate(createOfflineOrderSchema),
  createOfflineOrder
);

/**
 * @swagger
 * /orders/all:
 *   get:
 *     summary: Lấy tất cả đơn hàng (Admin)
 *     description: Admin lấy tất cả đơn hàng trong hệ thống với filter, search, pagination
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           default: 1
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           default: 10
 *         description: Số items mỗi trang
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm customerPhone
 *         example: 0912345678
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: Sắp xếp theo field
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           default: desc
 *         description: Thứ tự sắp xếp
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter theo status (multi-value - PENDING,PROCESSING,DELIVERED,CANCELED,FAILED)
 *         example: PENDING,PROCESSING
 *       - in: query
 *         name: paymentType
 *         schema:
 *           type: string
 *         description: Filter theo payment type (multi-value - CASH,CREDIT)
 *         example: CASH,CREDIT
 *       - in: query
 *         name: isOffline
 *         schema:
 *           type: string
 *         description: Filter đơn offline hay online
 *         example: true
 *       - in: query
 *         name: createdFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Lọc từ ngày (YYYY-MM-DD)
 *         example: 2025-11-01
 *       - in: query
 *         name: createdTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Lọc đến ngày (YYYY-MM-DD)
 *         example: 2025-11-30
 *     responses:
 *       200:
 *         description: Lấy danh sách đơn hàng thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Lấy danh sách đơn hàng thành công
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 625
 *                       userId:
 *                         type: string
 *                       user:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           username:
 *                             type: string
 *                           fullname:
 *                             type: string
 *                           phone:
 *                             type: string
 *                           email:
 *                             type: string
 *                       orderDate:
 *                         type: string
 *                         format: date-time
 *                       status:
 *                         type: string
 *                         example: PENDING
 *                       paymentType:
 *                         type: string
 *                         example: CASH
 *                       totalAmount:
 *                         type: number
 *                         example: 5000000
 *                       paidAmount:
 *                         type: number
 *                         example: 0
 *                       creditAmount:
 *                         type: number
 *                         example: 0
 *                       paymentDeadline:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                       isOffline:
 *                         type: boolean
 *                         example: false
 *                       customerPhone:
 *                         type: string
 *                         nullable: true
 *                       notes:
 *                         type: string
 *                       orderItems:
 *                         type: array
 *                         items:
 *                           type: object
 *                       invoice:
 *                         type: object
 *                       createdByStaff:
 *                         type: object
 *                         nullable: true
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 150
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     totalPages:
 *                       type: integer
 *                       example: 15
 *       401:
 *         description: Unauthorized - Token không hợp lệ
 *       403:
 *         description: Forbidden - Chỉ Admin mới có quyền
 */
router.get('/all',
  authenticateToken,
  requirePermission(PERMISSIONS.ORDERS.VIEW_LIST),
  validate(getAllOrdersQuerySchema, 'query'),
  getAllOrders
);

/**
 * @swagger
 * /orders/{orderId}:
 *   get:
 *     summary: Xem chi tiết đơn hàng
 *     description: |
 *       Lấy thông tin chi tiết 1 đơn hàng
 *       - Admin/Staff: Xem được tất cả đơn hàng
 *       - Customer: Chỉ xem được đơn hàng của mình
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *         description: ID của đơn hàng
 *         example: 625
 *     responses:
 *       200:
 *         description: Lấy thông tin đơn hàng thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Lấy thông tin đơn hàng thành công
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 625
 *                     userId:
 *                       type: string
 *                       example: 9290175b-ab05-41d6-8a93-52e102ed1078
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: 9290175b-ab05-41d6-8a93-52e102ed1078
 *                         username:
 *                           type: string
 *                           example: customer1
 *                         fullname:
 *                           type: string
 *                           example: Nguyễn Văn A
 *                         phone:
 *                           type: string
 *                           example: 0912345678
 *                         email:
 *                           type: string
 *                           example: customer1@example.com
 *                     orderDate:
 *                       type: string
 *                       format: date-time
 *                       example: 2025-11-22T06:17:11.000Z
 *                     status:
 *                       type: string
 *                       example: DELIVERED
 *                     paymentType:
 *                       type: string
 *                       example: CASH
 *                     totalAmount:
 *                       type: number
 *                       example: 1425000
 *                     paidAmount:
 *                       type: number
 *                       example: 1425000
 *                     creditAmount:
 *                       type: number
 *                       example: 0
 *                     paymentDeadline:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                     isOffline:
 *                       type: boolean
 *                       example: false
 *                     customerPhone:
 *                       type: string
 *                       nullable: true
 *                     notes:
 *                       type: string
 *                       example: Giao hàng gấp
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                     orderItems:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1234
 *                           fabricId:
 *                             type: integer
 *                             example: 1
 *                           quantity:
 *                             type: number
 *                             example: 5
 *                           saleUnit:
 *                             type: string
 *                             example: METER
 *                           price:
 *                             type: number
 *                             example: 285000
 *                           fabric:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               thickness:
 *                                 type: number
 *                               length:
 *                                 type: number
 *                               width:
 *                                 type: number
 *                               category:
 *                                 type: object
 *                                 properties:
 *                                   id:
 *                                     type: integer
 *                                   name:
 *                                     type: string
 *                               color:
 *                                 type: object
 *                               gloss:
 *                                 type: object
 *                     invoice:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 456
 *                         invoiceStatus:
 *                           type: string
 *                           example: PAID
 *                         totalAmount:
 *                           type: number
 *                           example: 1425000
 *                         paidAmount:
 *                           type: number
 *                           example: 1425000
 *                         creditAmount:
 *                           type: number
 *                           example: 0
 *                         dueDate:
 *                           type: string
 *                           format: date-time
 *                         notes:
 *                           type: string
 *                     createdByStaff:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         id:
 *                           type: string
 *                         fullname:
 *                           type: string
 *       400:
 *         description: Bad Request - Customer cố xem đơn của người khác
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Bạn không có quyền xem đơn hàng này
 *       401:
 *         description: Unauthorized - Token không hợp lệ
 *       404:
 *         description: Not Found - Không tìm thấy đơn hàng
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Không tìm thấy đơn hàng
 */
router.get('/:orderId',
  authenticateToken,
  validate(orderIdParamSchema, 'params'),
  getOrderById
);

export default router;