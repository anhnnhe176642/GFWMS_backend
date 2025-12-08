import express from 'express';
import {
  getAllBanners,
  getBannerById,
  createBanner,
  updateBanner,
  deleteBanner
} from '../../controllers/banner.controller.js';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
import { requirePermission } from '../../middlewares/permission.middleware.js';
import { PERMISSIONS } from '../../constants/permissions.js';
import { validate } from '../../middlewares/validation.middleware.js';
import {
  createBannerSchema,
  updateBannerSchema,
  bannerIdParamSchema,
  bannerQuerySchema
} from '../../validations/banner.validation.js';

const router = express.Router();

/**
 * @swagger
 * /banner:
 *   get:
 *     summary: Get all banners with pagination, search, sort, and filters
 *     tags: [Banner]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by banner title
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Field to sort by (title, startDate, endDate, isActive, createdAt, updatedAt)
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *         description: Sort order (asc or desc)
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: string
 *         description: Filter by active status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter banners with startDate >= this value
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter banners with endDate <= this value
 *     responses:
 *       200:
 *         description: Banners retrieved successfully
 */
router.get(
  '/',
  validate(bannerQuerySchema, 'query'),
  getAllBanners
);


/**
 * @swagger
 * /banner/{id}:
 *   get:
 *     summary: Get banner by ID
 *     tags: [Banner]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Banner ID
 *     responses:
 *       200:
 *         description: Banner retrieved successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get(
  '/:id',
  authenticateToken,
  requirePermission(PERMISSIONS.BANNER.VIEW_DETAIL),
  validate(bannerIdParamSchema, 'params'),
  getBannerById
);

/**
 * @swagger
 * /banner:
 *   post:
 *     summary: Create a new banner
 *     tags: [Banner]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Banner Giảm Giá Tháng 11"
 *               description:
 *                 type: string
 *                 example: "Banner quảng cáo giảm giá vải mùa lễ hội"
 *               imageUrl:
 *                 type: string
 *                 example: "https://example.com/images/banner-nov.jpg"
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-11-14"
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-11-30"
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Banner created successfully
 */
router.post(
  '/',
  authenticateToken,
  requirePermission(PERMISSIONS.BANNER.CREATE),
  validate(createBannerSchema, 'body'),
  createBanner
);

/**
 * @swagger
 * /banner/{id}:
 *   put:
 *     summary: Update a banner
 *     tags: [Banner]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Banner ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Banner Mới"
 *               description:
 *                 type: string
 *                 example: "Mô tả banner mới"
 *               imageUrl:
 *                 type: string
 *                 example: "https://example.com/images/banner-new.jpg"
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-11-20"
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-12-05"
 *               isActive:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Banner updated successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put(
  '/:id',
  authenticateToken,
  requirePermission(PERMISSIONS.BANNER.UPDATE),
  validate(bannerIdParamSchema, 'params'),
  validate(updateBannerSchema, 'body'),
  updateBanner
);

/**
 * @swagger
 * /banner/{id}:
 *   delete:
 *     summary: Delete a banner
 *     tags: [Banner]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         description: ID Banner
 *         example: "1"
 *     responses:
 *       200:
 *         description: Banner deleted successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete(
  '/:id',
  authenticateToken,
  requirePermission(PERMISSIONS.BANNER.DELETE),
  validate(bannerIdParamSchema, 'params'),
  deleteBanner
);

export default router;
