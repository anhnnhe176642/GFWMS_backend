import express from 'express';
import {
  getAllWarehouses,
  getWarehouseById,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  getWarehouseFabrics,
  getWarehouseShelves
} from '../../controllers/warehouse.controller.js';
import { authenticateToken, requirePermission } from '../../middlewares/auth.middleware.js';
import { validate} from '../../middlewares/validation.middleware.js';
import { 
  createWarehouseSchema, 
  updateWarehouseSchema, 
  warehouseQuerySchema,
  warehouseIdSchema
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
  authenticateToken,
  requirePermission(PERMISSIONS.WAREHOUSES.VIEW_DETAIL),
  validate(warehouseIdSchema, 'params'),
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
  requirePermission(PERMISSIONS.WAREHOUSES.VIEW_DETAIL),
  validate(warehouseIdSchema, 'params'),
  validate(shelfQuerySchema, 'query'),
  getWarehouseShelves
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