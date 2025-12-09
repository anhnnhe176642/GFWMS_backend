import express from 'express';
import {
  getAllWarehouses,
  getWarehouseById,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  getWarehouseFabrics,
  getWarehouseShelves,
  getWarehouseShelvesByFabric,
  calculateFabricPickup
} from '../../controllers/warehouse.controller.js';
import { authenticateToken, requirePermission, requireWarehouseAccess } from '../../middlewares/permission.middleware.js';
import { validate} from '../../middlewares/validation.middleware.js';
import { 
  createWarehouseSchema, 
  updateWarehouseSchema, 
  warehouseQuerySchema,
  warehouseIdSchema,
  warehouseIdWithFabricIdSchema,
  fabricPickupQuerySchema
} from '../../validations/warehouse.validation.js';
import { fabricQuerySchema } from '../../validations/fabric.validation.js';
import { shelfQuerySchema } from '../../validations/shelf.validation.js';
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
 * /warehouses/{id}/fabrics:
 *   get:
 *     summary: Lấy danh sách vải có sẵn trong 1 kho (phân trang + lọc + tìm kiếm)
 *     tags: [Warehouses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID kho
 *         example: 1
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
 *         description: Từ khóa tìm kiếm (màu, loại, nhà cung cấp, độ bóng)
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: |
 *           Trường để sắp xếp (ví dụ: createdAt, supplier.name, category.name)
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *         description: Thứ tự sắp xếp (asc hoặc desc)
 *     responses:
 *       200:
 *         description: Lấy danh sách vải trong kho thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Fabric'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 */
router.get('/:id/fabrics',
  validate(warehouseIdSchema, 'params'),
  authenticateToken,
  requirePermission(PERMISSIONS.WAREHOUSES.VIEW_DETAIL),
  requireWarehouseAccess(req => Promise.resolve(parseInt(req.params.id))),
  validate(fabricQuerySchema, 'query'),
  getWarehouseFabrics
);

/**
 * @swagger
 * /warehouses/{id}/shelves:
 *   get:
 *     summary: Lấy danh sách kệ trong kho với hỗ trợ gom nhóm theo vải
 *     description: |
 *       Lấy danh sách tất cả các kệ trong một kho cụ thể với các tùy chọn lọc, tìm kiếm, sắp xếp và gom nhóm theo thuộc tính vải.
 *       Hỗ trợ GROUP BY theo categoryId, colorId, glossId, supplierId để hiển thị tổng số lượng vải có cùng thuộc tính trên các kệ.
 *     tags: [Warehouses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của kho hàng
 *         example: 1
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Trang hiện tại
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Số lượng bản ghi trên một trang
 *         example: 10
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *         description: |
 *           Gom nhóm kết quả theo thuộc tính vải. Hỗ trợ các trường: categoryId, colorId, glossId, supplierId.
 *           Có thể gom nhóm theo một hoặc nhiều trường cách nhau bởi dấu phẩy.
 *           Ví dụ: "categoryId" hoặc "categoryId,colorId" hoặc "categoryId,colorId,glossId"
 *         example: "categoryId,colorId"
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo mã kệ
 *         example: "K001"
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Trường dùng để sắp xếp (id, code, currentQuantity, maxQuantity, createdAt, updatedAt)
 *         example: "code"
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Thứ tự sắp xếp
 *         example: "asc"
 *     responses:
 *       200:
 *         description: Lấy danh sách kệ trong kho thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Lấy danh sách kệ trong kho thành công"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       code:
 *                         type: string
 *                       currentQuantity:
 *                         type: integer
 *                       maxQuantity:
 *                         type: integer
 *                       warehouseId:
 *                         type: integer
 *                       totalQuantity:
 *                         type: integer
 *                         description: "Tổng số lượng vải trong gom nhóm (chỉ có khi sử dụng groupBy)"
 *                       fabricGroup:
 *                         type: object
 *                         description: "Thông tin các thuộc tính vải được gom nhóm (chỉ có khi sử dụng groupBy)"
 *                         properties:
 *                           categoryId:
 *                             type: string
 *                           colorId:
 *                             type: string
 *                           glossId:
 *                             type: integer
 *                           supplierId:
 *                             type: integer
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không có quyền truy cập
 *       403:
 *         description: Không có quyền xem danh sách kệ
 *       500:
 *         description: Lỗi server không mong muốn
 */
router.get('/:id/shelves',
  validate(warehouseIdSchema, 'params'),
  requirePermission(PERMISSIONS.WAREHOUSES.VIEW_DETAIL),
  requireWarehouseAccess(req => Promise.resolve(parseInt(req.params.id))),
  validate(shelfQuerySchema, 'query'),
  getWarehouseShelves
);

/**
 * @swagger
 * /warehouses/{id}/fabrics/{fabricId}/shelves:
 *   get:
 *     summary: Lấy danh sách kệ theo loại vải trong kho với chi tiết từng lô import
 *     description: |
 *       Lấy danh sách các kệ trong kho có chứa loại vải cụ thể.
 *       Bao gồm chi tiết từng lô nhập (batch): ngày import, giá import, số lượng hiện tại,
 *       thông tin người nhập kho.
 *       Thông tin vải được trả về 1 lần ở mức root data, không lặp lại trong mỗi kệ.
 *     tags: [Warehouses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của kho hàng
 *         example: 1
 *       - in: path
 *         name: fabricId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của loại vải
 *         example: 5
 *     responses:
 *       200:
 *         description: Lấy danh sách kệ theo loại vải thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Lấy danh sách kệ theo loại vải thành công"
 *                 data:
 *                   type: object
 *                   properties:
 *                     warehouseId:
 *                       type: integer
 *                       example: 1
 *                     fabricId:
 *                       type: integer
 *                       example: 5
 *                     totalShelves:
 *                       type: integer
 *                       description: Tổng số kệ chứa loại vải này
 *                       example: 3
 *                     totalBatches:
 *                       type: integer
 *                       description: Tổng số lô (batches) import trên tất cả các kệ
 *                       example: 5
 *                     totalQuantity:
 *                       type: integer
 *                       description: Tổng số lượng vải trên tất cả các kệ
 *                       example: 150
 *                     fabric:
 *                       type: object
 *                       description: Thông tin loại vải (chỉ trả về 1 lần)
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 5
 *                         thickness:
 *                           type: number
 *                           example: 0.5
 *                         length:
 *                           type: number
 *                           example: 100
 *                         width:
 *                           type: number
 *                           example: 150
 *                         weight:
 *                           type: number
 *                           example: 2.5
 *                         sellingPrice:
 *                           type: number
 *                           example: 200000
 *                         category:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: integer
 *                             name:
 *                               type: string
 *                               example: "Cotton"
 *                         color:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                             name:
 *                               type: string
 *                               example: "Đỏ"
 *                         supplier:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: integer
 *                             name:
 *                               type: string
 *                               example: "Nhà cung cấp A"
 *                         gloss:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: integer
 *                             description:
 *                               type: string
 *                               example: "Bóng"
 *                     shelves:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           code:
 *                             type: string
 *                             example: "K001"
 *                           currentQuantity:
 *                             type: integer
 *                             description: Tổng số cuộn vải hiện có trên kệ (tất cả loại)
 *                             example: 45
 *                           maxQuantity:
 *                             type: integer
 *                             description: Sức chứa tối đa của kệ
 *                             example: 50
 *                           totalFabricQuantity:
 *                             type: integer
 *                             description: Tổng số lượng của loại vải này trên kệ (tổng từ tất cả các lô)
 *                             example: 30
 *                           batches:
 *                             type: array
 *                             description: Chi tiết từng lô import trên kệ
 *                             items:
 *                               type: object
 *                               properties:
 *                                 importId:
 *                                   type: integer
 *                                   description: ID của phiếu nhập kho
 *                                   example: 10
 *                                 importDate:
 *                                   type: string
 *                                   format: date-time
 *                                   description: Ngày nhập kho
 *                                   example: "2025-01-15T08:30:00Z"
 *                                 importStatus:
 *                                   type: string
 *                                   description: Trạng thái phiếu nhập
 *                                   example: "COMPLETED"
 *                                 importPrice:
 *                                   type: number
 *                                   description: Giá nhập kho (đơn giá)
 *                                   example: 150000
 *                                 currentQuantity:
 *                                   type: integer
 *                                   description: Số lượng còn lại của lô này trên kệ
 *                                   example: 15
 *                                 originalQuantity:
 *                                   type: integer
 *                                   description: Số lượng ban đầu khi nhập kho
 *                                   example: 20
 *                                 importedBy:
 *                                   type: object
 *                                   description: Thông tin người nhập kho
 *                                   properties:
 *                                     id:
 *                                       type: string
 *                                       example: "user123"
 *                                     fullName:
 *                                       type: string
 *                                       example: "Nguyễn Văn A"
 *                                     email:
 *                                       type: string
 *                                       example: "nguyenvana@example.com"
 *                                 createdAt:
 *                                   type: string
 *                                   format: date-time
 *                                   example: "2025-01-15T08:30:00Z"
 *                                 updatedAt:
 *                                   type: string
 *                                   format: date-time
 *                                   example: "2025-01-20T10:00:00Z"
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không có quyền truy cập
 *       403:
 *         description: Không có quyền xem chi tiết kho
 *       404:
 *         description: Không tìm thấy kho hoặc vải
 *       500:
 *         description: Lỗi server không mong muốn
 */
router.get('/:id/fabrics/:fabricId/shelves',
  validate(warehouseIdWithFabricIdSchema, 'params'),
  requirePermission(PERMISSIONS.WAREHOUSES.VIEW_DETAIL),
  requireWarehouseAccess(req => Promise.resolve(parseInt(req.params.id))),
  getWarehouseShelvesByFabric
);

/**
 * @swagger
 * /warehouses/{id}/fabrics/{fabricId}/pickup:
 *   get:
 *     summary: Tính toán phân bổ lấy vải tối ưu từ các kệ/lô
 *     description: |
 *       Tính toán cách lấy vải từ các kệ/lô theo tiêu chí ưu tiên.
 *       
 *       Các giá trị priority:
 *       - NEWEST_FIRST: Ưu tiên lấy lô nhập mới nhất trước
 *       - OLDEST_FIRST: Ưu tiên lấy lô nhập cũ nhất trước (FIFO)
 *       - LOWEST_PRICE: Ưu tiên lấy lô có giá nhập thấp nhất trước
 *       - HIGHEST_PRICE: Ưu tiên lấy lô có giá nhập cao nhất trước
 *       - FEWEST_SHELVES: Ưu tiên lấy ít kệ nhất (lấy từ kệ có nhiều hàng trước)
 *     tags: [Warehouses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của kho hàng
 *         example: 1
 *       - in: path
 *         name: fabricId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của loại vải
 *         example: 5
 *       - in: query
 *         name: quantity
 *         required: true
 *         schema:
 *           type: integer
 *         description: Số lượng vải cần lấy
 *         example: 50
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [NEWEST_FIRST, OLDEST_FIRST, LOWEST_PRICE, HIGHEST_PRICE, FEWEST_SHELVES]
 *           default: NEWEST_FIRST
 *         description: Tiêu chí ưu tiên khi lấy hàng
 *         example: "NEWEST_FIRST"
 *     responses:
 *       200:
 *         description: Tính toán phân bổ lấy hàng thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Tính toán phân bổ lấy hàng thành công"
 *                 data:
 *                   type: object
 *                   properties:
 *                     warehouseId:
 *                       type: integer
 *                       example: 1
 *                     fabricId:
 *                       type: integer
 *                       example: 5
 *                     fabric:
 *                       type: object
 *                       description: Thông tin loại vải
 *                     requiredQuantity:
 *                       type: integer
 *                       description: Số lượng yêu cầu
 *                       example: 50
 *                     totalAvailable:
 *                       type: integer
 *                       description: Tổng số lượng có sẵn trong kho
 *                       example: 150
 *                     priority:
 *                       type: string
 *                       description: Tiêu chí ưu tiên đã sử dụng
 *                       example: "NEWEST_FIRST"
 *                     summary:
 *                       type: object
 *                       description: Tóm tắt kết quả phân bổ
 *                       properties:
 *                         totalShelvesUsed:
 *                           type: integer
 *                           description: Số kệ cần lấy
 *                           example: 2
 *                         totalBatchesUsed:
 *                           type: integer
 *                           description: Số lô cần lấy
 *                           example: 3
 *                         totalPickQuantity:
 *                           type: integer
 *                           description: Tổng số lượng lấy
 *                           example: 50
 *                         totalCost:
 *                           type: number
 *                           description: Tổng chi phí (giá nhập)
 *                           example: 7500000
 *                         averageCostPerUnit:
 *                           type: number
 *                           description: Chi phí trung bình mỗi đơn vị
 *                           example: 150000
 *                     shelves:
 *                       type: array
 *                       description: Danh sách các kệ cần lấy
 *                       items:
 *                         type: object
 *                         properties:
 *                           shelfId:
 *                             type: integer
 *                             example: 1
 *                           shelfCode:
 *                             type: string
 *                             example: "K001"
 *                           totalPickQuantity:
 *                             type: integer
 *                             description: Tổng số lượng lấy từ kệ này
 *                             example: 30
 *                           batches:
 *                             type: array
 *                             description: Chi tiết từng lô cần lấy
 *                             items:
 *                               type: object
 *                               properties:
 *                                 importId:
 *                                   type: integer
 *                                   example: 10
 *                                 importDate:
 *                                   type: string
 *                                   format: date-time
 *                                   example: "2025-01-15T08:30:00Z"
 *                                 importPrice:
 *                                   type: number
 *                                   example: 150000
 *                                 availableQuantity:
 *                                   type: integer
 *                                   description: Số lượng có sẵn trong lô
 *                                   example: 20
 *                                 pickQuantity:
 *                                   type: integer
 *                                   description: Số lượng cần lấy từ lô này
 *                                   example: 15
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc số lượng yêu cầu vượt quá có sẵn
 *       401:
 *         description: Không có quyền truy cập
 *       403:
 *         description: Không có quyền xem chi tiết kho
 *       404:
 *         description: Không tìm thấy kho hoặc vải
 *       500:
 *         description: Lỗi server không mong muốn
 */
router.get('/:id/fabrics/:fabricId/pickup',
  validate(warehouseIdWithFabricIdSchema, 'params'),
  requirePermission(PERMISSIONS.WAREHOUSES.VIEW_DETAIL),
  requireWarehouseAccess(req => Promise.resolve(parseInt(req.params.id))),
  validate(fabricPickupQuerySchema, 'query'),
  calculateFabricPickup
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
  validate(warehouseIdSchema, 'params'),
  requirePermission(PERMISSIONS.WAREHOUSES.VIEW_DETAIL),
  requireWarehouseAccess(req => Promise.resolve(parseInt(req.params.id))),
  getWarehouseById
);

/**
 * @swagger
 * /warehouses/{id}:
 *   patch:
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
router.patch('/:id', 
  validate(warehouseIdSchema, 'params'),
  validate(updateWarehouseSchema, 'body'),
  requirePermission(PERMISSIONS.WAREHOUSES.UPDATE),
  requireWarehouseAccess(req => Promise.resolve(parseInt(req.params.id))),
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
  validate(warehouseIdSchema, 'params'),
  requirePermission(PERMISSIONS.WAREHOUSES.DELETE),
  requireWarehouseAccess(req => Promise.resolve(parseInt(req.params.id))),
  deleteWarehouse
);

export default router;