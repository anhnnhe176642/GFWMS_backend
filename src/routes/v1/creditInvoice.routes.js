import express from 'express';
import {
  getMyCreditInvoices,
  getCreditInvoiceDetail
} from '../../controllers/creditInvoice.controller.js';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validation.middleware.js';
import { creditInvoiceIdParamSchema } from '../../validations/invoice.validation.js';

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
 *           type: integer
 *           default: 1
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số bản ghi mỗi trang
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Lọc theo trạng thái
 *     responses:
 *       200:
 *         description: Danh sách Credit Invoice
 *       401:
 *         description: Chưa đăng nhập
 */
router.get('/my', authenticateToken, getMyCreditInvoices);

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
 *           type: integer
 *         description: ID của Credit Invoice
 *     responses:
 *       200:
 *         description: Chi tiết Credit Invoice
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Không tìm thấy Credit Invoice
 */
router.get(
  '/:creditInvoiceId',
  authenticateToken,
  validate(creditInvoiceIdParamSchema, 'params'),
  getCreditInvoiceDetail
);

export default router;