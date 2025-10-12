import express from 'express';
import {
  getAllFabrics,
  getFabricById,
  createFabric,
  updateFabric
} from '../controllers/fabric.controller.js';
import { authenticateToken, requirePermission } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validation.middleware.js';
import {
  createFabricSchema,
  updateFabricSchema,
  fabricIdParamSchema
} from '../validations/fabric.validation.js';
import { PERMISSIONS } from '../constants/permissions.js';

const router = express.Router();

// Lấy danh sách Fabric
/**
 * @swagger
 * /fabrics:
 *   get:
 *     summary: Get all fabrics with advanced filtering and pagination
 *     tags: [Fabrics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number (min 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Items per page (max 100)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           maxLength: 100
 *         description: Search keyword (supports searching by color, category, gloss, supplier)
 *         example: "silk"
 *       - in: query
 *         name: gloss
 *         schema:
 *           type: string
 *         description: Filter by gloss description. Can be single or comma-separated values.
 *         example: "Mờ,Bóng"
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category name. Single or multiple values separated by commas.
 *         example: "Cotton,Lụa"
 *       - in: query
 *         name: color
 *         schema:
 *           type: string
 *         description: Filter by color name. Single or multiple values separated by commas.
 *         example: "Đỏ,Xanh"
 *       - in: query
 *         name: supplier
 *         schema:
 *           type: string
 *         description: Filter by supplier name. Single or multiple values separated by commas.
 *         example: "Nhà cung cấp A,Nhà cung cấp B"
 *       - in: query
 *         name: thickness
 *         schema:
 *           type: number
 *         description: Filter by fabric thickness (mm)
 *         example: 0.25
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Sort field (thickness, price, stock, created)
 *         example: "price"
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *         description: Sort order (ascending or descending)
 *         example: "asc"
 *     responses:
 *       200:
 *         description: Fabrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - message
 *                 - data
 *                 - pagination
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Lấy danh sách fabrics thành công
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Fabric'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *             example:
 *               message: Lấy danh sách fabrics thành công
 *               data:
 *                 - id: 1
 *                   thickness: 0.25
 *                   gloss:
 *                     id: 1
 *                     description: "Bóng"
 *                   length: 50
 *                   width: 1.5
 *                   weight: 2.5
 *                   sellingPrice: 150000
 *                   quantityInStock: 100
 *                   category:
 *                     id: 2
 *                     name: "Cotton"
 *                   color:
 *                     id: 3
 *                     name: "Đỏ"
 *                   supplier:
 *                     id: 5
 *                     name: "Nhà cung cấp A"
 *                   createdAt: "2025-10-01T10:00:00.000Z"
 *                   updatedAt: "2025-10-05T12:00:00.000Z"
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
  requirePermission(PERMISSIONS.FABRICS.VIEW_LIST.key),
  getAllFabrics
);


// Lấy chi tiết Fabric
/**
 * @swagger
 * /fabrics/{id}:
 *   get:
 *     summary: Lấy chi tiết một vải
 *     tags: [Fabrics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của vải
 *     responses:
 *       200:
 *         description: Lấy chi tiết thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Fabric'
 *       404:
 *         description: Không tìm thấy vải
 */
router.get(
  '/:id',
  authenticateToken,
  requirePermission(PERMISSIONS.FABRICS.VIEW_DETAIL.key),
  validate(fabricIdParamSchema, 'params'),
  getFabricById
);

// // Tạo mới Fabric
// /**
//  * @swagger
//  * /fabrics:
//  *   post:
//  *     summary: Tạo mới vải
//  *     tags: [Fabrics]
//  *     security:
//  *       - bearerAuth: []
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             $ref: '#/components/schemas/Fabric'
//  *     responses:
//  *       201:
//  *         description: Tạo mới thành công
//  *       400:
//  *         description: Dữ liệu không hợp lệ
//  */
// router.post(
//   '/',
//   authenticateToken,
//   requirePermission(PERMISSIONS.FABRICS.CREATE.key),
//   validate(createFabricSchema),
//   createFabric
// );

// // Cập nhật Fabric
// /**
//  * @swagger
//  * /fabrics/{id}:
//  *   put:
//  *     summary: Cập nhật thông tin vải
//  *     tags: [Fabrics]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: integer
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             $ref: '#/components/schemas/Fabric'
//  *     responses:
//  *       200:
//  *         description: Cập nhật thành công
//  *       404:
//  *         description: Không tìm thấy vải
//  */
// router.put(
//   '/:id',
//   authenticateToken,
//   requirePermission(PERMISSIONS.FABRICS.UPDATE.key),
//   validate(fabricIdParamSchema, 'params'),
//   validate(updateFabricSchema),
//   updateFabric
// );


export default router;
