import express from 'express';
import {
  getAllWarehouses,
  getWarehouseById,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  restoreWarehouse,
  getDeletedWarehouses,
  searchWarehouses
} from '../controllers/warehouse.controller.js';
import { authenticateToken, requirePermission } from '../middlewares/auth.middleware.js';
import { validate, validateMultiple } from '../middlewares/validation.middleware.js';
import { 
  createWarehouseSchema, 
  updateWarehouseSchema, 
  warehouseQuerySchema 
} from '../validations/warehouse.validation.js';
import { PERMISSIONS } from '../constants/permissions.js';

const router = express.Router();

router.use(authenticateToken);

/**
 * @swagger
 * /warehouses:
 *   get:
 *     summary: Get all warehouses with filtering
 *     tags: [Warehouses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *         example: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in warehouse name and address
 *         example: "Hà Nội"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE]
 *         description: Filter by status (omit to get all; ACTIVE = active only; INACTIVE = inactive only)
 *         example: "ACTIVE"
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *           enum: [createdAt, updatedAt, name, address]
 *         description: Field to sort by
 *         example: "name"
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *         example: "asc"
 *       - in: query
 *         name: createdFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by creation date from (YYYY-MM-DD)
 *         example: "2025-01-01"
 *       - in: query
 *         name: createdTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by creation date to (YYYY-MM-DD)
 *         example: "2025-12-31"
 *     responses:
 *       200:
 *         description: Warehouses retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Lấy danh sách kho thành công"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       name:
 *                         type: string
 *                         example: "Kho Hà Nội"
 *                       address:
 *                         type: string
 *                         example: "123 Đường Láng, Hà Nội"
 *                       status:
 *                         type: string
 *                         enum: [ACTIVE, INACTIVE]
 *                         example: "ACTIVE"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-10-12T10:30:00.000Z"
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-10-12T10:30:00.000Z"
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     total:
 *                       type: integer
 *                       example: 25
 *                     totalPages:
 *                       type: integer
 *                       example: 3
 *                     hasNext:
 *                       type: boolean
 *                       example: false
 *                     hasPrev:
 *                       type: boolean
 *                       example: false
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/',
  requirePermission(PERMISSIONS.WAREHOUSES.VIEW_LIST.key),
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
 *                 description: Warehouse name
 *                 example: "Kho Hà Nội"
 *               address:
 *                 type: string
 *                 description: Warehouse address
 *                 example: "123 Đường Láng, Hà Nội"
 *     responses:
 *       201:
 *         description: Warehouse created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     name:
 *                       type: string
 *                       example: "Kho Hà Nội"
 *                     address:
 *                       type: string
 *                       example: "123 Đường Láng, Hà Nội"
 *                     status:
 *                       type: string
 *                       example: "ACTIVE"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-10-12T10:30:00.000Z"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-10-12T10:30:00.000Z"
 *                 message:
 *                   type: string
 *                   example: "Tạo kho thành công"
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       409:
 *         description: Conflict
 */
router.post('/', 
  requirePermission(PERMISSIONS.WAREHOUSES.CREATE.key),
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
 *         example: 1
 *     responses:
 *       200:
 *         description: Warehouse retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     name:
 *                       type: string
 *                       example: "Kho Hà Nội"
 *                     address:
 *                       type: string
 *                       example: "123 Đường Láng, Hà Nội"
 *                     status:
 *                       type: string
 *                       example: "ACTIVE"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-10-12T10:30:00.000Z"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-10-12T10:30:00.000Z"
 *                 message:
 *                   type: string
 *                   example: "Lấy thông tin kho thành công"
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
router.get('/:id', 
  requirePermission(PERMISSIONS.WAREHOUSES.VIEW_DETAIL.key),
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
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Warehouse name
 *                 example: "Kho Hà Nội Updated"
 *               address:
 *                 type: string
 *                 description: Warehouse address
 *                 example: "456 Đường Cầu Giấy, Hà Nội"
 *     responses:
 *       200:
 *         description: Warehouse updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     name:
 *                       type: string
 *                       example: "Kho Hà Nội Updated"
 *                     address:
 *                       type: string
 *                       example: "456 Đường Cầu Giấy, Hà Nội"
 *                     status:
 *                       type: string
 *                       example: "ACTIVE"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-10-12T10:30:00.000Z"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-10-12T10:30:00.000Z"
 *                 message:
 *                   type: string
 *                   example: "Cập nhật kho thành công"
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 *       409:
 *         description: Conflict
 */
router.put('/:id', 
  requirePermission(PERMISSIONS.WAREHOUSES.UPDATE.key),
  validateMultiple([
    { schema: updateWarehouseSchema, source: 'body' }
  ]), 
  updateWarehouse
);

/**
 * @swagger
 * /warehouses/{id}:
 *   delete:
 *     summary: Soft delete warehouse
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
 *         example: 1
 *     responses:
 *       200:
 *         description: Warehouse deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     name:
 *                       type: string
 *                       example: "Kho Hà Nội"
 *                     address:
 *                       type: string
 *                       example: "123 Đường Láng, Hà Nội"
 *                     status:
 *                       type: string
 *                       example: "INACTIVE"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-10-12T10:30:00.000Z"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-10-12T10:30:00.000Z"
 *                 message:
 *                   type: string
 *                   example: "Xóa warehouse thành công"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
router.delete('/:id', 
  requirePermission(PERMISSIONS.WAREHOUSES.DELETE.key),
  deleteWarehouse
);

/**
 * @swagger
 * /warehouses/{id}/restore:
 *   patch:
 *     summary: Restore deleted warehouse
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
 *         example: 1
 *     responses:
 *       200:
 *         description: Warehouse restored successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     name:
 *                       type: string
 *                       example: "Kho Hà Nội"
 *                     address:
 *                       type: string
 *                       example: "123 Đường Láng, Hà Nội"
 *                     status:
 *                       type: string
 *                       example: "ACTIVE"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-10-12T10:30:00.000Z"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-10-12T10:30:00.000Z"
 *                 message:
 *                   type: string
 *                   example: "Khôi phục warehouse thành công"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 *       409:
 *         description: Warehouse already active
 */
router.patch('/:id/restore', 
  requirePermission(PERMISSIONS.WAREHOUSES.RESTORE.key), 
  restoreWarehouse
);

export default router;