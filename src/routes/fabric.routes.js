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
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search keyword (supports searching by color, category, gloss, supplier)
 *       - in: query
 *         name: glossId
 *         schema:
 *           type: string
 *         description: Filter by gloss id (single or comma-separated values)
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: Filter by category id (single or comma-separated values)
 *       - in: query
 *         name: colorId
 *         schema:
 *           type: string
 *         description: Filter by color id (single or comma-separated values)
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Sort field (id, createdAt, updatedAt, sellingPrice, quantityInStock, weight, length, width)
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *         description: Sort order (asc or desc)
 *     responses:
 *       200:
 *         description: Fabrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
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
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       409:
 *         $ref: '#/components/responses/ConflictError'
 */
router.get(
  '/',
  authenticateToken,
  requirePermission(PERMISSIONS.FABRICS.VIEW_LIST),
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
  requirePermission(PERMISSIONS.FABRICS.VIEW_DETAIL),
  validate(fabricIdParamSchema, 'params'),
  getFabricById
);



export default router;
