import express from 'express';
import {
  getAllFabricCategories,
  getFabricCategoryById,
  createFabricCategory,
  updateFabricCategory,
  deleteFabricCategory,
  uploadCategoryImage
} from '../../controllers/fabricCategory.controller.js';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
import { requirePermission } from '../../middlewares/permission.middleware.js';
import { PERMISSIONS } from '../../constants/permissions.js';
import { validate } from '../../middlewares/validation.middleware.js';
import {
  createFabricCategorySchema,
  updateFabricCategorySchema,
  fabricCategoryIdParamSchema,
  fabricCategoryQuerySchema
} from '../../validations/fabricCategory.validation.js';
import { uploadCategoryImage as multerUploadCategoryImage, handleCategoryImageUploadError } from '../../middlewares/upload.middleware.js';

const router = express.Router();


/**
 * @swagger
 * /fabric-category:
 *   get:
 *     summary: Get all fabric categories with pagination and search
 *     tags: [FabricCategory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search keyword
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Field(s) to sort by
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Fabric categories retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get(
  '/',
  validate(fabricCategoryQuerySchema, 'query'),
  getAllFabricCategories
);

/**
 * @swagger
 * /fabric-category/{id}:
 *   get:
 *     summary: Get fabric category by ID
 *     tags: [FabricCategory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: FabricCategory ID
 *     responses:
 *       200:
 *         description: Fabric category retrieved successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get(
  '/:id',
  authenticateToken,
  requirePermission(PERMISSIONS.FABRICS.MANAGE_CATEGORIES),
  validate(fabricCategoryIdParamSchema, 'params'),
  getFabricCategoryById
);

/**
 * @swagger
 * /fabric-category:
 *   post:
 *     summary: Create a new fabric category
 *     tags: [FabricCategory]
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
 *                 example: Shirt Fabric
 *               description:
 *                 type: string
 *                 example: Suitable for shirts
 *               sellingPricePerMeter:
 *                 type: number
 *                 format: float
 *                 example: 50.0
 *               sellingPricePerRoll:
 *                 type: number
 *                 format: float
 *                 example: 3000.0
 *     responses:
 *       201:
 *         description: Fabric category created successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         $ref: '#/components/responses/ConflictError'
 */
router.post(
  '/',
  authenticateToken,
  requirePermission(PERMISSIONS.FABRICS.MANAGE_CATEGORIES),
  validate(createFabricCategorySchema, 'body'),
  createFabricCategory
);

/**
 * @swagger
 * /fabric-category/{id}:
 *   put:
 *     summary: Update a fabric category
 *     tags: [FabricCategory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: FabricCategory ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Shirt Fabric
 *               description:
 *                 type: string
 *                 example: Suitable for shirts
 *               sellingPricePerMeter:
 *                 type: number
 *                 format: float
 *                 example: 45.5
 *               sellingPricePerRoll:
 *                 type: number
 *                 format: float
 *                 example: 2700.0
 *     responses:
 *       200:
 *         description: Fabric category updated successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       409:
 *         $ref: '#/components/responses/ConflictError'
 */
router.put(
  '/:id',
  authenticateToken,
  requirePermission(PERMISSIONS.FABRICS.MANAGE_CATEGORIES),
  validate(fabricCategoryIdParamSchema, 'params'),
  validate(updateFabricCategorySchema, 'body'),
  updateFabricCategory
);

/**
 * @swagger
 * /fabric-category/{id}:
 *   delete:
 *     summary: Xóa loại vải
 *     tags: [FabricCategory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: FabricCategory ID
 *     responses:
 *       200:
 *         description: Xóa loại vải thành công
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
 *                   example: "Xóa loại vải thành công"
 *                 data:
 *                   type: object
 *       400:
 *         description: Bad Request - Loại vải đang được sử dụng hoặc có ràng buộc dữ liệu
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete(
  '/:id',
  authenticateToken,
  requirePermission(PERMISSIONS.FABRICS.MANAGE_CATEGORIES),
  validate(fabricCategoryIdParamSchema, 'params'),
  deleteFabricCategory
);

/**
 * @swagger
 * /fabric-category/{id}/image:
 *   put:
 *     summary: Upload or update fabric category image
 *     tags: [FabricCategory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: FabricCategory ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Category image file (max 10MB, JPEG/PNG/GIF/WEBP)
 *     responses:
 *       200:
 *         description: Category image updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - message
 *                 - data
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Cập nhật ảnh loại vải thành công
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     name:
 *                       type: string
 *                       example: Shirt Fabric
 *                     image:
 *                       type: string
 *                       description: Image URL from Cloudinary
 *                     imagePublicId:
 *                       type: string
 *                       description: Cloudinary public ID for image
 *       400:
 *         description: Validation error or file error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *             examples:
 *               noFile:
 *                 summary: No file uploaded
 *                 value:
 *                   message: Dữ liệu không hợp lệ
 *                   errors:
 *                     - field: image
 *                       message: Ảnh loại vải là bắt buộc
 *               invalidFileType:
 *                 summary: Invalid file type
 *                 value:
 *                   message: Dữ liệu không hợp lệ
 *                   errors:
 *                     - field: image
 *                       message: Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WEBP)
 *               fileTooLarge:
 *                 summary: File size exceeds limit
 *                 value:
 *                   message: Dữ liệu không hợp lệ
 *                   errors:
 *                     - field: image
 *                       message: Kích thước file không được vượt quá 10MB
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put(
  '/:id/image',
  authenticateToken,
  requirePermission(PERMISSIONS.FABRICS.MANAGE_CATEGORIES),
  validate(fabricCategoryIdParamSchema, 'params'),
  multerUploadCategoryImage,
  handleCategoryImageUploadError,
  uploadCategoryImage
);

export default router;
