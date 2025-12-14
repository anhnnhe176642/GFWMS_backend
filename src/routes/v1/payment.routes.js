import express from 'express';
import {
  createInvoicePaymentQR,
  createCreditInvoicePaymentQR,
  handlePayOSWebhook,
  checkInvoicePaymentStatus,
  checkCreditInvoicePaymentStatus,
  confirmOfflinePayment
} from '../../controllers/payment.controller.js';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validation.middleware.js';
import { creditInvoiceIdParamSchema, invoiceIdParamSchema,  } from '../../validations/invoice.validation.js';

const router = express.Router();

/**
 * @swagger
 * /invoices/{invoiceId}/payment/qr-code:
 *   post:
 *     summary: Tạo mã QR thanh toán cho Invoice
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Tạo QR thành công
 */
router.post(
  '/invoices/:invoiceId/payment/qr-code',
  authenticateToken,
  validate(invoiceIdParamSchema, 'params'),
  createInvoicePaymentQR
);

/**
 * @swagger
 * /payment/payos-webhook:
 *   post:
 *     summary: Webhook từ PayOS
 *     tags: [Payment]
 *     responses:
 *       200:
 *         description: Webhook processed
 */
router.post('/payment/payos-webhook', handlePayOSWebhook);

/**
 * @swagger
 * /invoices/{invoiceId}/payment/status:
 *   get:
 *     summary: Kiểm tra trạng thái thanh toán Invoice
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của Invoice cần kiểm tra
 *     responses:
 *       200:
 *         description: Thông tin trạng thái thanh toán
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 invoiceId:
 *                   type: integer
 *                 paymentId:
 *                   type: integer
 *                 status:
 *                   type: string
 *                   enum: [SUCCESS, PENDING, FAILED]
 *                 amount:
 *                   type: number
 *                 paymentDate:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Không tìm thấy Invoice
 */
router.get(
  '/invoices/:invoiceId/payment/status',
  authenticateToken,
  validate(invoiceIdParamSchema, 'params'),
  checkInvoicePaymentStatus
);

/**
 * @swagger
 * /credit-invoices/{creditInvoiceId}/payment/qr-code:
 *   post:
 *     summary: Tạo mã QR thanh toán cho Credit Invoice (gom tháng)
 *     tags: [Payment]
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
 *         description: Tạo QR thành công
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Không tìm thấy Credit Invoice
 */
router.post(
  '/credit-invoices/:creditInvoiceId/payment/qr-code',
  authenticateToken,
  validate(creditInvoiceIdParamSchema, 'params'),
  createCreditInvoicePaymentQR
);

/**
 * @swagger
 * /credit-invoices/{creditInvoiceId}/payment/status:
 *   get:
 *     summary: Kiểm tra trạng thái thanh toán Credit Invoice
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: creditInvoiceId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của Credit Invoice cần kiểm tra
 *     responses:
 *       200:
 *         description: Thông tin trạng thái thanh toán
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Không tìm thấy Credit Invoice
 */
router.get(
  '/credit-invoices/:creditInvoiceId/payment/status',
  authenticateToken,
  validate(creditInvoiceIdParamSchema, 'params'),
  checkCreditInvoicePaymentStatus
);


/**
 * @swagger
 * /invoices/{invoiceId}/confirm-offline-payment:
 *   post:
 *     summary: Xác nhận thanh toán offline bằng tiền mặt
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name:  invoiceId
 *         required: true
 *         schema:  
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:  
 *         application/json: 
 *           schema: 
 *             type: object
 *             required:
 *               - confirmed
 *               - amountPaid
 *             properties:
 *               confirmed:  
 *                 type:  boolean
 *                 example:  true
 *               amountPaid:
 *                 type: number
 *                 example: 500000
 *     responses: 
 *       200:
 *         description:  Xác nhận thanh toán thành công
 */
router.post(
  '/invoices/:invoiceId/confirm-offline-payment',
  authenticateToken,
  validate(invoiceIdParamSchema, 'params'),
  confirmOfflinePayment
);

export default router;