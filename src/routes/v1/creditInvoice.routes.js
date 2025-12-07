import express from 'express';
import {
  getMyCreditInvoices,
  getAllCreditInvoices,
  getCreditInvoiceDetail,
} from '../../controllers/creditInvoice.controller.js';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
import { requirePermission } from '../../middlewares/permission.middleware.js';
import { validate } from '../../middlewares/validation.middleware.js';
import { 
  creditInvoiceIdParamSchema,
  creditInvoiceQuerySchema 
} from '../../validations/invoice.validation.js';
import { PERMISSIONS } from '../../constants/permissions.js';

const router = express.Router();

/**
 * @swagger
 * /credit-invoices/my:
 *   get:
 *     summary: Lấy danh sách Credit Invoice của tôi
 *     tags: [Credit Invoice]
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
 *         description: Số bản ghi mỗi trang
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Lọc theo trạng thái
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Sắp xếp theo trường
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           default: desc
 *         description: Thứ tự sắp xếp
 *     responses:
 *       200:
 *         description: Danh sách Credit Invoice
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
 *                     type: object
 *                 pagination:
 *                   type: object
 *       400:
 *         description: Validation error
 *       401:
 *         description: Chưa đăng nhập
 */
router.get('/my',
  authenticateToken,
  requirePermission(PERMISSIONS.CREDIT_INVOICES.VIEW_MY),
  validate([{ schema: creditInvoiceQuerySchema, source: 'query' }]),
  getMyCreditInvoices
);

/**
 * @swagger
 * /credit-invoices:
 *   get:
 *     summary: Lấy tất cả Credit Invoice
 *     description: Chỉ Admin và Staff mới có quyền xem tất cả Credit Invoice
 *     tags: [Credit Invoice]
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
 *         description: Số bản ghi mỗi trang
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo tên, email, số điện thoại khách hàng
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Lọc theo trạng thái
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Sắp xếp theo trường
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           default: desc
 *         description: Thứ tự sắp xếp
 *     responses:
 *       200:
 *         description: Danh sách Credit Invoice
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền
 */
router.get('/',
  authenticateToken,
  requirePermission(PERMISSIONS.CREDIT_INVOICES.VIEW_LIST),
  validate([{ schema: creditInvoiceQuerySchema, source: 'query' }]),
  getAllCreditInvoices
);

/**
 * @swagger
 * /credit-invoices/{creditInvoiceId}:
 *   get:
 *     summary: Xem chi tiết Credit Invoice
 *     tags: [Credit Invoice]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: creditInvoiceId
 *         required: true
 *         schema:
 *         description: ID của Credit Invoice
 *     responses:
 *       200:
 *         description: Chi tiết Credit Invoice
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền
 *       404:
 *         description: Không tìm thấy Credit Invoice
 */
router.get('/:creditInvoiceId',
  authenticateToken,
  requirePermission(PERMISSIONS.CREDIT_INVOICES.VIEW_DETAIL),
  validate([{ schema: creditInvoiceIdParamSchema, source: 'params' }]),
  getCreditInvoiceDetail
);

export default router;