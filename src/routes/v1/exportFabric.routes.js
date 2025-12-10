import express from 'express';
import {
  getAllExportFabrics,
  getExportFabricDetailForWarehouse,
  getExportFabricDetailForStore,
  createExportFabric,
  updateExportFabricStatus,
  completeExportFabric,
  previewInventory,
  suggestAllocation,
  createBatchExportFabric
} from '../../controllers/exportFabric.controller.js';
import { authenticateToken, requirePermission } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validation.middleware.js';
import {
  exportFabricIdParamSchema,
  exportFabricQuerySchema,
  createExportFabricSchema,
  approveExportFabricSchema,
  previewInventorySchema,
  createBatchExportFabricSchema
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
 * /export-fabrics/preview:
 *   post:
 *     summary: Xem tồn kho theo warehouse cho danh sách fabric
 *     description: Trả về thông tin tồn kho theo từng kho cho các loại vải được yêu cầu. Dữ liệu được nhóm theo fabric, mỗi fabric có danh sách các kho có tồn kho.
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
 *               - fabricItems
 *             properties:
 *               fabricItems:
 *                 type: array
 *                 description: Danh sách các fabric cần kiểm tra tồn kho
 *                 items:
 *                   type: object
 *                   required:
 *                     - fabricId
 *                     - quantity
 *                   properties:
 *                     fabricId:
 *                       type: integer
 *                       description: ID của fabric
 *                     quantity:
 *                       type: integer
 *                       description: Số lượng yêu cầu
 *           example:
 *             fabricItems:
 *               - fabricId: 1
 *                 quantity: 100
 *               - fabricId: 2
 *                 quantity: 50
 *     responses:
 *       200:
 *         description: Lấy thông tin tồn kho thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Lấy thông tin tồn kho thành công
 *                 fabrics:
 *                   type: array
 *                   description: Danh sách fabric với tồn kho từng kho
 *                   items:
 *                     type: object
 *                     properties:
 *                       fabricId:
 *                         type: integer
 *                       fabric:
 *                         type: object
 *                         description: Thông tin chi tiết fabric
 *                         properties:
 *                           id:
 *                             type: integer
 *                           category:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               name:
 *                                 type: string
 *                           color:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               name:
 *                                 type: string
 *                           sellingPrice:
 *                             type: number
 *                           quantityInStock:
 *                             type: integer
 *                       requestedQuantity:
 *                         type: integer
 *                         description: Số lượng được yêu cầu
 *                       availableStocks:
 *                         type: array
 *                         description: Tồn kho từng kho
 *                         items:
 *                           type: object
 *                           properties:
 *                             warehouseId:
 *                               type: integer
 *                             warehouseName:
 *                               type: string
 *                             currentStock:
 *                               type: integer
 *                       totalAvailable:
 *                         type: integer
 *                         description: Tổng tồn kho tất cả kho
 *                       isSufficient:
 *                         type: boolean
 *                         description: Có đủ hàng không
 *             example:
 *               message: Lấy thông tin tồn kho thành công
 *               fabrics:
 *                 - fabricId: 1
 *                   fabric:
 *                     id: 1
 *                     category:
 *                       id: 1
 *                       name: "Vải linen"
 *                     color:
 *                       id: 2
 *                       name: "Trắng"
 *                     sellingPrice: 50000
 *                     quantityInStock: 800
 *                   requestedQuantity: 100
 *                   availableStocks:
 *                     - warehouseId: 1
 *                       warehouseName: "Kho Miền Nam"
 *                       currentStock: 237
 *                     - warehouseId: 2
 *                       warehouseName: "Kho Miền Bắc"
 *                       currentStock: 400
 *                     - warehouseId: 3
 *                       warehouseName: "Kho Trung tâm"
 *                       currentStock: 163
 *                   totalAvailable: 800
 *                   isSufficient: true
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post(
  '/preview',
  authenticateToken,
  requirePermission(PERMISSIONS.EXPORT_FABRICS.CREATE),
  validate(previewInventorySchema, 'body'),
  previewInventory
);

/**
 * @swagger
 * /export-fabrics/suggest:
 *   post:
 *     summary: Gợi ý phân bổ tối ưu cho các fabric (Greedy Algorithm)
 *     description: |
 *       Sử dụng thuật toán Greedy để gợi ý phân bổ tối ưu từ các kho.
 *       - Ưu tiên kho có tồn kho nhiều nhất cho mỗi loại vải
 *       - Trả về danh sách kho được chọn và số lượng từ mỗi kho
 *       - Cấu trúc dữ liệu giống preview nhưng thêm trường `selected` và `takeQuantity`
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
 *               - fabricItems
 *             properties:
 *               fabricItems:
 *                 type: array
 *                 description: Danh sách fabric cần phân bổ
 *                 items:
 *                   type: object
 *                   required:
 *                     - fabricId
 *                     - quantity
 *                   properties:
 *                     fabricId:
 *                       type: integer
 *                     quantity:
 *                       type: integer
 *           example:
 *             fabricItems:
 *               - fabricId: 1
 *                 quantity: 100
 *               - fabricId: 2
 *                 quantity: 50
 *     responses:
 *       200:
 *         description: Gợi ý phân bổ thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Gợi ý phân bổ thành công
 *                 fabrics:
 *                   type: array
 *                   description: Danh sách fabric với gợi ý phân bổ từng kho
 *                   items:
 *                     type: object
 *                     properties:
 *                       fabricId:
 *                         type: integer
 *                       fabric:
 *                         type: object
 *                       requestedQuantity:
 *                         type: integer
 *                       availableStocks:
 *                         type: array
 *                         description: Danh sách kho với lựa chọn và số lượng phân bổ
 *                         items:
 *                           type: object
 *                           properties:
 *                             warehouseId:
 *                               type: integer
 *                             warehouseName:
 *                               type: string
 *                             currentStock:
 *                               type: integer
 *                             selected:
 *                               type: boolean
 *                               description: Kho này có được chọn hay không
 *                             takeQuantity:
 *                               type: integer
 *                               description: Số lượng lấy từ kho này (chỉ có khi selected=true)
 *                       totalAvailable:
 *                         type: integer
 *                       isSufficient:
 *                         type: boolean
 *             example:
 *               message: Gợi ý phân bổ thành công
 *               fabrics:
 *                 - fabricId: 1
 *                   fabric:
 *                     id: 1
 *                     category: {id: 1, name: "Vải linen"}
 *                     color: {id: 2, name: "Trắng"}
 *                   requestedQuantity: 100
 *                   availableStocks:
 *                     - warehouseId: 2
 *                       warehouseName: "Kho Miền Bắc"
 *                       currentStock: 400
 *                       selected: true
 *                       takeQuantity: 100
 *                     - warehouseId: 1
 *                       warehouseName: "Kho Miền Nam"
 *                       currentStock: 237
 *                       selected: false
 *                     - warehouseId: 3
 *                       warehouseName: "Kho Trung tâm"
 *                       currentStock: 163
 *                       selected: false
 *                   totalAvailable: 800
 *                   isSufficient: true
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post(
  '/suggest',
  authenticateToken,
  requirePermission(PERMISSIONS.EXPORT_FABRICS.CREATE),
  validate(previewInventorySchema, 'body'),
  suggestAllocation
);

/**
 * @swagger
 * /export-fabrics/batch:
 *   post:
 *     summary: Tạo batch phiếu xuất vải (1 phiếu per warehouse)
 *     description: |
 *       Tạo nhiều phiếu xuất cùng lúc từ nhiều kho khác nhau.
 *       - Tạo 1 ExportFabric cho mỗi warehouse trong danh sách phân bổ
 *       - Tự động trừ quantityInStock của fabric từng loại
 *       - Các phiếu cùng batch có chung batchId (bằng ID phiếu đầu tiên)
 *       - Trạng thái ban đầu: PENDING (chưa được phê duyệt)
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
 *               - storeId
 *               - warehouseAllocations
 *             properties:
 *               storeId:
 *                 type: integer
 *                 description: ID cửa hàng nhận
 *               note:
 *                 type: string
 *                 description: Ghi chú chung cho các phiếu xuất
 *               warehouseAllocations:
 *                 type: array
 *                 description: Danh sách phân bổ theo kho (từ API suggest hoặc manual)
 *                 items:
 *                   type: object
 *                   required:
 *                     - warehouseId
 *                     - items
 *                   properties:
 *                     warehouseId:
 *                       type: integer
 *                       description: ID kho xuất
 *                     items:
 *                       type: array
 *                       description: Danh sách fabric xuất từ kho này
 *                       items:
 *                         type: object
 *                         required:
 *                           - fabricId
 *                           - quantity
 *                         properties:
 *                           fabricId:
 *                             type: integer
 *                           quantity:
 *                             type: integer
 *           example:
 *             storeId: 1
 *             note: "Xuất hàng tháng 12"
 *             warehouseAllocations:
 *               - warehouseId: 2
 *                 items:
 *                   - fabricId: 1
 *                     quantity: 100
 *               - warehouseId: 1
 *                 items:
 *                   - fabricId: 1
 *                     quantity: 50
 *                   - fabricId: 2
 *                     quantity: 30
 *     responses:
 *       201:
 *         description: Tạo batch phiếu xuất vải thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Tạo phiếu xuất vải thành công
 *                 batchId:
 *                   type: integer
 *                   description: ID batch để tracking các phiếu cùng đợt (bằng ID phiếu đầu tiên)
 *                 exports:
 *                   type: array
 *                   description: Danh sách các phiếu xuất vừa tạo
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       warehouseId:
 *                         type: integer
 *                       storeId:
 *                         type: integer
 *                       status:
 *                         type: string
 *                         example: PENDING
 *                       note:
 *                         type: string
 *                       batchId:
 *                         type: integer
 *             example:
 *               message: Tạo phiếu xuất vải thành công
 *               batchId: 101
 *               exports:
 *                 - id: 101
 *                   warehouseId: 2
 *                   storeId: 1
 *                   status: PENDING
 *                   note: "Xuất hàng tháng 12"
 *                   batchId: 101
 *                 - id: 102
 *                   warehouseId: 1
 *                   storeId: 1
 *                   status: PENDING
 *                   note: "Xuất hàng tháng 12"
 *                   batchId: 101
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post(
  '/batch',
  authenticateToken,
  requirePermission(PERMISSIONS.EXPORT_FABRICS.CREATE),
  validate(createBatchExportFabricSchema, 'body'),
  createBatchExportFabric
);

/**
 * @swagger
 * /export-fabrics/{id}:
 *   get:
 *     summary: Lấy chi tiết phiếu xuất vải cho cửa hàng
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
 *         description: Lấy chi tiết phiếu xuất thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Lấy thông tin phiếu xuất vải cho cửa hàng thành công
 *                 exportFabric:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     warehouseId:
 *                       type: integer
 *                     storeId:
 *                       type: integer
 *                     status:
 *                       type: string
 *                       enum: [PENDING, APPROVED, REJECTED, COMPLETED]
 *                     note:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                     warehouse:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                     store:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                     createdBy:
 *                       type: object
 *                       properties:
 *                         username:
 *                           type: string
 *                         email:
 *                           type: string
 *                     receivedBy:
 *                       type: object
 *                       properties:
 *                         username:
 *                           type: string
 *                         email:
 *                           type: string
 *                     exportItems:
 *                       type: array
 *                       description: Danh sách các loại vải trong phiếu xuất
 *                       items:
 *                         type: object
 *                         properties:
 *                           fabricId:
 *                             type: integer
 *                           quantity:
 *                             type: integer
 *                           price:
 *                             type: number
 *                             description: Giá nhập (được lưu khi APPROVED)
 *                           fabric:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               sellingPrice:
 *                                 type: number
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
 *     summary: Lấy chi tiết phiếu xuất vải cho kho (có gợi ý kệ)
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
 *                   example: Lấy thông tin phiếu xuất vải cho kho thành công
 *                 exportFabric:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     warehouseId:
 *                       type: integer
 *                     storeId:
 *                       type: integer
 *                     status:
 *                       type: string
 *                       enum: [PENDING, APPROVED, REJECTED, COMPLETED]
 *                     exportItems:
 *                       type: array
 *                       description: Danh sách fabric với gợi ý kệ (shelfSuggestions)
 *                       items:
 *                         type: object
 *                         properties:
 *                           fabricId:
 *                             type: integer
 *                           quantity:
 *                             type: integer
 *                           price:
 *                             type: number
 *                           shelfSuggestions:
 *                             type: array
 *                             description: Danh sách kệ trong kho chứa fabric này
 *                             items:
 *                               type: object
 *                               properties:
 *                                 shelfId:
 *                                   type: integer
 *                                 shelfCode:
 *                                   type: string
 *                                 availableQuantity:
 *                                   type: integer
 *                                   description: Số lượng hiện có trên kệ
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
 *     summary: Tạo phiếu xuất vải (Nhân viên kho)
 *     description: |
 *       Tạo 1 phiếu xuất từ 1 kho tới 1 cửa hàng
 *       - Trạng thái ban đầu: PENDING (chưa được phê duyệt)
 *       - Tự động trừ quantityInStock của fabric từng loại
 *       - Cần gọi API /export-fabrics/{id}/status để duyệt và chỉ định batch/kệ
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
 *         description: Tạo phiếu xuất vải thành công (trạng thái PENDING)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Tạo phiếu xuất vải thành công
 *                 exportFabric:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     warehouseId:
 *                       type: integer
 *                     storeId:
 *                       type: integer
 *                     status:
 *                       type: string
 *                       example: PENDING
 *                     note:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     exportItems:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           fabricId:
 *                             type: integer
 *                           quantity:
 *                             type: integer
 *                           price:
 *                             type: number
 *                             nullable: true
 *                             description: Null khi PENDING, sẽ được lưu khi APPROVED
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
 *     summary: Duyệt hoặc từ chối phiếu xuất vải (Nhân viên kho)
 *     description: |
 *       Nhân viên kho duyệt phiếu xuất vải:
 *       - Khi APPROVED: Cung cấp chi tiết batch (importId, shelfId, pickQuantity) → Hệ thống trừ kho warehouse, tự động lấy giá nhập từ DB
 *       - Khi REJECTED: Cung cấp lý do từ chối (note), hoàn trả số lượng vải về quantityInStock
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [APPROVED, REJECTED]
 *                 description: Trạng thái duyệt phiếu
 *               batchPickupDetails:
 *                 type: array
 *                 description: |
 *                   Danh sách chi tiết batch lấy (BẮT BUỘC khi status = APPROVED).
 *                   Hệ thống sẽ tự động tìm kiếm giá nhập (importPrice) từ cơ sở dữ liệu dựa trên fabricId và importId.
 *                 items:
 *                   type: object
 *                   required:
 *                     - fabricId
 *                     - batches
 *                   properties:
 *                     fabricId:
 *                       type: integer
 *                       description: ID của loại vải
 *                       example: 5
 *                     batches:
 *                       type: array
 *                       description: Danh sách batch (lô) cần lấy - chỉ cần 3 thông tin cơ bản
 *                       items:
 *                         type: object
 *                         required:
 *                           - importId
 *                           - shelfId
 *                           - pickQuantity
 *                         properties:
 *                           importId:
 *                             type: integer
 *                             description: ID đơn nhập
 *                             example: 2
 *                           shelfId:
 *                             type: integer
 *                             description: ID kệ chứa batch này
 *                             example: 12
 *                           pickQuantity:
 *                             type: integer
 *                             description: Số lượng cần lấy từ batch này
 *                             example: 30
 *               note:
 *                 type: string
 *                 description: |
 *                   Lý do từ chối hoặc ghi chú bổ sung (BẮT BUỘC khi status = REJECTED).
 *                   Max 500 ký tự.
 *                 example: Hàng bị lỗi, chất lượng không đạt tiêu chuẩn
 *           examples:
 *             approve:
 *               summary: Duyệt phiếu xuất với batch details
 *               value:
 *                 status: APPROVED
 *                 batchPickupDetails:
 *                   - fabricId: 5
 *                     batches:
 *                       - importId: 2
 *                         shelfId: 12
 *                         pickQuantity: 30
 *                       - importId: 3
 *                         shelfId: 15
 *                         pickQuantity: 20
 *             reject:
 *               summary: Từ chối phiếu xuất
 *               value:
 *                 status: REJECTED
 *                 note: Hàng bị hư hỏng, không đủ tiêu chuẩn xuất hàng
 *     responses:
 *       200:
 *         description: Phiếu xuất vải đã được duyệt / từ chối
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Cập nhật trạng thái đơn thành công
 *                 exportFabric:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     warehouseId:
 *                       type: integer
 *                     storeId:
 *                       type: integer
 *                     status:
 *                       type: string
 *                       description: Trạng thái sau cập nhật (APPROVED, REJECTED, hoặc COMPLETED)
 *                       enum: [PENDING, APPROVED, REJECTED, COMPLETED]
 *                     note:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                     warehouse:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                     store:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                     createdBy:
 *                       type: object
 *                       properties:
 *                         username:
 *                           type: string
 *                     receivedBy:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         username:
 *                           type: string
 *                     exportItems:
 *                       type: array
 *                       description: Khi APPROVED, price được lưu từ ImportFabricItem
 *                       items:
 *                         type: object
 *                         properties:
 *                           fabricId:
 *                             type: integer
 *                           quantity:
 *                             type: integer
 *                           price:
 *                             type: number
 *                             description: Giá nhập (khi APPROVED)
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
  validate([
    { schema: exportFabricIdParamSchema, source: 'params' },
    { schema: approveExportFabricSchema, source: 'body' }
  ]),
  updateExportFabricStatus
);

/**
 * @swagger
 * /export-fabrics/{id}/complete:
 *   post:
 *     summary: Xác nhận nhận hàng từ cửa hàng (APPROVED -> COMPLETED)
 *     description: |
 *       Nhân viên cửa hàng xác nhận đã nhận hàng từ phiếu xuất:
 *       - Chuyển status từ APPROVED sang COMPLETED
 *       - **Tự động cộng vải vào FabricStore** với các tính toán:
 *         - `totalMeters = quantity × fabric.length`
 *         - `totalValue = quantity × importPrice` (giá nhập từ ImportFabricItem)
 *         - `uncutRolls = quantity` (tất cả là cuộn chưa cắt)
 *         - `cuttingRollMeters = 0`
 *       
 *       **Lưu ý:** Giá nhập đã được lưu trong ExportFabricItem.price khi nhân viên kho APPROVED phiếu xuất
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
 *         description: Xác nhận nhận hàng thành công - Vải đã được cộng vào FabricStore
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Xác nhận nhận hàng thành công
 *                 exportFabric:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     status:
 *                       type: string
 *                       enum: [COMPLETED]
 *                     storeId:
 *                       type: integer
 *                     warehouseId:
 *                       type: integer
 *                     exportItems:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           fabricId:
 *                             type: integer
 *                           quantity:
 *                             type: integer
 *                           price:
 *                             type: number
 *                             description: Giá nhập từ ImportFabricItem
 *       400:
 *         description: Phiếu xuất chưa ở trạng thái APPROVED hoặc dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy phiếu xuất
 */
router.post(
  '/:id/complete',
  authenticateToken,
  requirePermission(PERMISSIONS.EXPORT_FABRICS.RECEIVE),
  validate(exportFabricIdParamSchema, 'params'),
  completeExportFabric
);

export default router;
