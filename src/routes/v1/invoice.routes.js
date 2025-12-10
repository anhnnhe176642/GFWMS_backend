import express from 'express';
import {
  getAllInvoices,
  getInvoiceById
} from '../../controllers/invoice.controller.js';
import { authenticateToken, requirePermission } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validation.middleware.js';
import {
  invoiceIdParamSchema,
  invoiceQuerySchema
} from '../../validations/invoice.validation.js';
import { PERMISSIONS } from '../../constants/permissions.js';

const router = express.Router();

/**
 * @swagger
 * /invoices:
 *   get:
 *     summary: Lấy danh sách hóa đơn (có phân trang, tìm kiếm và lọc)
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: string
 *         description: Số trang cần lấy
 *       - in: query
 *         name: limit
 *         schema:
 *           type: string
 *         description: Số lượng hóa đơn mỗi trang
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm theo tên khách hàng hoặc email khách
 *       - in: query
 *         name: invoiceStatus
 *         schema:
 *           type: string
 *         description: Lọc theo trạng thái hóa đơn
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Trường để sắp xếp
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *         description: Thứ tự sắp xếp
 *     responses:
 *       200:
 *         description: Lấy danh sách hóa đơn thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Lấy danh sách hóa đơn thành công
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Invoice'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *             example:
 *               message: Lấy danh sách hóa đơn thành công
 *               data:
 *                 - id: 1
 *                   orderId: 10
 *                   invoiceDate: "2025-10-01T10:00:00.000Z"
 *                   dueDate: "2025-10-10T10:00:00.000Z"
 *                   invoiceStatus: "UNPAID"
 *                   totalAmount: 1250000
 *                   notes: "Thanh toán sau"
 *                   createdAt: "2025-10-01T10:00:00.000Z"
 *                   updatedAt: "2025-10-05T12:00:00.000Z"
 *                   order:
 *                     id: 10
 *                     customerName: "Nguyễn Văn A"
 *               pagination:
 *                 page: 1
 *                 limit: 10
 *                 total: 25
 *                 totalPages: 3
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

router.get(
  '/',
  authenticateToken,
  requirePermission(PERMISSIONS.INVOICES.VIEW_LIST),
  validate(invoiceQuerySchema, 'query'),
  getAllInvoices
);


/**
 * @swagger
 * /invoices/{id}:
 *   get:
 *     summary: Lấy chi tiết một hóa đơn
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         description: ID của hóa đơn
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lấy chi tiết hóa đơn thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Invoice'
 *             example:
 *               message: Lấy chi tiết hóa đơn thành công
 *               data:
 *                 id: 1
 *                 orderId: 10
 *                 invoiceDate: "2025-10-01T10:00:00.000Z"
 *                 dueDate: "2025-10-10T10:00:00.000Z"
 *                 invoiceStatus: "PAID"
 *                 totalAmount: 1250000
 *                 notes: "Khách đã thanh toán đủ"
 *                 payment:
 *                   id: 3
 *                   amountPaid: 1250000
 *                   paymentDate: "2025-10-10T08:00:00.000Z"
 *                 order:
 *                   id: 10
 *                   customerName: "Nguyễn Văn A"
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

router.get(
  '/:invoiceId',
  authenticateToken,
  requirePermission(PERMISSIONS.INVOICES.VIEW_DETAIL),
  validate(invoiceIdParamSchema, 'params'),
  getInvoiceById
);

export default router;
