import express from 'express';
import {
  getAllFabricCategories,
  getFabricCategoryById,
  createFabricCategory,
  updateFabricCategory,
  deleteFabricCategory
} from '../../controllers/fabricCategory.controller.js';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
import { requirePermission } from '../../middlewares/permission.middleware.js';
import { PERMISSIONS } from '../../constants/permissions.js';
import { validate } from '../../middlewares/validation.middleware.js';
import {
  createFabricCategorySchema,
  updateFabricCategorySchema,
  fabricCategoryIdParamSchema,
  fabricCategoryQuerySchema
} from '../../validations/fabricCategory.validation.js';

const router = express.Router();


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
 *         description: Field(s) to sort by
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Fabric categories retrieved successfully
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
 *     summary: Get fabric category by ID
 *     tags: [FabricCategory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: FabricCategory ID
 *     responses:
 *       200:
 *         description: Fabric category retrieved successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get(
  '/:id',
  authenticateToken,
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Shirt Fabric
 *               description:
 *                 type: string
 *                 example: Suitable for shirts
 *               sellingPricePerMeter:
 *                 type: number
 *                 format: float
 *                 example: 50.0
 *               sellingPricePerRoll:
 *                 type: number
 *                 format: float
 *                 example: 3000.0
 *     responses:
 *       201:
 *         description: Fabric category created successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         $ref: '#/components/responses/ConflictError'
 */
router.post(
  '/',
  authenticateToken,
  requirePermission(PERMISSIONS.FABRICS.MANAGE_CATEGORIES),
  validate(createFabricCategorySchema, 'body'),
  createFabricCategory
);

/**
 * @swagger
 * /fabric-category/{id}:
 *   put:
 *     summary: Update a fabric category
 *     tags: [FabricCategory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: FabricCategory ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Shirt Fabric
 *               description:
 *                 type: string
 *                 example: Suitable for shirts
 *               sellingPricePerMeter:
 *                 type: number
 *                 format: float
 *                 example: 45.5
 *               sellingPricePerRoll:
 *                 type: number
 *                 format: float
 *                 example: 2700.0
 *     responses:
 *       200:
 *         description: Fabric category updated successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       409:
 *         $ref: '#/components/responses/ConflictError'
 */
router.put(
  '/:id',
  authenticateToken,
  requirePermission(PERMISSIONS.FABRICS.MANAGE_CATEGORIES),
  validate(fabricCategoryIdParamSchema, 'params'),
  validate(updateFabricCategorySchema, 'body'),
  updateFabricCategory
);

/**
 * @swagger
 * /fabric-category/{id}:
 *   delete:
 *     summary: Xóa loại vải
 *     tags: [FabricCategory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: FabricCategory ID
 *     responses:
 *       200:
 *         description: Xóa loại vải thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Xóa loại vải thành công"
 *                 data:
 *                   type: object
 *       400:
 *         description: Bad Request - Loại vải đang được sử dụng hoặc có ràng buộc dữ liệu
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete(
  '/:id',
  authenticateToken,
  requirePermission(PERMISSIONS.FABRICS.MANAGE_CATEGORIES),
  validate(fabricCategoryIdParamSchema, 'params'),
  deleteFabricCategory
);

export default router;
