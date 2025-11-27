import express from 'express';
import {
  createPaymentQRCode,
  handlePayOSWebhook,
  checkPaymentStatus,
  retryPayment
} from '../../controllers/payment.controller.js';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validation.middleware.js';
import { orderIdParamSchema } from '../../validations/order.validation.js';

const router = express.Router();

/**
 * @swagger
 * /orders/{orderId}/payment/qr-code:
 *   post:
 *     summary: Tạo mã QR thanh toán PayOS
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *         example: 101
 *     responses:
 *       200:
 *         description: Tạo QR thành công
 */
router.post(
  '/orders/:orderId/payment/qr-code',
  authenticateToken,
  validate(orderIdParamSchema, 'params'),
  createPaymentQRCode
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
 * /orders/{orderId}/payment/status:
 *   get:
 *     summary: Check payment status
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Status retrieved
 */
router.get('/orders/:orderId/payment/status',
  authenticateToken,
  validate(orderIdParamSchema, 'params'),
  checkPaymentStatus
);

/**
 * @swagger
 * /orders/{orderId}/payment/retry:
 *   post:
 *     summary: Retry payment
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *     responses:
 *       200:
 *         description: New QR created
 */
router.post(
  '/orders/:orderId/payment/retry',
  authenticateToken,
  validate(orderIdParamSchema, 'params'),
  retryPayment
);

export default router;