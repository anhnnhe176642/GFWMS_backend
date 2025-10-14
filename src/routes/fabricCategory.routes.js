import express from 'express';
import { 
  getAllFabricCategories,
  getFabricCategoryById,
  createFabricCategory,
  updateFabricCategory
} from '../controllers/fabricCategory.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/permission.middleware.js';
import { PERMISSIONS } from '../constants/permissions.js';
import { validate } from '../middlewares/validation.middleware.js';
import {
  createFabricCategorySchema,
  updateFabricCategorySchema,
  fabricCategoryIdParamSchema,
  fabricCategoryQuerySchema
} from '../validations/fabricCategory.validation.js';

const router = express.Router();

router.use(authenticateToken);

/**
 * @swagger
 * /fabric-category:
 *   get:
 *     summary: Get all fabric categories with pagination and search
 *     tags: [FabricCategory]
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
 *         description: Search keyword
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Field(s) to sort by. Single or comma-separated
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *         description: Sort order (asc or desc)
 *     responses:
 *       200:
 *         description: Fabric categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Lấy danh sách fabric category thành công
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FabricCategory'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get(
  '/',
  requirePermission(PERMISSIONS.FABRICS.MANAGE_CATEGORIES),
  validate(fabricCategoryQuerySchema, 'query'),
  getAllFabricCategories
);

/**
 * @swagger
 * /fabric-category/{id}:
 *   get:
 *     summary: Get fabric category by id
 *     tags: [FabricCategory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         description: FabricCategory ID
 *     responses:
 *       200:
 *         description: Fabric category retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Lấy thông tin fabric category thành công
 *                 data:
 *                   $ref: '#/components/schemas/FabricCategory'
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
  requirePermission(PERMISSIONS.FABRICS.MANAGE_CATEGORIES),
  validate(fabricCategoryIdParamSchema, 'params'),
  getFabricCategoryById
);

/**
 * @swagger
 * /fabric-category:
 *   post:
 *     summary: Create a new fabric category
 *     tags: [FabricCategory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 description: Fabric category name
 *                 example: Shirt Fabric
 *               description:
 *                 description: Optional description
 *                 example: Suitable for shirts
 *     responses:
 *       201:
 *         description: Fabric category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Tạo fabric category thành công
 *                 data:
 *                   $ref: '#/components/schemas/FabricCategory'
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
  requirePermission(PERMISSIONS.FABRICS.MANAGE_CATEGORIES),
  validate(createFabricCategorySchema, 'body'),
  createFabricCategory
);

/**
 * @swagger
 * /fabric-category/{id}:
 *   put:
 *     summary: Update fabric category
 *     tags: [FabricCategory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         description: FabricCategory ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 description: Fabric category name
 *                 example: Shirt Fabric
 *               description:
 *                 description: Optional description
 *                 example: Suitable for shirts
 *     responses:
 *       200:
 *         description: Fabric category updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Cập nhật fabric category thành công
 *                 data:
 *                   $ref: '#/components/schemas/FabricCategory'
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
  requirePermission(PERMISSIONS.FABRICS.MANAGE_CATEGORIES),
  validate(fabricCategoryIdParamSchema, 'params'),
  validate(updateFabricCategorySchema, 'body'),
  updateFabricCategory
);

export default router;
