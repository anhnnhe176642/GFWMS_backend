import express from 'express';
import { 
  getAllFabricColors, 
  getFabricColorById, 
  createFabricColor, 
  updateFabricColor, 
  deleteFabricColor
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
 *     summary: Lấy danh sách màu vải (có phân trang và tìm kiếm)
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
  requirePermission(PERMISSIONS.FABRICS.VIEW_COLOR_LIST),
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
  requirePermission(PERMISSIONS.FABRICS.VIEW_COLOR_DETAIL),
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
  requirePermission(PERMISSIONS.FABRICS.CREATE_COLOR),
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
  requirePermission(PERMISSIONS.FABRICS.UPDATE_COLOR),
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
  requirePermission(PERMISSIONS.FABRICS.DELETE_COLOR),
  validate(fabricColorIdParamSchema, 'params'),
  deleteFabricColor
);

export default router;
