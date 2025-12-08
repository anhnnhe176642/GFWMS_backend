import express from 'express';
import {
  getAllCreditRegistrations,
  getCreditRegistrationById,
  getCreditSummary
} from '../../controllers/creditRegistration.controller.js';

import { authenticateToken, requirePermission } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validation.middleware.js';

import {
  creditRegistrationQuerySchema,
  idParamSchema,
} from '../../validations/creditRegistration.validation.js';

import { PERMISSIONS } from '../../constants/permissions.js';

const router = express.Router();
router.use(authenticateToken);


/**
 * @swagger
 * /credit-registrations:
 *   get:
 *     summary: Lấy danh sách tất cả đăng ký hạn mức tín dụng
 *     tags: [Credit Registration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm theo tên/email/username
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Lọc theo trạng thái
 *       - in: query
 *         name: uuid
 *         schema:
 *           type: string
 *         description: Lọc theo uuid
 *       - in: query
 *         name: page
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get(
  '/',
  requirePermission(PERMISSIONS.CREADIT_REGISTRATION.VIEW_DETAIL),
  validate(creditRegistrationQuerySchema, 'query'),
  getAllCreditRegistrations
);

/**
 * @swagger
 * /credit-registrations/{id}:
 *   get:
 *     summary: Lấy chi tiết một đăng ký hạn mức
 *     tags: [Credit Registration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của bản ghi
 *     responses:
 *       200:
 *         description: Thành công
 *       404:
 *         description: Không tìm thấy
 */
router.get(
  '/:id',
  requirePermission(PERMISSIONS.CREADIT_REGISTRATION.VIEW_DETAIL),
  validate(idParamSchema, 'params'),
  getCreditRegistrationById
);

/**
 * @swagger
 * /credit-registrations/credit-score/{userId}:
 *   get:
 *     summary: Lấy điểm uy tín và gợi ý hạn mức tín dụng của khách hàng
 *     tags: [Credit Registration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của khách hàng
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreditScore'
 *             example:
 *               creditScore: 750
 *               suggestedCreditLimit: 10000000
 *       404:
 *         description: Không tìm thấy khách hàng
 */
router.get(
  '/credit-score/:userId', 
  requirePermission(PERMISSIONS.CREADIT_REGISTRATION.CREDIT_SCORE),
  getCreditSummary
);

export default router;
