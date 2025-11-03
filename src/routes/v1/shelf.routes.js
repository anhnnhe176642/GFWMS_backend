import express from 'express';
import {
  getAllShelves,
  getShelfById,
  createShelf,
  updateShelf,
  deleteShelf
} from '../../controllers/shelf.controller.js';
import { authenticateToken, requirePermission } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validation.middleware.js';
import {
  createShelfSchema,
  updateShelfSchema,
  shelfQuerySchema,
  shelfIdSchema
} from '../../validations/shelf.validation.js';
import { PERMISSIONS } from '../../constants/permissions.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * @swagger
 * /shelves:
 *   get:
 *     summary: Lấy tất cả kệ với filter tùy chọn
 *     tags: [Shelves]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: string
 *         description: Trang hiện tại
 *         example: "1"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: string
 *         description: Số lượng bản ghi trên trang
 *         example: "10"
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm theo code kệ
 *       - in: query
 *         name: warehouseId
 *         schema:
 *           type: string
 *         description: Lọc theo kho
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/',
  requirePermission(PERMISSIONS.SHELVES.VIEW_LIST),
  validate(shelfQuerySchema, 'query'),
  getAllShelves
);

/**
 * @swagger
 * /shelves:
 *   post:
 *     summary: Tạo kệ mới
 *     tags: [Shelves]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - maxQuantity
 *               - warehouseId
 *             properties:
 *               code:
 *                 type: string
 *                 example: "K001"
 *               maxQuantity:
 *                 type: integer
 *                 example: 50
 *               warehouseId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Tạo kệ thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Tạo kệ thành công"
 *                 shelf:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     code:
 *                       type: string
 *                       example: "K001"
 *                     currentQuantity:
 *                       type: integer
 *                       example: 0
 *                     maxQuantity:
 *                       type: integer
 *                       example: 50
 *                     warehouseId:
 *                       type: integer
 *                       example: 1
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-11-01T00:00:00.000Z"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-11-01T00:00:00.000Z"
 *       400:
 *         description: Dữ liệu gửi lên không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Mã kệ đã tồn tại"
 */
router.post('/',
  requirePermission(PERMISSIONS.SHELVES.CREATE),
  validate(createShelfSchema, 'body'),
  createShelf
);


/**
 * @swagger
 * /shelves/{id}:
 *   get:
 *     summary: Lấy thông tin kệ theo ID
 *     tags: [Shelves]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của kệ cần lấy
 *         example: "1"
 *     responses:
 *       200:
 *         description: Thông tin kệ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Lấy thông tin kệ thành công"
 *                 shelf:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     code:
 *                       type: string
 *                       example: "K001"
 *                     currentQuantity:
 *                       type: integer
 *                       example: 10
 *                     maxQuantity:
 *                       type: integer
 *                       example: 50
 *                     warehouseId:
 *                       type: integer
 *                       example: 1
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-11-01T00:00:00.000Z"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-11-01T01:00:00.000Z"
 *       404:
 *         description: Không tìm thấy kệ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Không tìm thấy kệ"
 */
router.get('/:id',
  requirePermission(PERMISSIONS.SHELVES.VIEW_DETAIL),
  validate(shelfIdSchema, 'params'),
  getShelfById
);


/**
 * @swagger
 * /shelves/{id}:
 *   put:
 *     summary: Cập nhật kệ
 *     tags: [Shelves]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID kệ cần cập nhật
 *         example: "1"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 example: "K002"
 *               maxQuantity:
 *                 type: integer
 *                 example: 60
 *               currentQuantity:
 *                 type: integer
 *                 example: 10
 *               warehouseId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Cập nhật kệ thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Cập nhật kệ thành công"
 *                 shelf:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     code:
 *                       type: string
 *                       example: "K002"
 *                     currentQuantity:
 *                       type: integer
 *                       example: 10
 *                     maxQuantity:
 *                       type: integer
 *                       example: 60
 *                     warehouseId:
 *                       type: integer
 *                       example: 1
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-11-01T00:00:00.000Z"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-11-01T01:00:00.000Z"
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc trùng mã kệ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Mã kệ đã tồn tại"
 *       404:
 *         description: Không tìm thấy kệ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Không tìm thấy kệ"
 */
router.put('/:id',
  requirePermission(PERMISSIONS.SHELVES.UPDATE),
  validate(updateShelfSchema, 'body'),
  validate(shelfIdSchema, 'params'),
  updateShelf
);

/**
 * @swagger
 * /shelves/{id}:
 *   delete:
 *     summary: Xóa kệ
 *     tags: [Shelves]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID kệ cần xóa
 *         example: "1"
 *     responses:
 *       200:
 *         description: Xóa kệ thành công
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
 *                   example: "Xóa kệ thành công"
 *                 data:
 *                   type: object
 *       404:
 *         description: Không tìm thấy kệ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Không tìm thấy kệ"
 *       400:
 *         description: Kệ đang được sử dụng hoặc có ràng buộc dữ liệu
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Kệ đang được sử dụng, không thể xóa"
 */
router.delete('/:id',
  requirePermission(PERMISSIONS.SHELVES.DELETE),
  validate(shelfIdSchema, 'params'),
  deleteShelf
);


export default router;
