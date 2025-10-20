import express from 'express';
import { 
  getAllFabricColors, 
  getFabricColorById, 
  createFabricColor, 
  updateFabricColor, 
} from '../../controllers/fabricColor.controller.js';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
import { requirePermission } from '../../middlewares/permission.middleware.js';
import { PERMISSIONS } from '../../constants/permissions.js';
import { validate } from '../../middlewares/validation.middleware.js';
import { 
  createFabricColorSchema, 
  updateFabricColorSchema, 
  fabricColorIdParamSchema, 
  fabricColorQuerySchema 
} from '../../validations/fabricColor.validation.js';

const router = express.Router();

router.use(authenticateToken);

/**
 * @swagger
 * /fabric-color:
 *   get:
 *     summary: Get all fabric colors with pagination and search
 *     tags: [FabricColor]
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
 *         example: name
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *         description: Sort order (asc or desc)
 *     responses:
 *       200:
 *         description: Fabric colors retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Lấy danh sách fabric color thành công
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FabricColor'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get(
  '/',
  requirePermission(PERMISSIONS.FABRICS.MANAGE_COLORS),
  validate(fabricColorQuerySchema, 'query'),
  getAllFabricColors
);

/**
 * @swagger
 * /fabric-color/{id}:
 *   get:
 *     summary: Get fabric color by id
 *     tags: [FabricColor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         description: FabricColor ID
 *     responses:
 *       200:
 *         description: Fabric color retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Lấy thông tin fabric color thành công
 *                 data:
 *                   $ref: '#/components/schemas/FabricColor'
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
  requirePermission(PERMISSIONS.FABRICS.MANAGE_COLORS),
  validate(fabricColorIdParamSchema, 'params'),
  getFabricColorById
);

/**
 * @swagger
 * /fabric-color:
 *   post:
 *     summary: Create a new fabric color
 *     tags: [FabricColor]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 example: red001
 *               name:
 *                 type: string
 *                 example: Red
 *     responses:
 *       201:
 *         description: Fabric color created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Tạo fabric color thành công
 *                 data:
 *                   $ref: '#/components/schemas/FabricColor'
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
  requirePermission(PERMISSIONS.FABRICS.MANAGE_COLORS),
  validate(createFabricColorSchema, 'body'),
  createFabricColor
);

/**
 * @swagger
 * /fabric-color/{id}:
 *   put:
 *     summary: Update fabric color
 *     tags: [FabricColor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         description: FabricColor ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Blue
 *     responses:
 *       200:
 *         description: Fabric color updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Cập nhật fabric color thành công
 *                 data:
 *                   $ref: '#/components/schemas/FabricColor'
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
  requirePermission(PERMISSIONS.FABRICS.MANAGE_COLORS),
  validate(fabricColorIdParamSchema, 'params'),
  validate(updateFabricColorSchema, 'body'),
  updateFabricColor
);

export default router;
