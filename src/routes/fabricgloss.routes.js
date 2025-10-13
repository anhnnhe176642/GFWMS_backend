import express from 'express';
import { 
  getAllFabricGlosses, 
  getFabricGlossById, 
  createFabricGloss, 
  updateFabricGloss, 
} from '../controllers/fabricgloss.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/permission.middleware.js';
import { PERMISSIONS } from '../constants/permissions.js';
import { validate } from '../middlewares/validation.middleware.js';
import { 
  createFabricGlossSchema, 
  updateFabricGlossSchema, 
  fabricGlossIdParamSchema, 
  fabricGlossQuerySchema 
} from '../validations/fabricgloss.validation.js';

const router = express.Router();

router.use(authenticateToken);

/**
 * @swagger
 * /fabric-gloss:
 *   get:
 *     summary: Get all fabric gloss with pagination and search
 *     tags: [FabricGloss]
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
 *         description: Search keyword (max 100 chars)
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Field(s) to sort by. Single or comma-separated
 *         example: description
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *         description: Sort order (asc or desc)
 *     responses:
 *       200:
 *         description: Fabric gloss retrieved successfully
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
 *                   example: Lấy danh sách fabric gloss thành công
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FabricGloss'
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
  requirePermission(PERMISSIONS.FABRICS.MANAGE_GLOSS),
  validate(fabricGlossQuerySchema, 'query'),
  getAllFabricGlosses
);

/**
 * @swagger
 * /fabric-gloss/{id}:
 *   get:
 *     summary: Get fabric gloss by id
 *     tags: [FabricGloss]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: FabricGloss ID
 *     responses:
 *       200:
 *         description: Fabric gloss retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - message
 *                 - data
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Lấy thông tin fabric gloss thành công
 *                 data:
 *                   $ref: '#/components/schemas/FabricGloss'
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
  requirePermission(PERMISSIONS.FABRICS.MANAGE_GLOSS),
  validate(fabricGlossIdParamSchema, 'params'),
  getFabricGlossById
);

/**
 * @swagger
 * /fabric-gloss:
 *   post:
 *     summary: Create a new fabric gloss
 *     tags: [FabricGloss]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - description
 *             properties:
 *               description:
 *                 type: string
 *                 maxLength: 100
 *                 description: Fabric gloss description
 *                 example: Glossy
 *     responses:
 *       201:
 *         description: Fabric gloss created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - message
 *                 - data
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Tạo fabric gloss thành công
 *                 data:
 *                   $ref: '#/components/schemas/FabricGloss'
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
  requirePermission(PERMISSIONS.FABRICS.MANAGE_GLOSS),
  validate(createFabricGlossSchema, 'body'),
  createFabricGloss
);

/**
 * @swagger
 * /fabric-gloss/{id}:
 *   put:
 *     summary: Update fabric gloss
 *     tags: [FabricGloss]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: FabricGloss ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *                 maxLength: 100
 *                 description: Fabric gloss description
 *                 example: Matte
 *     responses:
 *       200:
 *         description: Fabric gloss updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - message
 *                 - data
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Cập nhật fabric gloss thành công
 *                 data:
 *                   $ref: '#/components/schemas/FabricGloss'
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
  requirePermission(PERMISSIONS.FABRICS.MANAGE_GLOSS),
  validate(fabricGlossIdParamSchema, 'params'),
  validate(updateFabricGlossSchema, 'body'),
  updateFabricGloss
);



export default router;
