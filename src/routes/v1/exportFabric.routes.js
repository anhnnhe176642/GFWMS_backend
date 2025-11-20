import express from 'express';
import {
  getAllExportFabrics,
  getExportFabricDetailForWarehouse,
  getExportFabricDetailForStore,
  createExportFabric,
  updateExportFabricStatus
} from '../../controllers/exportFabric.controller.js';
import { authenticateToken, requirePermission } from '../../middlewares/auth.middleware.js';
import { validate, validateMultiple } from '../../middlewares/validation.middleware.js';
import {
  exportFabricIdParamSchema,
  exportFabricQuerySchema,
  createExportFabricSchema,
  approveExportFabricSchema
} from '../../validations/exportFabric.validation.js';
import { PERMISSIONS } from '../../constants/permissions.js';

const router = express.Router();

/**
 * @swagger
 * /export-fabrics:
 *   get:
 *     summary: Lấy danh sách phiếu xuất vải (có lọc và phân trang)
 *     tags: [ExportFabrics]
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
 *         description: Tìm kiếm theo hoặc tên kho, cửa hàng , hoặc tên người tạo/nhận đơn
 *       - in: query
 *         name: warehouseId
 *         schema:
 *           type: string
 *         description: Lọc theo kho xuất
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *         description: Lọc theo cửa hàng nhận
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Lọc theo trạng thái phiếu xuất
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Trường để sắp xếp (id, createdAt, updatedAt, status)
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *         description: Thứ tự sắp xếp
 *     responses:
 *       200:
 *         description: Lấy danh sách phiếu xuất vải thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Lấy danh sách phiếu xuất vải thành công
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ExportFabric'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *             example:
 *               message: Lấy danh sách phiếu xuất vải thành công
 *               data:
 *                 - id: 1
 *                   warehouse:
 *                     id: 2
 *                     name: "Kho Trung tâm"
 *                   store:
 *                     id: 5
 *                     name: "Cửa hàng Quận 1"
 *                   status: "PENDING"
 *                   note: "Xuất cho cửa hàng mới"
 *                   createdBy:
 *                     id: "u123"
 *                     username: "admin"
 *                   receivedBy:
 *                     id: "u456"
 *                     username: "nhanvien"
 *                   createdAt: "2025-10-01T10:00:00.000Z"
 *                   updatedAt: "2025-10-05T12:00:00.000Z"
 *               pagination:
 *                 page: 1
 *                 limit: 10
 *                 total: 25
 *                 totalPages: 3
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get(
  '/',
  authenticateToken,
  requirePermission(PERMISSIONS.EXPORT_FABRICS.VIEW_LIST),
  validate(exportFabricQuerySchema, 'query'),
  getAllExportFabrics
);

/**
 * @swagger
 * /export-fabrics/{id}:
 *   get:
 *     summary: Lấy chi tiết phiếu xuất vải
 *     tags: [ExportFabrics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID của phiếu xuất vải
 *     responses:
 *       200:
 *         description: Lấy chi tiết phiếu xuất thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ExportFabric'
 *       404:
 *         description: Không tìm thấy phiếu xuất vải
 */
router.get(
  '/:id',
  authenticateToken,
  requirePermission(PERMISSIONS.EXPORT_FABRICS.VIEW_DETAIL),
  validate(exportFabricIdParamSchema, 'params'),
  getExportFabricDetailForStore
);

/**
 * @swagger
 * /export-fabrics/warehouse/{id}:
 *   get:
 *     summary: Lấy chi tiết phiếu xuất vải cho nhân viên kho (có gợi ý kệ)
 *     tags: [ExportFabrics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của phiếu xuất vải
 *     responses:
 *       200:
 *         description: Lấy chi tiết phiếu xuất thành công, kèm gợi ý kệ cho từng fabric
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Lấy chi tiết phiếu xuất thành công
 *                 exportFabric:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     warehouse:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         name:
 *                           type: string
 *                     store:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         name:
 *                           type: string
 *                     status:
 *                       type: string
 *                       example: PENDING
 *                     note:
 *                       type: string
 *                     createdBy:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         username:
 *                           type: string
 *                     receivedBy:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         username:
 *                           type: string
 *                     exportItems:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           fabricId:
 *                             type: integer
 *                           quantity:
 *                             type: integer
 *                           suggestedShelves:
 *                             type: array
 *                             description: Danh sách các kệ có đủ số lượng vải
 *                             items:
 *                               type: object
 *                               properties:
 *                                 shelfId:
 *                                   type: integer
 *                                 shelfCode:
 *                                   type: string
 *                                 availableQuantity:
 *                                   type: integer
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Không tìm thấy phiếu xuất vải
 */
router.get(
  '/warehouse/:id',
  authenticateToken,
  requirePermission(PERMISSIONS.EXPORT_FABRICS.VIEW_DETAIL_WAREHOUSE),
  validate(exportFabricIdParamSchema, 'params'),
  getExportFabricDetailForWarehouse
);

/**
 * @swagger
 * /export-fabrics:
 *   post:
 *     summary: Tạo phiếu xuất vải mới
 *     tags: [ExportFabrics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - warehouseId
 *               - storeId
 *               - exportItems
 *             properties:
 *               warehouseId:
 *                 type: integer
 *                 description: ID kho xuất
 *               storeId:
 *                 type: integer
 *                 description: ID cửa hàng nhận
 *               note:
 *                 type: string
 *                 description: Ghi chú phiếu xuất
 *               exportItems:
 *                 type: array
 *                 description: Danh sách các fabric xuất
 *                 items:
 *                   type: object
 *                   required:
 *                     - fabricId
 *                     - quantity
 *                     - price
 *                   properties:
 *                     fabricId:
 *                       type: integer
 *                       description: ID của fabric
 *                     quantity:
 *                       type: integer
 *                       description: Số lượng xuất
 *     responses:
 *       201:
 *         description: Tạo phiếu xuất vải thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Tạo phiếu xuất vải thành công
 *                 exportFabric:
 *                   $ref: '#/components/schemas/ExportFabric'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post(
  '/',
  authenticateToken,
  requirePermission(PERMISSIONS.EXPORT_FABRICS.CREATE),
  validate(createExportFabricSchema, 'body'),
  createExportFabric
);

/**
 * @swagger
 * /export-fabrics/{id}/status:
 *   patch:
 *     summary: Duyệt phiếu xuất vải cho nhân viên kho
 *     tags: [ExportFabrics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của phiếu xuất vải
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [APPROVED, REJECTED]
 *                 description: Trạng thái duyệt phiếu
 *               itemShelfSelections:
 *                 type: array
 *                 description: Danh sách chọn kệ và số lượng cho từng loại vải (chỉ cần khi status = APPROVED)
 *                 items:
 *                   type: object
 *                   properties:
 *                     fabricId:
 *                       type: integer
 *                     shelfId:
 *                       type: integer
 *                     quantityToTake:
 *                       type: integer
 *     responses:
 *       200:
 *         description: Phiếu xuất vải đã được duyệt / từ chối
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - message
 *                 - exportFabric
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Phiếu xuất đã được duyệt
 *                 exportFabric:
 *                   $ref: '#/components/schemas/ExportFabric'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.patch(
  '/:id/status',
  authenticateToken,
  requirePermission(PERMISSIONS.EXPORT_FABRICS.CHANGE_STATUS),
  validateMultiple([
    { schema: exportFabricIdParamSchema, source: 'params' },
    { schema: approveExportFabricSchema, source: 'body' }
  ]),
  updateExportFabricStatus
);

export default router;
