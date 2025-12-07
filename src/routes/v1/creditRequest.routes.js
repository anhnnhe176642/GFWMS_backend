import express from 'express';
import { validate } from '../../middlewares/validation.middleware.js';
import { authenticateToken, requirePermission } from '../../middlewares/auth.middleware.js';

import {
  createCreditRequestSchema,
  approveRequestSchema,
  rejectRequestSchema,
  idParamSchema,
  creditRequestQuerySchema
} from '../../validations/creditRequest.validation.js';

import {
  createInitialCreditRequest,
  createIncreaseCreditRequest,
  getAllCreditRequests,
  getCreditRequestById,
  approveRequest,
  rejectRequest,
} from '../../controllers/creditRequest.controller.js';
import { PERMISSIONS } from '../../constants/permissions.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateCreditRequest:
 *       type: object
 *       description: Dữ liệu để tạo một đơn đăng ký nợ / tăng hạn mức
 *       properties:
 *         requestLimit:
 *           type: number
 *           example: 5000000
 *           description: Hạn mức muốn đăng ký
 *         note:
 *           type: string
 *           example: "Cần tăng hạn mức cho dự án X"
 *           description: Ghi chú bổ sung
 *       required:
 *         - requestLimit
 *     UpdateCreditRequestStatus:
 *       type: object
 *       description: Payload để admin duyệt hoặc từ chối đơn
 *       properties:
 *         status:
 *           type: string
 *           enum: [APPROVED, REJECTED]
 *           example: APPROVED
 *           description: Trạng thái của đơn sau khi cập nhật
 *         creditLimit:
 *           type: number
 *           example: 5000000
 *           description: Hạn mức được duyệt (chỉ bắt buộc khi APPROVED)
 *         note:
 *           type: string
 *           example: "Đơn đã được duyệt thành công"
 *           description: Ghi chú khi admin xử lý đơn
 *       required:
 *         - status
 */

/**
 * @swagger
 * /credit-requests:
 *   get:
 *     summary: Lấy danh sách lịch sử đơn hạn mức (INITIAL + INCREASE)
 *     tags: [Credit Request]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm theo tên/email/username của user
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
 *         description: Lấy danh sách thành công
 */
router.get(
  '/',
  authenticateToken,
  requirePermission(PERMISSIONS.CREADIT_REQUEST.VIEW_LIST),
  validate(creditRequestQuerySchema, 'query'),
  getAllCreditRequests
);

/**
 * @swagger
 * /credit-requests/initial:
 *   post:
 *     summary: Tạo đơn đăng ký nợ mới
 *     tags: [Credit Request]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCreditRequest'
 *           example:
 *             requestLimit: 5000000
 *             note: "Đăng ký nợ cho dự án A"
 *     responses:
 *       201:
 *         description: Tạo đơn đăng ký nợ thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 */
router.post(
  '/initial',
   authenticateToken,
   requirePermission(PERMISSIONS.CREADIT_REQUEST.CREATE),
   validate(createCreditRequestSchema), 
   createInitialCreditRequest
  );


/**
 * @swagger
 * /credit-requests/increase:
 *   post:
 *     summary: Tạo đơn tăng hạn mức nợ
 *     tags: [Credit Request]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCreditRequest'
 *           example:
 *             requestLimit: 2000000
 *             note: "Tăng hạn mức cho dự án A"
 *     responses:
 *       201:
 *         description: Tạo đơn tăng hạn mức thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 */
router.post(
  '/increase', 
  authenticateToken,
  requirePermission(PERMISSIONS.CREADIT_REQUEST.CREATE), 
  validate(createCreditRequestSchema), 
  createIncreaseCreditRequest
);



/**
 * @swagger
 * /credit-requests/{id}:
 *   get:
 *     summary: Xem chi tiết một đơn
 *     tags: [Credit Request]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của đơn cần xem
 *     responses:
 *       200:
 *         description: Lấy chi tiết thành công
 *       404:
 *         description: Không tìm thấy
 */
router.get(
  '/:id',
  authenticateToken,
  requirePermission(PERMISSIONS.CREADIT_REQUEST.VIEW_DETAIL),
  validate(idParamSchema, 'params'),
  getCreditRequestById
);

/**
 * @swagger
 * /credit-requests/{id}/approve:
 *   patch:
 *     summary: Duyệt đơn đăng ký nợ hoặc tăng hạn mức (Admin có thể chỉnh hạn mức)
 *     tags: [Credit Request]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của đơn cần duyệt
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCreditRequestStatus'
 *           example:
 *             status: "APPROVED"
 *             requestLimit: 5000000
 *             note: "Duyệt đơn và chỉnh hạn mức nếu cần"
 *     responses:
 *       200:
 *         description: Duyệt thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy đơn
 */
router.patch(
  '/:id/approve',
  authenticateToken,
  requirePermission(PERMISSIONS.CREADIT_REQUEST.APPROVE),
  validate(idParamSchema, 'params'),
  validate(approveRequestSchema), 
  approveRequest
);


/**
 * @swagger
 * /credit-requests/{id}/reject:
 *   patch:
 *     summary: Từ chối đơn đăng ký nợ hoặc tăng hạn mức
 *     tags: [Credit Request]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của đơn cần từ chối
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCreditRequestStatus'
 *           example:
 *             status: "REJECTED"
 *             note: "Từ chối đơn"
 *     responses:
 *       200:
 *         description: Từ chối thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy đơn
 */
router.patch(
  '/:id/reject',
  authenticateToken,
  requirePermission(PERMISSIONS.CREADIT_REQUEST.REJECT),
  validate(idParamSchema, 'params'),
  validate(rejectRequestSchema),
  rejectRequest
);



export default router;
