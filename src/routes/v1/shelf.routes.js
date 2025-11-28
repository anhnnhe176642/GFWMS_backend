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
 *     summary: Lấy danh sách kệ với hỗ trợ lọc, tìm kiếm và phân trang
 *     description: |
 *       Lấy danh sách tất cả các kệ trong hệ thống với các tùy chọn lọc, tìm kiếm và sắp xếp nâng cao.
 *       Hỗ trợ lọc theo ID vải (một hoặc nhiều) để tìm những kệ chứa vải cụ thể.
 *       Hỗ trợ gom nhóm vải trên kệ theo các thuộc tính của vải (danh mục, màu sắc, độ bóng, nhà cung cấp).
 *     tags: [Shelves]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo mã kệ
 *         example: "K001"
 *       - in: query
 *         name: warehouseId
 *         schema:
 *           type: string
 *         description: Lọc theo ID kho hàng (hỗ trợ nhiều ID, cách nhau bởi dấu phẩy). Ví dụ "1" hoặc "1,2,3"
 *         example: "1,2,3"
 *       - in: query
 *         name: fabricId
 *         schema:
 *           type: string
 *         description: Lọc theo ID vải (hỗ trợ nhiều ID, cách nhau bởi dấu phẩy). Tìm những kệ chứa vải với ID này. Ví dụ "5" hoặc "5,10,15"
 *         example: "5,10"
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Trường dùng để sắp xếp (id, code, currentQuantity, maxQuantity, warehouseId, createdAt, updatedAt)
 *         example: "createdAt"
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *         description: Thứ tự sắp xếp (asc = tăng, desc = giảm)
 *         example: "desc"
 *       - in: query
 *         name: createdFrom
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Lọc kệ được tạo từ ngày này (ISO 8601 format)
 *         example: "2025-01-01T00:00:00Z"
 *       - in: query
 *         name: createdTo
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Lọc kệ được tạo đến ngày này (ISO 8601 format)
 *         example: "2025-12-31T23:59:59Z"
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *         description: |
 *           Gom nhóm vải trên kệ theo các thuộc tính (hỗ trợ nhiều, cách nhau bởi dấu phẩy).
 *           Các giá trị cho phép: categoryId, colorId, glossId, supplierId
 *           Ví dụ: "categoryId" gom nhóm theo danh mục vải
 *           Ví dụ: "categoryId,colorId" gom nhóm theo danh mục và màu sắc
 *         example: "categoryId,colorId"
 *     responses:
 *       200:
 *         description: Lấy danh sách kệ thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Lấy danh sách kệ thành công"
 *                 data:
 *                   type: array
 *                   items:
 *                     oneOf:
 *                       - $ref: '#/components/schemas/Shelf'
 *                       - $ref: '#/components/schemas/ShelfGrouped'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *             examples:
 *               ungrouped:
 *                 summary: Danh sách kệ bình thường
 *                 value:
 *                   message: "Lấy danh sách kệ thành công"
 *                   data:
 *                     - id: 1
 *                       code: "K001"
 *                       currentQuantity: 150
 *                       maxQuantity: 500
 *                       warehouseId: 1
 *                       createdAt: "2025-11-06T10:30:00Z"
 *                       updatedAt: "2025-11-06T10:30:00Z"
 *                       fabricShelf:
 *                         - fabricId: 5
 *                           quantity: 30
 *                           fabric:
 *                             id: 5
 *                             thickness: 0.5
 *                             length: 100
 *                             width: 1.5
 *                             weight: 2.5
 *                   pagination:
 *                     page: 1
 *                     limit: 10
 *                     total: 25
 *                     totalPages: 3
 *               grouped:
 *                 summary: Danh sách kệ gom nhóm theo danh mục vải
 *                 value:
 *                   message: "Lấy danh sách kệ gom nhóm thành công"
 *                   data:
 *                     - id: 1
 *                       code: "K001"
 *                       currentQuantity: 150
 *                       maxQuantity: 500
 *                       warehouseId: 1
 *                       createdAt: "2025-11-06T10:30:00Z"
 *                       updatedAt: "2025-11-06T10:30:00Z"
 *                       fabricGroups:
 *                         - category:
 *                             id: "2"
 *                             name: "Cotton"
 *                           totalQuantity: 80
 *                           fabrics:
 *                             - id: 5
 *                               quantity: 30
 *                               thickness: 0.5
 *                               length: 100
 *                               width: 1.5
 *                               weight: 2.5
 *                               category:
 *                                 id: "2"
 *                                 name: "Cotton"
 *                             - id: 12
 *                               quantity: 50
 *                               thickness: 0.6
 *                               length: 120
 *                               width: 1.8
 *                               weight: 3.2
 *                               category:
 *                                 id: "2"
 *                                 name: "Cotton"
 *                         - category:
 *                             id: "3"
 *                             name: "Polyester"
 *                           totalQuantity: 70
 *                           fabrics:
 *                             - id: 15
 *                               quantity: 70
 *                               thickness: 0.7
 *                               length: 150
 *                               width: 2.0
 *                               weight: 4.0
 *                               category:
 *                                 id: "3"
 *                                 name: "Polyester"
 *                   pagination:
 *                     page: 1
 *                     limit: 10
 *                     total: 5
 *                     totalPages: 1
 *       400:
 *         description: |
 *           Dữ liệu query không hợp lệ. 
 *           Các lỗi có thể bao gồm:
 *           - Page phải là số nguyên dương
 *           - Limit phải là số nguyên dương
 *           - WarehouseId phải là số nguyên hợp lệ
 *           - FabricId phải là số nguyên hợp lệ
 *           - SortBy phải là trường hợp lệ
 *           - Order phải là asc hoặc desc
 *           - GroupBy chỉ hỗ trợ: categoryId, colorId, glossId, supplierId
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *             examples:
 *               invalidPage:
 *                 summary: Trang không hợp lệ
 *                 value:
 *                   message: "Dữ liệu không hợp lệ"
 *                   errors:
 *                     - field: "page"
 *                       message: "page phải là số nguyên dương"
 *               invalidFabricId:
 *                 summary: ID vải không hợp lệ
 *                 value:
 *                   message: "Dữ liệu không hợp lệ"
 *                   errors:
 *                     - field: "fabricId"
 *                       message: "ID vải phải là số nguyên"
 *               invalidGroupBy:
 *                 summary: GroupBy không hợp lệ
 *                 value:
 *                   message: "Dữ liệu không hợp lệ"
 *                   errors:
 *                     - field: "groupBy"
 *                       message: "Các trường group by không hợp lệ: invalidField. Cho phép: categoryId, colorId, glossId, supplierId"
 *       401:
 *         description: |
 *           Không có quyền truy cập.
 *           - Token không được cung cấp
 *           - Token không hợp lệ hoặc đã hết hạn
 *           - User không tồn tại
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               missingToken:
 *                 summary: Thiếu token
 *                 value:
 *                   message: "Token không được cung cấp"
 *               invalidToken:
 *                 summary: Token không hợp lệ
 *                 value:
 *                   message: "Token không hợp lệ"
 *               expiredToken:
 *                 summary: Token hết hạn
 *                 value:
 *                   message: "Token đã hết hạn"
 *       403:
 *         description: |
 *           Không có quyền xem danh sách kệ.
 *           User không có permission SHELVES.VIEW_LIST
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Bạn không có quyền truy cập tài nguyên này"
 *       500:
 *         description: Lỗi server không mong muốn
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Lỗi server nội bộ"
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
 *     description: |
 *       Tạo một kệ mới trong hệ thống. Kệ sẽ được khởi tạo với số lượng hiện tại = 0.
 *     tags: [Shelves]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 description: Mã định danh của kệ
 *                 example: "K001"
 *               maxQuantity:
 *                 type: integer
 *                 description: Sức chứa tối đa của kệ
 *                 example: 50
 *               warehouseId:
 *                 type: integer
 *                 description: ID của kho hàng chứa kệ này
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
 *                   $ref: '#/components/schemas/Shelf'
 *       400:
 *         description: |
 *           Dữ liệu gửi lên không hợp lệ.
 *           Các lỗi có thể bao gồm:
 *           - code là bắt buộc, phải là string từ 2-50 ký tự
 *           - maxQuantity là bắt buộc, phải là số nguyên > 0
 *           - warehouseId là bắt buộc, phải là số nguyên
 *           - code đã tồn tại (trùng với kệ khác)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *             examples:
 *               missingCode:
 *                 summary: Thiếu mã kệ
 *                 value:
 *                   message: "Dữ liệu không hợp lệ"
 *                   errors:
 *                     - field: "code"
 *                       message: "code là bắt buộc"
 *               codeTooShort:
 *                 summary: Mã kệ quá ngắn
 *                 value:
 *                   message: "Dữ liệu không hợp lệ"
 *                   errors:
 *                     - field: "code"
 *                       message: "Mã kệ phải có ít nhất 2 ký tự"
 *               duplicateCode:
 *                 summary: Mã kệ đã tồn tại
 *                 value:
 *                   message: "Dữ liệu không hợp lệ"
 *                   errors:
 *                     - field: "code"
 *                       message: "Mã kệ đã tồn tại"
 *               invalidMaxQuantity:
 *                 summary: Sức chứa không hợp lệ
 *                 value:
 *                   message: "Dữ liệu không hợp lệ"
 *                   errors:
 *                     - field: "maxQuantity"
 *                       message: "Sức chứa tối đa phải lớn hơn 0"
 *       401:
 *         description: |
 *           Không có quyền truy cập.
 *           - Token không được cung cấp
 *           - Token không hợp lệ hoặc đã hết hạn
 *           - User không tồn tại
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Token không hợp lệ"
 *       403:
 *         description: |
 *           Không có quyền tạo kệ.
 *           User không có permission SHELVES.CREATE
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Bạn không có quyền truy cập tài nguyên này"
 *       500:
 *         description: Lỗi server không mong muốn
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Lỗi server nội bộ"
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
 *     summary: Lấy thông tin kệ theo ID cùng với danh sách vải trên kệ
 *     description: |
 *       Lấy thông tin chi tiết của một kệ cụ thể theo ID của nó, bao gồm danh sách tất cả các loại vải 
 *       đang được lưu trữ trên kệ này cùng với số lượng và thông tin chi tiết của mỗi loại vải 
 *       (bao gồm độ bóng, loại vải, màu sắc, và nhà cung cấp).
 *     tags: [Shelves]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID duy nhất của kệ cần lấy thông tin
 *         example: 1
 *     responses:
 *       200:
 *         description: Lấy thông tin kệ và danh sách vải trên kệ thành công
 *         content:
 *           application/json:
 *             examples:
 *               success:
 *                 summary: Thành công
 *                 value:
 *                   message: "Lấy thông tin kệ thành công"
 *                   shelf:
 *                     id: 1
 *                     code: "K001"
 *                     currentQuantity: 150
 *                     maxQuantity: 500
 *                     warehouseId: 1
 *                     createdAt: "2025-11-06T10:30:00Z"
 *                     updatedAt: "2025-11-06T10:30:00Z"
 *                     fabricShelf:
 *                       - fabricId: 12
 *                         quantity: 30
 *                         fabric:
 *                           id: 12
 *                           thickness: 0.5
 *                           length: 100
 *                           width: 1.5
 *                           weight: 2.5
 *                           sellingPrice: 250000
 *                           gloss:
 *                             id: 1
 *                             description: "Bóng"
 *                           category:
 *                             id: 2
 *                             name: "Cotton"
 *                           color:
 *                             id: "RED"
 *                             name: "Đỏ"
 *                           supplier:
 *                             id: 5
 *                             name: "Nhà cung cấp A"
 *                       - fabricId: 15
 *                         quantity: 50
 *                         fabric:
 *                           id: 15
 *                           thickness: 0.6
 *                           length: 120
 *                           width: 1.8
 *                           weight: 3.2
 *                           sellingPrice: 300000
 *                           gloss:
 *                             id: 2
 *                             description: "Mờ"
 *                           category:
 *                             id: 3
 *                             name: "Polyester"
 *                           color:
 *                             id: "BLUE"
 *                             name: "Xanh"
 *                           supplier:
 *                             id: 6
 *                             name: "Nhà cung cấp B"
 *       400:
 *         description: |
 *           ID không hợp lệ.
 *           - ID phải là số nguyên dương
 *           - ID không được để trống
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               invalidId:
 *                 summary: ID không phải số
 *                 value:
 *                   message: "ID kệ phải là số nguyên dương"
 *               missingId:
 *                 summary: ID không được cung cấp
 *                 value:
 *                   message: "ID kệ là bắt buộc"
 *       401:
 *         description: |
 *           Không có quyền truy cập.
 *           - Token không được cung cấp
 *           - Token không hợp lệ hoặc đã hết hạn
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Token không hợp lệ"
 *       403:
 *         description: |
 *           Không có quyền xem chi tiết kệ.
 *           User không có permission SHELVES.VIEW_DETAIL
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Bạn không có quyền truy cập tài nguyên này"
 *       404:
 *         description: |
 *           Không tìm thấy kệ với ID được chỉ định.
 *           Kệ có thể đã bị xóa hoặc ID không tồn tại
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Không tìm thấy kệ"
 *       500:
 *         description: Lỗi server không mong muốn
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Lỗi server nội bộ"
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
 *     summary: Cập nhật thông tin kệ
 *     description: |
 *       Cập nhật thông tin của một kệ. Cho phép cập nhật mã kệ, số lượng hiện tại, sức chứa tối đa, 
 *       hoặc kho hàng chứa kệ.
 *     tags: [Shelves]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID duy nhất của kệ cần cập nhật
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 description: Mã kệ mới
 *                 example: "K002"
 *               currentQuantity:
 *                 type: integer
 *                 description: Số lượng vải hiện tại trên kệ
 *                 example: 10
 *               maxQuantity:
 *                 type: integer
 *                 description: Sức chứa tối đa của kệ
 *                 example: 60
 *               warehouseId:
 *                 type: integer
 *                 description: ID của kho hàng
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
 *                   $ref: '#/components/schemas/Shelf'
 *       400:
 *         description: |
 *           Dữ liệu không hợp lệ hoặc có lỗi ràng buộc.
 *           - ID kệ không hợp lệ
 *           - code phải là string từ 2-50 ký tự
 *           - code đã tồn tại (trùng với kệ khác)
 *           - maxQuantity phải lớn hơn 0
 *           - currentQuantity phải >= 0
 *           - warehouseId phải là số nguyên hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *             examples:
 *               duplicateCode:
 *                 summary: Mã kệ đã tồn tại
 *                 value:
 *                   message: "Dữ liệu không hợp lệ"
 *                   errors:
 *                     - field: "code"
 *                       message: "Mã kệ đã tồn tại"
 *               invalidId:
 *                 summary: ID không hợp lệ
 *                 value:
 *                   message: "Dữ liệu không hợp lệ"
 *                   errors:
 *                     - field: "id"
 *                       message: "ID kệ phải là số nguyên dương"
 *               invalidMaxQuantity:
 *                 summary: Sức chứa không hợp lệ
 *                 value:
 *                   message: "Dữ liệu không hợp lệ"
 *                   errors:
 *                     - field: "maxQuantity"
 *                       message: "Sức chứa tối đa phải lớn hơn 0"
 *       401:
 *         description: |
 *           Không có quyền truy cập.
 *           - Token không được cung cấp
 *           - Token không hợp lệ hoặc đã hết hạn
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Token không hợp lệ"
 *       403:
 *         description: |
 *           Không có quyền cập nhật kệ.
 *           User không có permission SHELVES.UPDATE
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Bạn không có quyền truy cập tài nguyên này"
 *       404:
 *         description: |
 *           Không tìm thấy kệ với ID được chỉ định.
 *           Kệ có thể đã bị xóa hoặc ID không tồn tại
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Không tìm thấy kệ"
 *       500:
 *         description: Lỗi server không mong muốn
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Lỗi server nội bộ"
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
 *     description: |
 *       Xóa một kệ khỏi hệ thống.
 *     tags: [Shelves]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID duy nhất của kệ cần xóa
 *         example: 1
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
 *                   description: Thông tin kệ đã bị xóa
 *       400:
 *         description: |
 *           ID không hợp lệ hoặc kệ không thể xóa.
 *           - ID phải là số nguyên dương
 *           - ID không được để trống
 *           - Kệ đang được sử dụng có vải trên kho
 *           - Kệ có liên kết dữ liệu từ bảng khác
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               invalidId:
 *                 summary: ID không hợp lệ
 *                 value:
 *                   message: "ID kệ phải là số nguyên dương"
 *               shelfInUse:
 *                 summary: Kệ đang được sử dụng
 *                 value:
 *                   message: "Kệ đang được sử dụng, không thể xóa"
 *               foreignKeyConstraint:
 *                 summary: Kệ có liên kết dữ liệu
 *                 value:
 *                   message: "Không thể xóa Shelf vì có dữ liệu khác đang tham chiếu đến bản ghi này"
 *       401:
 *         description: |
 *           Không có quyền truy cập.
 *           - Token không được cung cấp
 *           - Token không hợp lệ hoặc đã hết hạn
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Token không hợp lệ"
 *       403:
 *         description: |
 *           Không có quyền xóa kệ.
 *           User không có permission SHELVES.DELETE
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Bạn không có quyền truy cập tài nguyên này"
 *       404:
 *         description: |
 *           Không tìm thấy kệ với ID được chỉ định.
 *           Kệ có thể đã bị xóa hoặc ID không tồn tại
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Không tìm thấy kệ"
 *       500:
 *         description: Lỗi server không mong muốn
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Lỗi server nội bộ"
 */
router.delete('/:id',
  requirePermission(PERMISSIONS.SHELVES.DELETE),
  validate(shelfIdSchema, 'params'),
  deleteShelf
);


export default router;
