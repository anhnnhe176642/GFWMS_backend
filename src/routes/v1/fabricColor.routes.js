import express from 'express';
import { 
  getAllFabricColors, 
  getFabricColorById, 
  createFabricColor, 
  updateFabricColor, 
  deleteFabricColor
} from '../../controllers/fabricColor.controller.js';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
import { requireAnyPermission, requirePermission } from '../../middlewares/permission.middleware.js';
import { PERMISSIONS } from '../../constants/permissions.js';
import { validate } from '../../middlewares/validation.middleware.js';
import { 
  createFabricColorSchema, 
  updateFabricColorSchema, 
  fabricColorIdParamSchema, 
  fabricColorQuerySchema 
} from '../../validations/fabricColor.validation.js';

const router = express.Router();


/**
 * @swagger
 * /fabric-color:
 *   get:
 *     summary: Lấy danh sách màu vải (có phân trang, tìm kiếm, lọc theo color family, tìm kiếm theo hex tương tự)
 *     tags: [FabricColor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: string
 *         description: Số trang cần lấy
 *       - in: query
 *         name: limit
 *         schema:
 *           type: string
 *         description: Số lượng mục trên mỗi trang
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Từ khóa tìm kiếm (tìm theo tên màu vải)
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Trường để sắp xếp (có thể truyền nhiều, cách nhau bởi dấu phẩy)
 *         example: name
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *         description: Thứ tự sắp xếp (asc hoặc desc)
 *       - in: query
 *         name: colorFamily
 *         schema:
 *           type: string
 *           enum: [Đỏ, Cam, Vàng, Xanh lá, Xanh dương, Tím, Hồng, Đen, Trắng, Xám]
 *         description: Lọc theo nhóm màu (được tính từ mã hex tự động)
 *       - in: query
 *         name: hexSearchColor
 *         schema:
 *           type: string
 *         description: Mã hex để tìm kiếm màu tương tự (#RRGGBB, #RGB hoặc RRGGBB)
 *         example: '#3b82f6'
 *       - in: query
 *         name: hexSearchRange
 *         schema:
 *           type: number
 *         description: Tốc độ tương tự (0-100, cao hơn = tương tự hơn)
 *         example: 50
 *     responses:
 *       200:
 *         description: Lấy danh sách màu vải thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Lấy danh sách màu vải thành công
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
  // authenticateToken,
  // requireAnyPermission([PERMISSIONS.FABRICS.MANAGE_COLORS, PERMISSIONS.CUSTOMERS.VIEW_FABRIC_COLORS]),
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
 *               hexCode:
 *                 type: string
 *                 description: Mã hex của màu (#RRGGBB hoặc #RGB)
 *                 example: '#FF0000'
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
  authenticateToken,
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
 *               hexCode:
 *                 type: string
 *                 description: Mã hex của màu (#RRGGBB hoặc #RGB)
 *                 example: '#0000FF'
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
  authenticateToken,
  requirePermission(PERMISSIONS.FABRICS.MANAGE_COLORS),
  validate(fabricColorIdParamSchema, 'params'),
  validate(updateFabricColorSchema, 'body'),
  updateFabricColor
);

/**
 * @swagger
 * /fabric-color/{id}:
 *   delete:
 *     summary: Xóa màu vải
 *     tags: [FabricColor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID màu vải cần xóa
 *     responses:
 *       200:
 *         description: Xóa màu vải thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Xóa màu vải thành công
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
router.delete(
  '/:id',
  authenticateToken,
  requirePermission(PERMISSIONS.FABRICS.MANAGE_COLORS),
  validate(fabricColorIdParamSchema, 'params'),
  deleteFabricColor
);

export default router;
