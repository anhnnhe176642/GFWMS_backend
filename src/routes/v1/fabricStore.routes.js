import express from 'express';
import fabricStoreController from '../../controllers/fabricStore.controller.js';
import { authenticateToken, requirePermission } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validation.middleware.js';
import {
  importFabricSchema,
  cutFabricSchema,
  fabricStoreQuerySchema,
  storeIdSchema,
  fabricStoreParamsSchema
} from '../../validations/fabricStore.validation.js';
import { PERMISSIONS } from '../../constants/permissions.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: FabricStore
 *   description: Quản lý vải trong cửa hàng - Nhập, cắt vải và theo dõi tồn kho
 */

/**
 * @swagger
 * /fabric-store/{storeId}/fabrics:
 *   get:
 *     summary: Lấy danh sách vải trong cửa hàng (có tìm kiếm, sắp xếp, phân trang)
 *     tags: [FabricStore]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của cửa hàng
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang (bắt đầu từ 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 100
 *         description: Số lượng mục trên mỗi trang
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo tên loại vải, màu, độ bóng, hoặc nhà cung cấp
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: Lọc theo ID loại vải (hỗ trợ nhiều giá trị, cách nhau bởi dấu phẩy)
 *         example: "1,2,3"
 *       - in: query
 *         name: colorId
 *         schema:
 *           type: string
 *         description: Lọc theo ID màu vải (hỗ trợ nhiều giá trị, cách nhau bởi dấu phẩy)
 *         example: "MAU001,MAU002"
 *       - in: query
 *         name: glossId
 *         schema:
 *           type: string
 *         description: Lọc theo ID độ bóng (hỗ trợ nhiều giá trị, cách nhau bởi dấu phẩy)
 *         example: "1,2"
 *       - in: query
 *         name: supplierId
 *         schema:
 *           type: string
 *         description: Lọc theo ID nhà cung cấp (hỗ trợ nhiều giá trị, cách nhau bởi dấu phẩy)
 *         example: "1,2,3"
 *       - in: query
 *         name: createdFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Lọc từ ngày (định dạng YYYY-MM-DD)
 *         example: "2023-01-01"
 *       - in: query
 *         name: createdTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Lọc đến ngày (định dạng YYYY-MM-DD)
 *         example: "2023-12-31"
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [updatedAt, createdAt, totalValue, totalMeters, uncutRolls, cuttingRollMeters, fabric.category.name, fabric.color.name, fabric.gloss.description, fabric.supplier.name, store.name, fabric.sellingPrice, fabric.category.sellingPricePerMeter, fabric.category.sellingPricePerRoll]
 *           default: updatedAt
 *         description: Trường để sắp xếp (hỗ trợ nested fields từ related data)
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Thứ tự sắp xếp
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
 *                   example: Lấy danh sách vải trong cửa hàng thành công
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       fabricId:
 *                         type: integer
 *                       storeId:
 *                         type: integer
 *                       fabricInfo:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           category:
 *                             type: string
 *                           categoryId:
 *                             type: integer
 *                           color:
 *                             type: string
 *                           colorId:
 *                             type: string
 *                           gloss:
 *                             type: string
 *                           glossId:
 *                             type: integer
 *                           supplier:
 *                             type: string
 *                           supplierId:
 *                             type: integer
 *                           length:
 *                             type: number
 *                             description: Độ dài mỗi cuộn (mét)
 *                           width:
 *                             type: number
 *                           weight:
 *                             type: number
 *                           thickness:
 *                             type: number
 *                           sellingPrice:
 *                             type: number
 *                           sellingPricePerMeter:
 *                             type: number
 *                           sellingPricePerRoll:
 *                             type: number
 *                       storeInfo:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                           address:
 *                             type: string
 *                       inventory:
 *                         type: object
 *                         properties:
 *                           totalValue:
 *                             type: number
 *                             description: Tổng giá trị vải hiện tại
 *                           totalMeters:
 *                             type: number
 *                             description: Tổng số mét vải
 *                           uncutRolls:
 *                             type: integer
 *                             description: Số cuộn chưa cắt
 *                           cuttingRollMeters:
 *                             type: number
 *                             description: Số mét còn lại của cuộn đang cắt dở
 *                           averagePricePerMeter:
 *                             type: number
 *                             description: Giá trị trung bình mỗi mét
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     hasNext:
 *                       type: boolean
 *                     hasPrev:
 *                       type: boolean
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền truy cập
 */
router.get(
  '/:storeId/fabrics',
  authenticateToken,
  requirePermission(PERMISSIONS.FABRIC_VIEW),
  validate(storeIdSchema, 'params'),
  validate(fabricStoreQuerySchema, 'query'),
  fabricStoreController.getStoreFabrics
);

/**
 * @swagger
 * /fabric-store/{storeId}/fabrics/{fabricId}:
 *   get:
 *     summary: Lấy chi tiết thông tin vải trong cửa hàng
 *     description: Lấy thông tin chi tiết về vải (loại, màu, độ bóng, nhà cung cấp) và tồn kho trong cửa hàng
 *     tags: [FabricStore]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của cửa hàng
 *       - in: path
 *         name: fabricId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của vải
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
 *                   example: Lấy chi tiết vải trong cửa hàng thành công
 *                 data:
 *                   type: object
 *                   properties:
 *                     fabricId:
 *                       type: integer
 *                     storeId:
 *                       type: integer
 *                     fabricInfo:
 *                       type: object
 *                       description: Thông tin chi tiết về loại vải
 *                       properties:
 *                         id:
 *                           type: integer
 *                         category:
 *                           type: string
 *                           description: Tên loại vải
 *                         categoryId:
 *                           type: integer
 *                         categoryDescription:
 *                           type: string
 *                         color:
 *                           type: string
 *                           description: Tên màu vải
 *                         colorId:
 *                           type: string
 *                         gloss:
 *                           type: string
 *                           description: Mô tả độ bóng của vải
 *                         glossId:
 *                           type: integer
 *                         supplier:
 *                           type: string
 *                           description: Tên nhà cung cấp
 *                         supplierId:
 *                           type: integer
 *                         supplierPhone:
 *                           type: string
 *                         supplierAddress:
 *                           type: string
 *                         length:
 *                           type: number
 *                           description: Độ dài mỗi cuộn (mét)
 *                         width:
 *                           type: number
 *                           description: Chiều rộng (cm)
 *                         weight:
 *                           type: number
 *                           description: Trọng lượng (kg)
 *                         thickness:
 *                           type: number
 *                           description: Độ dày (mm)
 *                         sellingPrice:
 *                           type: number
 *                         sellingPricePerMeter:
 *                           type: number
 *                           description: Giá bán theo mét
 *                         sellingPricePerRoll:
 *                           type: number
 *                           description: Giá bán theo cuộn
 *                         quantityInStock:
 *                           type: integer
 *                           description: Số lượng trong kho chung
 *                     inventory:
 *                       type: object
 *                       description: Thông tin tồn kho trong cửa hàng này
 *                       properties:
 *                         totalValue:
 *                           type: number
 *                           description: Tổng giá trị vải hiện tại
 *                         totalMeters:
 *                           type: number
 *                           description: Tổng số mét vải
 *                         uncutRolls:
 *                           type: integer
 *                           description: Số cuộn chưa cắt
 *                         cuttingRollMeters:
 *                           type: number
 *                           description: Số mét còn lại của cuộn đang cắt dở
 *                         averagePricePerMeter:
 *                           type: number
 *                           description: Giá trị trung bình mỗi mét (totalValue / totalMeters)
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy vải trong cửa hàng
 */
router.get(
  '/:storeId/fabrics/:fabricId',
  authenticateToken,
  requirePermission(PERMISSIONS.FABRIC_VIEW),
  validate(fabricStoreParamsSchema, 'params'),
  fabricStoreController.getStoreFabricDetail
);

/**
 * @swagger
 * /fabric-store/{storeId}/import:
 *   post:
 *     summary: Nhập vải mới vào cửa hàng
 *     description: Nhập số lượng cuộn vải mới vào kho của cửa hàng. Hệ thống sẽ tự động tính toán tổng giá trị, tổng mét, số cuộn chưa cắt và số mét còn lại của cuộn đang cắt dở
 *     tags: [FabricStore]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của cửa hàng nhập vải
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fabricId
 *               - quantity
 *             properties:
 *               fabricId:
 *                 type: integer
 *                 description: ID của loại vải cần nhập
 *               quantity:
 *                 type: integer
 *                 description: Số lượng cuộn vải cần nhập
 *                 minimum: 1
 *             example:
 *               fabricId: 5
 *               quantity: 50
 *     responses:
 *       201:
 *         description: Nhập vải thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Nhập vải vào cửa hàng thành công
 *                 data:
 *                   type: object
 *                   properties:
 *                     fabricId:
 *                       type: integer
 *                     storeId:
 *                       type: integer
 *                     quantity:
 *                       type: integer
 *                     totalValue:
 *                       type: number
 *                     totalMeters:
 *                       type: number
 *                     uncutRolls:
 *                       type: integer
 *                     cuttingRollMeters:
 *                       type: number
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc vải không tồn tại
 *       404:
 *         description: Không tìm thấy cửa hàng hoặc vải
 */
router.post(
  '/:storeId/import',
  authenticateToken,
  requirePermission(PERMISSIONS.FABRIC_IMPORT),
  validate(storeIdSchema, 'params'),
  validate(importFabricSchema, 'body'),
  fabricStoreController.importFabric
);

/**
 * @swagger
 * /fabric-store/{storeId}/cut:
 *   post:
 *     summary: Cắt vải từ kho cửa hàng
 *     description: Cắt một số lượng mét vải nhất định từ kho của cửa hàng. Hệ thống sẽ cập nhật số cuộn chưa cắt, mét còn lại của cuộn đang cắt, tổng mét, và tổng giá trị vải
 *     tags: [FabricStore]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của cửa hàng
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fabricId
 *               - meters
 *             properties:
 *               fabricId:
 *                 type: integer
 *                 description: ID của loại vải cần cắt
 *               meters:
 *                 type: number
 *                 description: Số mét vải cần cắt
 *                 minimum: 0.1
 *             example:
 *               fabricId: 5
 *               meters: 150
 *     responses:
 *       200:
 *         description: Cắt vải thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Cắt vải thành công
 *                 data:
 *                   type: object
 *                   properties:
 *                     fabricId:
 *                       type: integer
 *                     storeId:
 *                       type: integer
 *                     quantity:
 *                       type: integer
 *                       description: Số cuộn còn lại
 *                     totalValue:
 *                       type: number
 *                       description: Tổng giá trị sau khi cắt
 *                     totalMeters:
 *                       type: number
 *                       description: Tổng mét còn lại
 *                     uncutRolls:
 *                       type: integer
 *                       description: Số cuộn chưa cắt
 *                     cuttingRollMeters:
 *                       type: number
 *                       description: Số mét còn lại của cuộn đang cắt dở
 *                     cutMeters:
 *                       type: number
 *                       description: Số mét đã cắt được trong lần này
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc không đủ vải để cắt
 *       404:
 *         description: Không tìm thấy vải trong cửa hàng
 */
router.post(
  '/:storeId/cut',
  authenticateToken,
  requirePermission(PERMISSIONS.FABRIC_UPDATE),
  validate(storeIdSchema, 'params'),
  validate(cutFabricSchema, 'body'),
  fabricStoreController.cutFabric
);

export default router;
