import express from 'express';
import {
  getAllFabrics,
  getFabricById,
  getFabricInventoryByWarehouse
} from '../../controllers/fabric.controller.js';
import { authenticateToken, requirePermission } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validation.middleware.js';
import {
  fabricIdParamSchema,
  fabricQuerySchema 
} from '../../validations/fabric.validation.js';
import { PERMISSIONS } from '../../constants/permissions.js';

const router = express.Router();

// Lấy danh sách Vải
/**
 * @swagger
 * /fabrics:
 *   get:
 *     summary: Lấy danh sách vải (có bộ lọc nâng cao và phân trang)
 *     tags: [Fabrics]
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
 *         description: Từ khóa tìm kiếm (tìm theo màu, loại, độ bóng, hoặc nhà cung cấp)
 *       - in: query
 *         name: glossId
 *         schema:
 *           type: string
 *         description: Lọc theo ID độ bóng (có thể truyền nhiều giá trị, cách nhau bằng dấu phẩy)
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: Lọc theo ID loại vải (có thể truyền nhiều giá trị, cách nhau bằng dấu phẩy)
 *       - in: query
 *         name: colorId
 *         schema:
 *           type: string
 *         description: Lọc theo ID màu vải (có thể truyền nhiều giá trị, cách nhau bằng dấu phẩy)
 *       - in: query
 *         name: supplierId
 *         schema:
 *           type: string
 *         description: Lọc theo ID nhà cung cấp (có thể truyền nhiều giá trị, cách nhau bằng dấu phẩy)
 *       - in: query
 *         name: createdFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Lọc vải được tạo từ ngày này trở đi (định dạng YYYY-MM-DD)
 *         example: "2025-01-01"
 *       - in: query
 *         name: createdTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Lọc vải được tạo cho đến ngày này (định dạng YYYY-MM-DD, phải >= createdFrom)
 *         example: "2025-12-31"
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Trường để sắp xếp (id, category.name, color.name, gloss.description, supplier.name, createdAt, updatedAt, sellingPrice, quantityInStock, weight, length, width)
 *         example: "sellingPrice"
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *         description: Thứ tự sắp xếp (asc hoặc desc)
 *         example: "desc"
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
 *                   example: Lấy danh sách vải thành công
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Fabric'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *             example:
 *               message: Lấy danh sách vải thành công
 *               data:
 *                 - id: 1
 *                   thickness: 0.25
 *                   gloss:
 *                     id: 1
 *                     description: "Bóng"
 *                   length: 50
 *                   width: 1.5
 *                   weight: 2.5
 *                   sellingPrice: 150000
 *                   quantityInStock: 100
 *                   category:
 *                     id: 2
 *                     name: "Cotton"
 *                   color:
 *                     id: 3
 *                     name: "Đỏ"
 *                   supplier:
 *                     id: 5
 *                     name: "Nhà cung cấp A"
 *                   createdAt: "2025-10-01T10:00:00.000Z"
 *                   updatedAt: "2025-10-05T12:00:00.000Z"
 *               pagination:
 *                 page: 1
 *                 limit: 10
 *                 total: 25
 *                 totalPages: 3
 *       400:
 *         description: Lỗi validation - tham số không hợp lệ
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

router.get(
  '/',
  validate(fabricQuerySchema, 'query'),
  getAllFabrics
);


// Lấy chi tiết Fabric
/**
 * @swagger
 * /fabrics/{id}:
 *   get:
 *     summary: Lấy chi tiết một vải
 *     tags: [Fabrics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của vải
 *         example: 1
 *     responses:
 *       200:
 *         description: Lấy chi tiết thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Lấy chi tiết vải thành công
 *                 data:
 *                   $ref: '#/components/schemas/Fabric'
 *             example:
 *               message: Lấy chi tiết vải thành công
 *               data:
 *                 id: 1
 *                 thickness: 0.25
 *                 gloss:
 *                   id: 1
 *                   description: "Bóng"
 *                 length: 50
 *                 width: 1.5
 *                 weight: 2.5
 *                 sellingPrice: 150000
 *                 quantityInStock: 100
 *                 category:
 *                   id: 2
 *                   name: "Cotton"
 *                 color:
 *                   id: 3
 *                   name: "Đỏ"
 *                 supplier:
 *                   id: 5
 *                   name: "Nhà cung cấp A"
 *                 createdAt: "2025-10-01T10:00:00.000Z"
 *                 updatedAt: "2025-10-05T12:00:00.000Z"
 *       400:
 *         description: Lỗi validation - ID không hợp lệ
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Vải không tìm thấy
 *         $ref: '#/components/responses/NotFoundError'
 */

router.get(
  '/:id',
  authenticateToken,
  requirePermission(PERMISSIONS.FABRICS.VIEW_DETAIL),
  validate(fabricIdParamSchema, 'params'),
  getFabricById
);



//Lấy thông tin tồn kho vải theo kho
/**
 * @swagger
 * /fabrics/{id}/inventory-by-warehouses:
 *   get:
 *     summary: Lấy thông tin tồn kho vải theo từng kho (cho staff store)
 *     description: API này giúp staff store tra cứu số lượng vải còn lại ở các kho khác nhau
 *     tags: [Fabrics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *         description: ID của vải cần tra cứu
 *         example: 1
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     fabricId:
 *                       type: integer
 *                     totalQuantity:
 *                       type: number
 *                     inventoryByWarehouse:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           warehouseId:
 *                             type: integer
 *                           warehouseName:
 *                             type: string
 *                           quantity:
 *                             type: number
 */
router.get('/:id/inventory-by-warehouses',
  authenticateToken,
  requirePermission(PERMISSIONS.FABRICS.VIEW_QUANTITY),
  validate(fabricIdParamSchema, 'params'),
  getFabricInventoryByWarehouse
);



export default router;
