import express from 'express';
import {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
} from '../../controllers/supplier.controller.js';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
import { requirePermission } from '../../middlewares/permission.middleware.js';
import { PERMISSIONS } from '../../constants/permissions.js';
import { validate } from '../../middlewares/validation.middleware.js';
import {
  createSupplierSchema,
  updateSupplierSchema,
  supplierIdParamSchema,
  supplierQuerySchema,
} from '../../validations/supplier.validation.js';

const router = express.Router();

router.use(authenticateToken);

/**
 * @swagger
 * /supplier:
 *   get:
 *     summary: Get all suppliers with pagination and search
 *     tags: [Supplier]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
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
 *         description: Supplier list retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Lấy danh sách supplier thành công
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Supplier'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
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
  requirePermission(PERMISSIONS.FABRICS.MANAGE_SUPPLIER),
  validate(supplierQuerySchema, 'query'),
  getAllSuppliers
);

/**
 * @swagger
 * /supplier/{id}:
 *   get:
 *     summary: Get supplier by id
 *     tags: [Supplier]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string 
 *         example: 1
 *     responses:
 *       200:
 *         description: Supplier retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Lấy thông tin supplier thành công
 *                 data:
 *                   $ref: '#/components/schemas/Supplier'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get(
  '/:id',
  authenticateToken,
  requirePermission(PERMISSIONS.FABRICS.MANAGE_SUPPLIER),
  validate(supplierIdParamSchema, 'params'),
  getSupplierById
);

/**
 * @swagger
 * /supplier:
 *   post:
 *     summary: Create a new supplier
 *     tags: [Supplier]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Nhà cung cấp A
 *               address:
 *                 type: string
 *                 example: "123 Đường ABC, Quận 1, TP.HCM"
 *               phone:
 *                 type: string
 *                 example: "0901234567"
 *     responses:
 *       201:
 *         description: Supplier created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Tạo supplier thành công
 *                 data:
 *                   $ref: '#/components/schemas/Supplier'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       409:
 *         $ref: '#/components/responses/ConflictError'
 */
router.post(
  '/',
  authenticateToken,
  requirePermission(PERMISSIONS.FABRICS.MANAGE_SUPPLIER),
  validate(createSupplierSchema, 'body'),
  createSupplier
);

/**
 * @swagger
 * /supplier/{id}:
 *   put:
 *     summary: Update supplier
 *     tags: [Supplier]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         example: 1
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Nhà cung cấp B
 *               address:
 *                 type: string
 *                 example: "456 Đường DEF, Quận 3, TP.HCM"
 *               phone:
 *                 type: string
 *                 example: "0912345678"
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Supplier updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Cập nhật supplier thành công
 *                 data:
 *                   $ref: '#/components/schemas/Supplier'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       409:
 *         $ref: '#/components/responses/ConflictError'
 */
router.put(
  '/:id',
  authenticateToken,
  requirePermission(PERMISSIONS.FABRICS.MANAGE_SUPPLIER),
  validate(supplierIdParamSchema, 'params'),
  validate(updateSupplierSchema, 'body'),
  updateSupplier
);

export default router;
