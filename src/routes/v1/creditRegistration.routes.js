import express from 'express';
import {
  createCreditRegistration,
  getAllCreditRegistrations,
  getCreditRegistrationById,
  updateCreditRegistrationStatus,
  getCreditSummary 
} from '../../controllers/creditRegistration.controller.js';

import { authenticateToken, requirePermission } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validation.middleware.js';

import {
  createCreditRegistrationSchema,
  creditRegistrationQuerySchema,
  uuidParamSchema,
  updateCreditStatusSchema
} from '../../validations/creditRegistration.validation.js';

import { PERMISSIONS } from '../../constants/permissions.js';

const router = express.Router();

router.use(authenticateToken);

/**
 * @swagger
 * /credit-registrations:
 *   get:
 *     summary: Lấy danh sách đăng ký hạn mức tín dụng
 *     tags: [Credit Registration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm theo tên / email / username của user
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
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
 *         description: Lấy danh sách thành công
 */
router.get(
  '/',
  requirePermission(PERMISSIONS.CREDIT_REGISTRATION.VIEW_LIST),
  validate(creditRegistrationQuerySchema, 'query'),
  getAllCreditRegistrations
);

/**
 * @swagger
 * /credit-registrations:
 *   post:
 *     summary: Tạo đăng ký hạn mức tín dụng cho user
 *     tags: [Credit Registration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               note:
 *                 type: string
 *             required:
 *               - userId
 *               - creditLimit
 *     responses:
 *       201:
 *         description: Tạo đăng ký thành công
 */
router.post(
  '/',
  requirePermission(PERMISSIONS.CREDIT_REGISTRATION.CREATE),
  validate(createCreditRegistrationSchema),
  createCreditRegistration
);

/**
 * @swagger
 * /credit-registrations/{id}:
 *   get:
 *     summary: Lấy thông tin chi tiết một đăng ký hạn mức tín dụng
 *     tags: [Credit Registration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của bản ghi đăng ký
 *     responses:
 *       200:
 *         description: Lấy thành công
 *       404:
 *         description: Không tìm thấy
 */
router.get(
  '/:id',
  requirePermission(PERMISSIONS.CREDIT_REGISTRATION.VIEW_DETAIL),
  validate(uuidParamSchema, 'params'),
  getCreditRegistrationById
);

/**
 * @swagger
 * /credit-registrations/{id}/status:
 *   patch:
 *     summary: Cập nhật trạng thái đăng ký tín dụng (approve/reject)
 *     tags: [Credit Registration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID đăng ký
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [APPROVED, REJECTED]
 *                 description: Trạng thái mới của đơn
 *               creditLimit:
 *                 type: number
 *                 description: Giới hạn tín dụng mới (chỉ dùng khi APPROVED)
 *             required:
 *               - status
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Trạng thái không hợp lệ hoặc đơn đã được xử lý
 *       404:
 *         description: Không tìm thấy đăng ký
 */
router.patch(
  '/:id/status',
  requirePermission(PERMISSIONS.CREDIT_REGISTRATION.CHANGE_STATUS),
  validate([
    { schema: uuidParamSchema, source: 'params' },
    { schema: updateCreditStatusSchema, source: 'body' }
  ]),
  updateCreditRegistrationStatus
);

/**
 * @swagger
 * /credit-registrations/credit-score/{userId}:
 *   get:
 *     summary: Lấy điểm uy tín và gợi ý creditLimit
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
 *       404:
 *         description: Người dùng không tồn tại
 */
router.get('/credit-score/:userId', getCreditSummary);
export default router;
