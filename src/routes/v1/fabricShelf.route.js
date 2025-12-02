import express from 'express';
import { authenticateToken, requirePermission } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validation.middleware.js';
import { allocateFabricToShelves, getFabricShelfDetail, getFabricsByShelf } from '../../controllers/fabricShelf.controller.js';
import { allocateFabricSchema, fabricIdParamSchema, shelfIdParamSchema } from '../../validations/fabricShelf.validation.js';
import { PERMISSIONS } from '../../constants/permissions.js';

const router = express.Router();

/**
 * @swagger
 * /fabric-shelf/shelf/{shelfId}/fabrics:
 *   get:
 *     summary: Lấy danh sách vải trên kệ (gom nhóm theo fabricId)
 *     description: |
 *       Trả về danh sách các loại vải trên một kệ cụ thể.
 *       Số lượng được gom nhóm theo fabricId (tổng số lượng từ tất cả các lần nhập).
 *     tags: [FabricShelf]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shelfId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID của kệ
 *         example: 1
 *     responses:
 *       200:
 *         description: Lấy danh sách vải thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Lấy danh sách vải trên kệ thành công"
 *                 data:
 *                   type: object
 *                   properties:
 *                     shelf:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         code:
 *                           type: string
 *                         currentQuantity:
 *                           type: integer
 *                         maxQuantity:
 *                           type: integer
 *                     fabrics:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           fabricId:
 *                             type: integer
 *                           totalQuantity:
 *                             type: integer
 *                           importCount:
 *                             type: integer
 *                           fabric:
 *                             type: object
 *       404:
 *         description: Không tìm thấy kệ
 */
router.get(
  '/shelf/:shelfId/fabrics',
  authenticateToken,
  validate(shelfIdParamSchema, 'params'),
  getFabricsByShelf
);

/**
 * @swagger
 * /fabric-shelf/shelf/{shelfId}/fabric/{fabricId}/detail:
 *   get:
 *     summary: Xem chi tiết vải trong kệ (bao gồm thông tin từng lần nhập)
 *     description: |
 *       Trả về chi tiết của một loại vải trên kệ, bao gồm:
 *       - Tổng số lượng hiện tại trên kệ (có thể đã xuất kho một phần)
 *       - Số lần import của vải này
 *       - Danh sách từng lần import với:
 *         * ID lần import
 *         * Số lượng hiện tại từ lần import này (có thể đã xuất kho một phần)
 *         * Giá nhập (tại thời điểm import)
 *         * Ngày nhập
 *         * Người nhập
 *         * Trạng thái lần import
 *     tags: [FabricShelf]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shelfId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID của kệ
 *         example: 1
 *       - in: path
 *         name: fabricId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID của vải
 *         example: 5
 *     responses:
 *       200:
 *         description: Lấy chi tiết vải thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Lấy chi tiết vải trong kệ thành công"
 *                 data:
 *                   type: object
 *                   properties:
 *                     shelfId:
 *                       type: integer
 *                       description: ID của kệ
 *                       example: 1
 *                     fabricId:
 *                       type: integer
 *                       description: ID của vải
 *                       example: 5
 *                     shelf:
 *                       type: object
 *                       description: Thông tin kệ
 *                       properties:
 *                         id:
 *                           type: integer
 *                         code:
 *                           type: string
 *                           description: Mã kệ
 *                         warehouseId:
 *                           type: integer
 *                     totalCurrentQuantity:
 *                       type: integer
 *                       description: "Tổng số lượng hiện tại của vải này trên kệ (từ tất cả lần import, có thể đã xuất kho một phần). currentQuantity = FabricShelf.quantity"
 *                       example: 12
 *                     importCount:
 *                       type: integer
 *                       description: Số lần import của vải này vào kệ
 *                       example: 2
 *                     imports:
 *                       type: array
 *                       description: Danh sách chi tiết từng lần import
 *                       items:
 *                         type: object
 *                         properties:
 *                           importId:
 *                             type: integer
 *                             description: ID của lần import
 *                             example: 101
 *                           currentQuantity:
 *                             type: integer
 *                             description: "Số lượng hiện tại trên kệ từ lần import này (có thể đã xuất kho). currentQuantity = FabricShelf.quantity, không phải ImportFabricItem.quantity"
 *                             example: 5
 *                           importDate:
 *                             type: string
 *                             format: date-time
 *                             description: Ngày thực hiện import
 *                             example: "2025-01-15T10:00:00Z"
 *                           importer:
 *                             type: object
 *                             description: Thông tin người thực hiện import
 *                             properties:
 *                               id:
 *                                 type: string
 *                               fullname:
 *                                 type: string
 *                               username:
 *                                 type: string
 *                           importPrice:
 *                             type: number
 *                             description: Giá nhập (đơn giá) tại lần import này
 *                             example: 5
 *                           importStatus:
 *                             type: string
 *                             description: Trạng thái lần import (PENDING, COMPLETED, CANCELLED)
 *                             example: "COMPLETED"
 *             examples:
 *               success:
 *                 summary: Ví dụ trả về chi tiết vải
 *                 value:
 *                   message: "Lấy chi tiết vải trong kệ thành công"
 *                   data:
 *                     shelfId: 1
 *                     fabricId: 5
 *                     shelf:
 *                       id: 1
 *                       code: "K001"
 *                       warehouseId: 1
 *                     totalCurrentQuantity: 12
 *                     importCount: 2
 *                     imports:
 *                       - importId: 101
 *                         currentQuantity: 5
 *                         importDate: "2025-01-15T10:00:00Z"
 *                         importer:
 *                           id: "user1"
 *                           fullname: "Nguyễn Văn A"
 *                           username: "nguyenvana"
 *                         importPrice: 5
 *                         importStatus: "COMPLETED"
 *                       - importId: 102
 *                         currentQuantity: 7
 *                         importDate: "2025-01-16T14:30:00Z"
 *                         importer:
 *                           id: "user2"
 *                           fullname: "Trần Thị B"
 *                           username: "tranthib"
 *                         importPrice: 7
 *                         importStatus: "COMPLETED"
 *       404:
 *         description: Không tìm thấy vải trên kệ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Không tìm thấy vải ID 5 trên kệ ID 1"
 *       401:
 *         description: Chưa đăng nhập
 *       500:
 *         description: Lỗi server
 */
router.get(
  '/shelf/:shelfId/fabric/:fabricId/detail',
  authenticateToken,
  getFabricShelfDetail
);

/**
 * @swagger
 * /fabric-shelf/{fabricId}/allocate-to-shelves:
 *   post:
 *     summary: Phân bổ vải vào các kệ trong kho (chỉ trong cùng một đơn nhập)
 *     description: |
 *       Phân bổ số lượng vải thuộc **một đơn nhập cụ thể (ImportFabric)** vào các kệ trong kho.  
 *       - Chỉ những vải thuộc `importFabricId` này mới được phép phân bổ.  
 *       - Tổng số lượng phân bổ không được vượt quá số lượng của vải trong đơn nhập đó.
 *     tags: [FabricShelf]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fabricId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID của loại vải cần phân bổ
 *         example: 12
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - importFabricId
 *               - shelves
 *             properties:
 *               importFabricId:
 *                 type: integer
 *                 description: ID của đơn nhập vải (ImportFabric) mà vải này thuộc về
 *                 example: 5
 *               shelves:
 *                 type: array
 *                 description: Danh sách các kệ và số lượng vải tương ứng
 *                 items:
 *                   type: object
 *                   required:
 *                     - shelfId
 *                     - quantity
 *                   properties:
 *                     shelfId:
 *                       type: integer
 *                       example: 7
 *                     quantity:
 *                       type: number
 *                       example: 30
 *           examples:
 *             example-1:
 *               summary: Phân bổ 50m vải trong đơn nhập #5 vào 2 kệ
 *               value:
 *                 importFabricId: 5
 *                 shelves:
 *                   - shelfId: 7
 *                     quantity: 30
 *                   - shelfId: 8
 *                     quantity: 20
 *     responses:
 *       200:
 *         description: Phân bổ vải thành công trong cùng đơn nhập
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Phân bổ vải thành công"
 *                 data:
 *                   type: object
 *                   properties:
 *                     importFabricId:
 *                       type: integer
 *                       example: 5
 *                     fabricId:
 *                       type: integer
 *                       example: 12
 *                     allocatedShelves:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           shelfId:
 *                             type: integer
 *                             example: 7
 *                           quantity:
 *                             type: integer
 *                             example: 30
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc vượt quá số lượng trong đơn nhập
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền
 *       404:
 *         description: Không tìm thấy vải hoặc đơn nhập tương ứng
 */
router.post(
  '/:fabricId/allocate-to-shelves',
  authenticateToken,
  requirePermission(PERMISSIONS.FABRICS.ALLOCATE_TO_SHELF),
  validate(fabricIdParamSchema, 'params'),
  validate(allocateFabricSchema,'body'),
  allocateFabricToShelves
);

export default router;
