import express from 'express';
import {
  getAllBannerDiscounts,
  getBannerDiscountById,
  createBannerDiscount,
  updateBannerDiscount,
  deleteBannerDiscount
} from '../../controllers/bannerDiscount.controller.js';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
import { requirePermission } from '../../middlewares/permission.middleware.js';
import { PERMISSIONS } from '../../constants/permissions.js';
import { validate } from '../../middlewares/validation.middleware.js';
import {
  createBannerDiscountSchema,
  updateBannerDiscountSchema,
  bannerDiscountIdParamSchema,
  bannerDiscountQuerySchema
} from '../../validations/bannerDiscount.validation.js';

const router = express.Router();

/**
 * @swagger
 * /banner-discount:
 *   get:
 *     summary: Get all banner discounts with optional filters
 *     tags: [BannerDiscount]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: bannerId
 *         schema:
 *           type: string
 *         description: Filter by Banner ID (comma-separated for multiple, e.g., 1,2,3)
 *       - in: query
 *         name: fabricId
 *         schema:
 *           type: string
 *         description: Filter by Fabric ID (comma-separated for multiple, e.g., 10,20)
 *       - in: query
 *         name: discountType
 *         schema:
 *           type: string
 *         description: Filter by discount type
 *       - in: query
 *         name: page
 *         schema:
 *           type: string
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: string
 *         description: Items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Field to sort by (id, code, discountValue, banner.title, createdAt, updatedAt)
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Banner discounts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Banner discounts retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BannerDiscount'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get(
  '/',
  validate(bannerDiscountQuerySchema, 'query'),
  getAllBannerDiscounts
);


/**
 * @swagger
 * /banner-discount/{id}:
 *   get:
 *     summary: Get banner discount by ID
 *     tags: [BannerDiscount]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: BannerDiscount ID
 *     responses:
 *       200:
 *         description: Banner discount retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BannerDiscount'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get(
  '/:id',
  authenticateToken,
  requirePermission(PERMISSIONS.BANNER_DISCOUNT.VIEW_DETAIL),
  validate(bannerDiscountIdParamSchema, 'params'),
  getBannerDiscountById
);

/**
 * @swagger
 * /banner-discount:
 *   post:
 *     summary: Create a new banner discount
 *     tags: [BannerDiscount]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - bannerId
 *               - fabricId
 *               - discountType
 *               - discountValue
 *             properties:
 *               code:
 *                 type: string
 *                 maxLength: 50
 *               bannerId:
 *                 type: integer
 *               fabricId:
 *                 type: integer
 *               discountType:
 *                 type: string
 *                 enum: [PERCENTAGE, FIXED]
 *               discountValue:
 *                 type: number
 *                 format: float
 *               minQuantity:
 *                 type: integer
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Banner discount created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BannerDiscount'
 */
router.post(
  '/',
  authenticateToken,
  requirePermission(PERMISSIONS.BANNER_DISCOUNT.CREATE),
  validate(createBannerDiscountSchema, 'body'),
  createBannerDiscount
);

/**
 * @swagger
 * /banner-discount/{id}:
 *   put:
 *     summary: Update a banner discount
 *     tags: [BannerDiscount]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: BannerDiscount ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 maxLength: 50
 *               bannerId:
 *                 type: integer
 *               fabricId:
 *                 type: integer
 *               discountType:
 *                 type: string
 *                 enum: [PERCENTAGE, FIXED]
 *               discountValue:
 *                 type: number
 *                 format: float
 *               minQuantity:
 *                 type: integer
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Banner discount updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BannerDiscount'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put(
  '/:id',
  authenticateToken,
  requirePermission(PERMISSIONS.BANNER_DISCOUNT.UPDATE),
  validate(bannerDiscountIdParamSchema, 'params'),
  validate(updateBannerDiscountSchema, 'body'),
  updateBannerDiscount
);

/**
 * @swagger
 * /banner-discount/{id}:
 *   delete:
 *     summary: Delete a banner discount
 *     tags: [BannerDiscount]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: BannerDiscount ID
 *     responses:
 *       200:
 *         description: Banner discount deleted successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete(
  '/:id',
  authenticateToken,
  requirePermission(PERMISSIONS.BANNER_DISCOUNT.DELETE),
  validate(bannerDiscountIdParamSchema, 'params'),
  deleteBannerDiscount
);

export default router;
