import express from 'express';
import { getAllWarehouses, createWarehouse, getWarehouseById, updateWarehouse } from '../controllers/warehouse.controller.js';
import { authenticateToken, requirePermission } from '../middlewares/auth.middleware.js';
import { validate, validateMultiple } from '../middlewares/validation.middleware.js';
import { 
  createWarehouseSchema, 
  updateWarehouseSchema, 
  idParamSchema,  
  warehouseQuerySchema 
} from '../validations/warehouse.validation.js';
import { PERMISSIONS } from '../constants/permissions.js';

const router = express.Router();

router.use(authenticateToken);

/**
 * @swagger
 * /warehouses:
 *   get:
 *     summary: Get all warehouses with advanced filtering
 *     tags: [Warehouses]
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
 *           enum: [createdAt, updatedAt, name, address]
 *         description: Field to sort by
 *         example: name
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order (asc or desc)
 *       - in: query
 *         name: createdFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by creation date from
 *       - in: query
 *         name: createdTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by creation date to
 *     responses:
 *       200:
 *         description: Warehouses retrieved successfully
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
 *                   example: Lấy danh sách kho thành công
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Warehouse'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/', 
  requirePermission(PERMISSIONS.WAREHOUSES.VIEW_LIST),
  validate(warehouseQuerySchema, 'query'), 
  getAllWarehouses
);

/**
 * @swagger
 * /warehouses:
 *   post:
 *     summary: Create a new warehouse
 *     tags: [Warehouses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - address
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 description: Warehouse name (2-100 characters)
 *                 example: Kho Hà Nội
 *               address:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 255
 *                 description: Warehouse address (5-255 characters)
 *                 example: 123 Đường ABC, Quận XYZ, Hà Nội
 *     responses:
 *       201:
 *         description: Warehouse created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - message
 *                 - warehouse
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Tạo kho thành công
 *                 warehouse:
 *                   $ref: '#/components/schemas/Warehouse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       409:
 *         $ref: '#/components/responses/ConflictError'
 */
router.post('/', 
  requirePermission(PERMISSIONS.WAREHOUSES.CREATE),
  validate(createWarehouseSchema), 
  createWarehouse
);

/**
 * @swagger
 * /warehouses/{id}:
 *   get:
 *     summary: Get warehouse by ID
 *     tags: [Warehouses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Warehouse ID
 *     responses:
 *       200:
 *         description: Warehouse retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - message
 *                 - warehouse
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Lấy thông tin kho thành công
 *                 warehouse:
 *                   $ref: '#/components/schemas/Warehouse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id', 
  requirePermission(PERMISSIONS.WAREHOUSES.VIEW_DETAIL),
  validate(idParamSchema, 'params'), 
  getWarehouseById
);

/**
 * @swagger
 * /warehouses/{id}:
 *   put:
 *     summary: Update warehouse
 *     tags: [Warehouses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Warehouse ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 description: Warehouse name (2-100 characters)
 *                 example: Kho Hà Nội Updated
 *               address:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 255
 *                 description: Warehouse address (5-255 characters)
 *                 example: 456 Đường DEF, Quận UVW, Hà Nội
 *     responses:
 *       200:
 *         description: Warehouse updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - message
 *                 - warehouse
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Cập nhật kho thành công
 *                 warehouse:
 *                   $ref: '#/components/schemas/Warehouse'
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
router.put('/:id', 
  requirePermission(PERMISSIONS.WAREHOUSES.UPDATE),
  validateMultiple([
    { schema: idParamSchema, source: 'params' },
    { schema: updateWarehouseSchema, source: 'body' }
  ]), 
  updateWarehouse
);

export default router;