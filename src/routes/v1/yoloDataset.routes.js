import express from 'express';
import * as yoloDatasetController from '../../controllers/yoloDataset.controller.js';
import { createUploadMiddleware, createUploadErrorHandler } from '../../middlewares/upload.middleware.js';
import { validate } from '../../middlewares/validation.middleware.js';
import { parseMultipartJson } from '../../middlewares/parseMultipartJson.middleware.js';
import {
  createDatasetSchema,
  updateDatasetSchema,
  addLabeledImageSchema,
  updateImageSchema,
  getDatasetsSchema,
  getDatasetImagesSchema,
  datasetIdParamSchema,
  imageIdParamSchema
} from '../../validations/yoloDataset.validation.js';
import { authenticateToken, requirePermission } from '../../middlewares/auth.middleware.js';
import { PERMISSIONS } from '../../constants/permissions.js';

const router = express.Router();

// Upload middleware for images
const uploadDatasetImage = createUploadMiddleware({
  fieldName: 'image',
  maxSize: 10,
  multiple: false
});

const handleImageUploadError = createUploadErrorHandler('image', 10);

/**
 * @swagger
 * tags:
 *   name: YOLO Dataset
 *   description: YOLO dataset management for training data
 */

/**
 * @swagger
 * /yolo/datasets:
 *   post:
 *     summary: Create a new dataset
 *     tags: [YOLO Dataset]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Dataset name (alphanumeric, hyphens, underscores only)
 *                 example: fabric_defects_v1
 *               description:
 *                 type: string
 *                 description: Dataset description
 *               version:
 *                 type: string
 *                 example: "1.0"
 *               classes:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of class names
 *                 example: ["defect", "stain", "tear"]
 *     responses:
 *       201:
 *         description: Dataset created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/',
  authenticateToken,
  requirePermission(PERMISSIONS.YOLO.MANAGE_DATASET),
  validate(createDatasetSchema, 'body'),
  yoloDatasetController.createDataset
);

/**
 * @swagger
 * /yolo/datasets:
 *   get:
 *     summary: Get all datasets with pagination
 *     tags: [YOLO Dataset]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, ARCHIVED, PROCESSING]
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, createdAt, totalImages, status]
 *           default: createdAt
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: List of datasets
 */
router.get(
  '/',
  authenticateToken,
  requirePermission(PERMISSIONS.YOLO.VIEW_DATASET),
  validate(getDatasetsSchema, 'query'),
  yoloDatasetController.getAllDatasets
);

/**
 * @swagger
 * /yolo/datasets/{datasetId}:
 *   get:
 *     summary: Get dataset by ID
 *     tags: [YOLO Dataset]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: datasetId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dataset details
 *       404:
 *         description: Dataset not found
 */
router.get(
  '/:datasetId',
  authenticateToken,
  requirePermission(PERMISSIONS.YOLO.VIEW_DATASET),
  validate(datasetIdParamSchema, 'params'),
  yoloDatasetController.getDatasetById
);

/**
 * @swagger
 * /yolo/datasets/{datasetId}:
 *   patch:
 *     summary: Update dataset
 *     tags: [YOLO Dataset]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: datasetId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               version:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, ARCHIVED, PROCESSING]
 *     responses:
 *       200:
 *         description: Dataset updated
 *       404:
 *         description: Dataset not found
 */
router.patch(
  '/:datasetId',
  authenticateToken,
  requirePermission(PERMISSIONS.YOLO.MANAGE_DATASET),
  validate([
    { schema: datasetIdParamSchema, source: 'params' },
    { schema: updateDatasetSchema, source: 'body' }
  ]),
  yoloDatasetController.updateDataset
);

/**
 * @swagger
 * /yolo/datasets/{datasetId}:
 *   delete:
 *     summary: Delete dataset
 *     tags: [YOLO Dataset]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: datasetId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dataset deleted
 *       404:
 *         description: Dataset not found
 */
router.delete(
  '/:datasetId',
  authenticateToken,
  requirePermission(PERMISSIONS.YOLO.MANAGE_DATASET),
  validate(datasetIdParamSchema, 'params'),
  yoloDatasetController.deleteDataset
);

/**
 * @swagger
 * /yolo/datasets/{datasetId}/images:
 *   post:
 *     summary: Add labeled image to dataset
 *     tags: [YOLO Dataset]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: datasetId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *               - detections
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file (dimensions extracted automatically)
 *               detections:
 *                 type: string
 *                 description: JSON string of detection results (from YOLO detect endpoint)
 *                 example: '[{"class_id":0,"class_name":"defect","confidence":0.95,"bbox":{"x1":100,"y1":100,"x2":200,"y2":200}}]'
 *               notes:
 *                 type: string
 *                 description: Optional notes about this image
 *     responses:
 *       201:
 *         description: Image added to dataset
 *       400:
 *         description: Validation error
 */
router.post(
  '/:datasetId/images',
  authenticateToken,
  requirePermission(PERMISSIONS.YOLO.MANAGE_DATASET),
  validate(datasetIdParamSchema, 'params'),
  uploadDatasetImage,
  handleImageUploadError,
  parseMultipartJson(['detections']),
  validate(addLabeledImageSchema, 'fields'),
  yoloDatasetController.addLabeledImage
);

/**
 * @swagger
 * /yolo/datasets/{datasetId}/images:
 *   get:
 *     summary: Get images in dataset
 *     tags: [YOLO Dataset]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: datasetId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [filename, createdAt, objectCount]
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: List of images
 */
router.get(
  '/:datasetId/images',
  authenticateToken,
  requirePermission(PERMISSIONS.YOLO.VIEW_DATASET),
  validate([
    { schema: datasetIdParamSchema, source: 'params' },
    { schema: getDatasetImagesSchema, source: 'query' }
  ]),
  yoloDatasetController.getDatasetImages
);

/**
 * @swagger
 * /yolo/datasets/{datasetId}/export:
 *   get:
 *     summary: Export dataset as ZIP file (YOLO format)
 *     tags: [YOLO Dataset]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: datasetId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: ZIP file download
 *         content:
 *           application/zip:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get(
  '/:datasetId/export',
  authenticateToken,
  requirePermission(PERMISSIONS.YOLO.EXPORT_DATASET),
  validate(datasetIdParamSchema, 'params'),
  yoloDatasetController.exportDataset
);

/**
 * @swagger
 * /yolo/datasets/{datasetId}/stats:
 *   get:
 *     summary: Get dataset statistics
 *     tags: [YOLO Dataset]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: datasetId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dataset statistics
 */
router.get(
  '/:datasetId/stats',
  authenticateToken,
  requirePermission(PERMISSIONS.YOLO.VIEW_DATASET),
  validate(datasetIdParamSchema, 'params'),
  yoloDatasetController.getDatasetStats
);

/**
 * @swagger
 * /yolo/datasets/images/{imageId}:
 *   get:
 *     summary: Get image by ID
 *     tags: [YOLO Dataset]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Image details
 */
router.get(
  '/images/:imageId',
  authenticateToken,
  requirePermission(PERMISSIONS.YOLO.VIEW_DATASET),
  validate(imageIdParamSchema, 'params'),
  yoloDatasetController.getImageById
);

/**
 * @swagger
 * /yolo/datasets/images/{imageId}:
 *   patch:
 *     summary: Update image annotations or notes
 *     tags: [YOLO Dataset]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *               annotations:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     class_id:
 *                       type: integer
 *                     x_center:
 *                       type: number
 *                     y_center:
 *                       type: number
 *                     width:
 *                       type: number
 *                     height:
 *                       type: number
 *     responses:
 *       200:
 *         description: Image updated
 */
router.patch(
  '/images/:imageId',
  authenticateToken,
  requirePermission(PERMISSIONS.YOLO.MANAGE_DATASET),
  validate([
    { schema: imageIdParamSchema, source: 'params' },
    { schema: updateImageSchema, source: 'body' }
  ]),
  yoloDatasetController.updateImage
);

/**
 * @swagger
 * /yolo/datasets/images/{imageId}:
 *   delete:
 *     summary: Delete image from dataset
 *     tags: [YOLO Dataset]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Image deleted
 */
router.delete(
  '/images/:imageId',
  authenticateToken,
  requirePermission(PERMISSIONS.YOLO.MANAGE_DATASET),
  validate(imageIdParamSchema, 'params'),
  yoloDatasetController.deleteImage
);

export default router;
