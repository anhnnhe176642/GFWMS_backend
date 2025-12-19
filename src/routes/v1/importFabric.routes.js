import express from 'express';
import { authenticateToken, requirePermission, requireWarehouseAccessFromBody, requireWarehouseAccess } from '../../middlewares/permission.middleware.js';
import { createImportFabric, getAllImportFabrics, getImportFabricById, getFabricSellingPrice, updateImportFabricStatus  } from '../../controllers/importFabric.controller.js';
import { validate, parseJSONFields } from '../../middlewares/validation.middleware.js';
import { createImportFabricSchema, importFabricQuerySchema, importFabricIdSchema, getFabricSellingPriceSchema, updateImportFabricStatusSchema } from '../../validations/importFabric.validation.js';
import { uploadSignatureImage, handleSignatureImageUploadError } from '../../middlewares/upload.middleware.js';
import { PERMISSIONS } from '../../constants/permissions.js';

const router = express.Router();

/**
 * @swagger
 * /import-fabrics:
 *   post:
 *     summary: Tạo phiếu nhập kho (tự động tìm hoặc tạo fabric)
 *     
 *     tags: [Import Fabrics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - warehouseId
 *               - items
 *             properties:
 *               warehouseId:
 *                 type: string
 *                 description: ID của kho
 *                 example: "5"
 *               items:
 *                 type: string
 *                 description: JSON array của các vải cần nhập (tối thiểu 1 item)
 *                 example: '[{"thickness": "1.5", "glossId": "1", "length": "100", "width": "150", "weight": "200", "categoryId": "2", "colorId": "3", "supplierId": "5", "quantity": "100", "price": "50000"}]'
 *               signatureImage:
 *                 type: string
 *                 format: binary
 *                 description: Ảnh hoá đơn (chữ ký) - optional, max 10MB (JPEG, PNG, GIF, WEBP)
 *     responses:
 *       201:
 *         description: Tạo phiếu nhập kho thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Nhập vải thành công"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     warehouseId:
 *                       type: integer
 *                       example: 5
 *                     importer:
 *                       type: string
 *                       example: "miquann-working"
 *                     importDate:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-10-27T15:52:04.000Z"
 *                       description: Ngày nhập (tự động lấy ngày giờ hiện tại)
 *                     totalPrice:
 *                       type: number
 *                       example: 9000000
 *                     signatureImageUrl:
 *                       type: string
 *                       nullable: true
 *                       example: "https://res.cloudinary.com/..."
 *                       description: URL ảnh hoá đơn (chữ ký)
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền
 *       404:
 *         description: Không tìm thấy dữ liệu
 */
router.post('/',
  authenticateToken,
  requirePermission(PERMISSIONS.IMPORT_FABRICS.CREATE),
  uploadSignatureImage,
  handleSignatureImageUploadError,
  parseJSONFields(['items']),
  validate(createImportFabricSchema),
  requireWarehouseAccessFromBody,
  createImportFabric
);


/**
 * @swagger
 * /import-fabrics:
 *   get:
 *     summary: Lấy danh sách phiếu nhập kho
 *     tags: [Import Fabrics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: string
 *         description: Số trang
 *         example: "1"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: string
 *         description: Số bản ghi mỗi trang
 *         example: "10"
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Sắp xếp theo (id, importDate, totalPrice, createdAt)
 *         example: "importDate"
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *         description: Thứ tự sắp xếp (asc/desc)
 *         example: "desc"
 *       - in: query
 *         name: warehouseId
 *         schema:
 *           type: string
 *         description: Lọc theo kho
 *         example: "5"
 *       - in: query
 *         name: importer
 *         schema:
 *           type: string
 *         description: Lọc theo người nhập (UUID)
 *         example: "72f8990d-125c-4805-b03c-8cbe3142be06"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Lọc theo trạng thái
 *         example: "PENDING"
 *       - in: query
 *         name: importDateFrom
 *         schema:
 *           type: string
 *         description: Ngày nhập từ (ISO 8601)
 *         example: "2025-01-01T00:00:00Z"
 *       - in: query
 *         name: importDateTo
 *         schema:
 *           type: string
 *         description: Ngày nhập đến (ISO 8601)
 *         example: "2025-12-31T23:59:59Z"
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Lấy danh sách phiếu nhập thành công"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 18
 *                       importDate:
 *                         type: string
 *                         example: "2025-10-28T08:07:59.567Z"
 *                       status:
 *                         type: string
 *                         enum: [PENDING, COMPLETED, CANCELLED]
 *                         example: "PENDING"
 *                       totalPrice:
 *                         type: number
 *                         example: 9000000
 *                       warehouse:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 5
 *                           name:
 *                             type: string
 *                             example: "Kho Bắc Ninh"
 *                       importUser:
 *                         type: object
 *                         properties:
 *                           fullname:
 *                             type: string
 *                             example: "System Administrator"
 *                       signatureImageUrl:
 *                         type: string
 *                         nullable: true
 *                         example: "https://res.cloudinary.com/..."
 *                         description: URL ảnh hoá đơn (chữ ký)
 *                       createdAt:
 *                         type: string
 *                         example: "2025-10-28T08:07:59.567Z"
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     total:
 *                       type: integer
 *                       example: 50
 *                     totalPages:
 *                       type: integer
 *                       example: 5
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền
 */
router.get('/', 
  authenticateToken,
  requirePermission(PERMISSIONS.IMPORT_FABRICS.VIEW_LIST),
  validate(importFabricQuerySchema, 'query'),
  getAllImportFabrics
);

/**
 * @swagger
 * /import-fabrics/fabric-selling-price:
 *   get:
 *     summary: Lấy giá bán của vải theo thuộc tính
 *     tags: [Import Fabrics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: thickness
 *         schema:
 *         example: 1.5
 *       - in: query
 *         name: glossId
 *         schema:
 *         example: 1
 *       - in: query
 *         name: length
 *         
 *         schema:
 *         example: 100
 *       - in: query
 *         name: width
 *         
 *         schema:
 *         example: 150
 *       - in: query
 *         name: weight
 *        
 *         schema:
 *         example: 200
 *       - in: query
 *         name: categoryId
 *         
 *         schema:
 *         example: 1
 *       - in: query
 *         name: colorId
 *       
 *         schema:
 *         example: "RED001"
 *       - in: query
 *         name: supplierId
 *        
 *         schema:
 *         example: 1
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     sellingPrice:
 *                       type: number
 *                       nullable: true
 *                       example: 150000
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền
 */
router.get('/fabric-selling-price',
  authenticateToken,
  requirePermission(PERMISSIONS.IMPORT_FABRICS.SET_SELLING_PRICE),
  validate(getFabricSellingPriceSchema, 'query'),
  getFabricSellingPrice
);

/**
 * @swagger
 * /import-fabrics/{id}:
 *   get:
 *     summary: Lấy chi tiết phiếu nhập kho
 *     tags: [Import Fabrics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         description: ID phiếu nhập
 *         example: "18"
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
 *                   example: "Lấy chi tiết phiếu nhập thành công"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 18
 *                     warehouseId:
 *                       type: integer
 *                       example: 5
 *                     importer:
 *                       type: string
 *                       example: "user-id-uuid"
 *                     importDate:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-10-28T08:07:59.567Z"
 *                     totalPrice:
 *                       type: number
 *                       example: 9000000
 *                     status:
 *                       type: string
 *                       enum: [PENDING, COMPLETED, CANCELLED]
 *                       example: "PENDING"
 *                     signatureImageUrl:
 *                       type: string
 *                       nullable: true
 *                       example: "https://res.cloudinary.com/..."
 *                       description: URL ảnh hoá đơn (chữ ký)
 *                     signatureImagePublicId:
 *                       type: string
 *                       nullable: true
 *                       example: "import-fabrics/signatures/abc123"
 *                       description: Cloudinary public ID
 *                     warehouse:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 5
 *                         name:
 *                           type: string
 *                           example: "Kho Bắc Ninh"
 *                         address:
 *                           type: string
 *                           example: "Bắc Ninh"
 *                     importUser:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "user-uuid"
 *                         fullname:
 *                           type: string
 *                           example: "System Administrator"
 *                         email:
 *                           type: string
 *                           example: "admin@example.com"
 *                         phone:
 *                           type: string
 *                           example: "+84123456789"
 *                     importItems:
 *                       type: array
 *                       items:
 *                         type: object
 *       404:
 *         description: Không tìm thấy phiếu nhập
 */
router.get('/:id', 
  authenticateToken,
  requirePermission(PERMISSIONS.IMPORT_FABRICS.VIEW_DETAIL),
  validate(importFabricIdSchema, 'params'),
  requireWarehouseAccess(async (req) => {
    const { id } = req.params;
    const { importFabricRepository } = await import('../../repositories/importFabric.repository.js');
    const importFabric = await importFabricRepository.findById(parseInt(id));
    return importFabric?.warehouseId;
  }),
  getImportFabricById
);

/**
 * @swagger
 * /import-fabrics/{id}/status:
 *   put:
 *     summary: Cập nhật trạng thái phiếu nhập kho
 *     tags: [Import Fabrics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID phiếu nhập
 *         example: "18"
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
 *                 enum: [PENDING, COMPLETED, CANCELLED]
 *                 description: Trạng thái phiếu nhập (PENDING, COMPLETED, CANCELLED)
 *                 example: "COMPLETED"
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Cập nhật trạng thái phiếu nhập thành công"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 18
 *                     status:
 *                       type: string
 *                       enum: [PENDING, COMPLETED, CANCELLED]
 *                       example: "COMPLETED"
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền
 *       404:
 *         description: Không tìm thấy phiếu nhập
 */
router.put('/:id/status',
  authenticateToken,
  requirePermission(PERMISSIONS.FABRICS.ALLOCATE_TO_SHELF),
  validate(importFabricIdSchema, 'params'),
  validate(updateImportFabricStatusSchema, 'body'),
  requireWarehouseAccess(async (req) => {
    // Lấy warehouseId từ import fabric record
    const { id } = req.params;
    const importFabric = await (await import('../../repositories/importFabric.repository.js')).importFabricRepository.findById(parseInt(id));
    return importFabric?.warehouseId;
  }),
  updateImportFabricStatus
);




export default router;