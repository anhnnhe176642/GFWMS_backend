import express from 'express';
import {
  getAllFabrics,
  getFabricById
} from '../controllers/fabric.controller.js';
import { authenticateToken, requirePermission } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validation.middleware.js';
import {
  fabricIdParamSchema,
  fabricQuerySchema 
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
 *         name: glossId
 *         schema:
 *           type: string
 *         description: Filter by gloss id. Can be single or comma-separated values.
 *         example: "1,2"
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: Filter by category id. Single or multiple values separated by commas.
 *         example: "1,2,3"
 *       - in: query
 *         name: colorId
 *         schema:
 *           type: string
 *         description: Filter by color id. Single or multiple values separated by commas.
 *         example: "1,2,3"
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
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get(
  '/',
  authenticateToken,
  requirePermission(PERMISSIONS.FABRICS.VIEW_LIST.key),
  validate(fabricQuerySchema, 'query'),
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



export default router;
