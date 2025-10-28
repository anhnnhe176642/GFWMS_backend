import express from 'express';
import {
  getAllExportFabrics,
  getExportFabricById,
} from '../../controllers/exportFabric.controller.js';
import { authenticateToken, requirePermission } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validation.middleware.js';
import {
  exportFabricIdParamSchema,
  exportFabricQuerySchema
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
 *           type: integer
 *         description: Số trang cần lấy
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
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
  getExportFabricById
);

export default router;
