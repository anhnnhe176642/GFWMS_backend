import express from 'express';
import {
  getAllWarehouses,
  getWarehouseById,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse
} from '../../controllers/warehouse.controller.js';
import { authenticateToken, requirePermission } from '../../middlewares/auth.middleware.js';
import { validate} from '../../middlewares/validation.middleware.js';
import { 
  createWarehouseSchema, 
  updateWarehouseSchema, 
  warehouseQuerySchema,
  warehouseIdSchema
} from '../../validations/warehouse.validation.js';
import { PERMISSIONS } from '../../constants/permissions.js';

const router = express.Router();

router.use(authenticateToken);

/**
 * @swagger
 * /warehouses:
 *   get:
 *     summary: lay tat ca kho voi filter tuy chon
 *     tags: [Warehouses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: string
 *         description: Nhap trang
 *         example: "1"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: string
 *         description: nhap toi da 1 trang
 *         example: "10"
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: tim theo name và address
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: sỏt mutil or siger
 *         example: "name,createdAt"
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *         description: Sort orders muti or single
 *         example: "desc,asc"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *         example: "ACTIVE,INACTIVE"
 *       - in: query
 *         name: createdFrom
 *         schema:
 *           type: string
 *         description: Date from
 *       - in: query
 *         name: createdTo
 *         schema:
 *           type: string
 *         description: Date to
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
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
 *     summary: tạo kho moi
 *     tags: [Warehouses]
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
 *                 description: Tên kho
 *                 example: "Hà Nội 1"
 *               address:
 *                 type: string
 *                 description: Địa chỉ kho
 *                 example: "1023 Đường Láng, Hà Nội"
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.post('/', 
  requirePermission(PERMISSIONS.WAREHOUSES.CREATE),
  validate(createWarehouseSchema, 'body'), 
  createWarehouse
);

/**
 * @swagger
 * /warehouses/{id}:
 *   get:
 *     summary: lấy kho theo id
 *     tags: [Warehouses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         description: id kho
 *         example: "1"
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get('/:id', 
  requirePermission(PERMISSIONS.WAREHOUSES.VIEW_DETAIL),
  validate(warehouseIdSchema, 'params'),
  getWarehouseById
);

/**
 * @swagger
 * /warehouses/{id}:
 *   put:
 *     summary: Cập nhật kho
 *     tags: [Warehouses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         description: Warehouse ID
 *         example: "1"
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
 *               status:
 *                 type: string
 *                 description: Warehouse status (ACTIVE/INACTIVE)
 *                 example: "INACTIVE"
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.put('/:id', 
  requirePermission(PERMISSIONS.WAREHOUSES.UPDATE),
  validate(updateWarehouseSchema, 'body'),
  validate(warehouseIdSchema, 'params'),
  updateWarehouse
);

/**
 * @swagger
 * /warehouses/{id}:
 *   delete:
 *     summary: Xóa kho hàng
 *     tags: [Warehouses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         description: Warehouse ID
 *         example: "1"
 *     responses:
 *       200:
 *         description: Xóa kho hàng thành công
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
 *                   example: "Xóa kho hàng thành công"
 *                 data:
 *                   type: object
 *       400:
 *         description: Bad Request - Kho đang được sử dụng hoặc có ràng buộc dữ liệu
 *       404:
 *         description: Không tìm thấy kho hàng
 */
router.delete('/:id',
  requirePermission(PERMISSIONS.WAREHOUSES.DELETE),
  validate(warehouseIdSchema, 'params'),
  deleteWarehouse
);

export default router;