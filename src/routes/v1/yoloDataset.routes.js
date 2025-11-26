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
  imageIdParamSchema,
  importDatasetFromZipSchema,
  exportTokenSchema,
  exportDatasetSchema
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

// Upload middleware for ZIP files (1000MB max)
const uploadDatasetZip = createUploadMiddleware({
  fieldName: 'zipFile',
  maxSize: 1000,
  multiple: false,
  fileType: 'zip'
});

const handleZipUploadError = createUploadErrorHandler('zipFile', 1000);

/**
 * @swagger
 * tags:
 *   name: YOLO Dataset
 *   description: YOLO dataset management for training data
 */

/**
 * @swagger
 * /yolo/datasets/import-zip:
 *   post:
 *     summary: Import dataset from ZIP file (creates new dataset)
 *     description: |
 *       Import a complete dataset from a ZIP file and create a new dataset in the system.
 *       ZIP file structure expected:
 *       - images/ - folder containing image files
 *       - labels/ - folder containing .txt label files (optional)
 *       - classes.txt - class names, one per line (optional)
 *       
 *       Process:
 *       1. Create new dataset with provided name
 *       2. Extract and read classes.txt from ZIP
 *       3. Import all images with corresponding labels
 *       4. Mark all imported images as COMPLETED
 *       5. Return dataset info and import statistics
 *     tags: [YOLO Dataset]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - zipFile
 *               - name
 *             properties:
 *               zipFile:
 *                 type: string
 *                 format: binary
 *                 description: ZIP file containing YOLO format dataset (max 500MB)
 *               name:
 *                 type: string
 *                 description: Name for the new dataset (alphanumeric, hyphens, underscores only)
 *                 example: fabric_defects_v1
 *               description:
 *                 type: string
 *                 description: Optional description for the dataset
 *     responses:
 *       201:
 *         description: Dataset created and imported successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "Dataset \"fabric_defects_v1\" created and imported 150 images"
 *                 data:
 *                   type: object
 *                   properties:
 *                     dataset:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         description:
 *                           type: string
 *                         classes:
 *                           type: array
 *                           items:
 *                             type: string
 *                         totalImages:
 *                           type: integer
 *                     importedCount:
 *                       type: integer
 *                       description: Number of successfully imported images
 *                     failedCount:
 *                       type: integer
 *                       description: Number of failed imports
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: List of error messages for failed imports
 *       400:
 *         description: No ZIP file provided, validation error, or dataset name already exists
 */
router.post(
  '/import-zip',
  authenticateToken,
  requirePermission(PERMISSIONS.YOLO.MANAGE_DATASET),
  uploadDatasetZip,
  handleZipUploadError,
  validate(importDatasetFromZipSchema, 'body'),
  yoloDatasetController.importDatasetFromZip
);

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
 *     summary: Get all datasets with pagination, filtering, and sorting
 *     tags: [YOLO Dataset]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number (starts from 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by dataset name or description
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status (support multiple values separated by comma). Example ACTIVE,ARCHIVED
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: Sort by field (name, createdAt, description, totalImages, totalLabels, status)
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           default: desc
 *         description: Sort order (asc or desc)
 *       - in: query
 *         name: createdFrom
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter datasets created from this date (ISO 8601 format, inclusive)
 *       - in: query
 *         name: createdTo
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter datasets created until this date (ISO 8601 format, inclusive)
 *     responses:
 *       200:
 *         description: Successfully retrieved list of datasets
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       status:
 *                         type: string
 *                       totalImages:
 *                         type: integer
 *                       totalLabels:
 *                         type: integer
 *                       classes:
 *                         type: array
 *                         items:
 *                           type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
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
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
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
 *     description: |
 *       Update dataset metadata and classes:
 *       - **name, description, status**: Can be freely updated
 *       - **classes**: Can only ADD new classes. Cannot remove or modify existing classes
 *         - If trying to remove a class, will return validation error
 *         - New classes will be merged with existing ones (duplicates removed)
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
 *                 description: Dataset name
 *               description:
 *                 type: string
 *                 description: Dataset description
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, ARCHIVED]
 *                 description: Dataset status
 *               classes:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Classes array - only new classes can be added, existing ones cannot be modified or removed
 *                 example: ["defect", "stain", "tear"]
 *     responses:
 *       200:
 *         description: Dataset updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     classes:
 *                       type: array
 *                       items:
 *                         type: string
 *                     status:
 *                       type: string
 *                     totalImages:
 *                       type: integer
 *                     totalLabels:
 *                       type: integer
 *       400:
 *         description: Validation error (e.g., trying to remove existing classes)
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
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file (dimensions extracted automatically)
 *               detections:
 *                 type: string
 *                 description: Optional JSON string of detection results (from YOLO detect endpoint)
 *                 example: '[{"class_id":0,"class_name":"defect","confidence":0.95,"bbox":{"x1":100,"y1":100,"x2":200,"y2":200}}]'
 *               notes:
 *                 type: string
 *                 description: Optional notes about this image
 *     responses:
 *       201:
 *         description: Image added to dataset with PENDING status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     datasetId:
 *                       type: string
 *                     filename:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [PENDING, PROCESSING, COMPLETED, FAILED]
 *                       description: Image processing status (default PENDING)
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error
 */
router.post(
  '/:datasetId/images',
  authenticateToken,
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
 *     summary: Get images in dataset with pagination, filtering, and sorting
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
 *         description: Page number (starts from 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by filename or notes
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by image status (support multiple values separated by comma). Example PENDING,COMPLETED
 *         example: "PENDING,PROCESSING"
 *       - in: query
 *         name: sortBy
 *         description: Sort by field (support multiple fields separated by comma). Support nested sort by uploadedByUser.fullname
 *         schema:
 *           type: string
 *           enum: [filename, createdAt, status, objectCount, notes, uploadedByUser.fullname]
 *         example: "createdAt,uploadedByUser.fullname"
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order (support multiple values separated by comma)
 *       - in: query
 *         name: createdFrom
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter images created from this date (ISO 8601 format, inclusive)
 *       - in: query
 *         name: createdTo
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter images created until this date (ISO 8601 format, inclusive)
 *     responses:
 *       200:
 *         description: List of images with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       filename:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [PENDING, PROCESSING, COMPLETED, FAILED]
 *                       objectCount:
 *                         type: integer
 *                       notes:
 *                         type: string
 *                         description: Notes about the image
 *                       uploadedByUser:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           fullname:
 *                             type: string
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
 *     description: |
 *       Export dataset images and labels as a YOLO format ZIP file.
 *       Optionally filter by image status to include only specific statuses.
 *       
 *       Query Parameters:
 *       - status: Optional, comma-separated list of statuses to include
 *         - If not provided: exports only COMPLETED images (default behavior)
 *         - If provided: exports images with specified statuses
 *         - Example: ?status=COMPLETED,PROCESSING
 *     tags: [YOLO Dataset]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: datasetId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the dataset to export
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by image status (support multiple values separated by comma). Example COMPLETED,PROCESSING. If not specified, exports only COMPLETED images
 *         example: "COMPLETED,PROCESSING"
 *     responses:
 *       200:
 *         description: ZIP file download containing images and labels in YOLO format
 *         content:
 *           application/zip:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Validation error (invalid status values)
 *       401:
 *         description: Unauthorized or missing permission
 *       404:
 *         description: Dataset not found
 */
router.get(
  '/:datasetId/export',
  authenticateToken,
  requirePermission(PERMISSIONS.YOLO.EXPORT_DATASET),
  validate([
    { schema: datasetIdParamSchema, source: 'params' },
    { schema: exportDatasetSchema, source: 'query' }
  ]),
  yoloDatasetController.exportDataset
);

/**
 * @swagger
 * /yolo/datasets/{datasetId}/export-token:
 *   post:
 *     summary: Create an export token for public dataset download
 *     description: |
 *       Creates a time-limited JWT token that can be used to download a dataset without authentication.
 *       Token expires in 1 hour and can only be used for exporting that specific dataset.
 *     tags: [YOLO Dataset]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: datasetId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the dataset to export
 *       - in: body
 *         name: expiresIn
 *         required: false
 *         schema:
 *           type: string
 *         description: Expiration time for the token (e.g., 30m, 1h, 2d)
 *     responses:
 *       200:
 *         description: Export token created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: JWT token for public download
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     expiresIn:
 *                       type: string
 *                       example: "1h"
 *       401:
 *         description: Unauthorized - requires YOLO.MANAGE_DATASET permission
 *       404:
 *         description: Dataset not found
 */
router.post(
  '/:datasetId/export-token',
  authenticateToken,
  requirePermission(PERMISSIONS.YOLO.MANAGE_DATASET),
  validate(datasetIdParamSchema, 'params'),
  validate(exportTokenSchema, 'body'),
  yoloDatasetController.createExportToken
);

/**
 * @swagger
 * /yolo/download/{token}:
 *   get:
 *     summary: Download dataset using export token (Public API)
 *     description: |
 *       Public endpoint to download a dataset using an export token created by POST /export-token.
 *       No authentication required - the token contains all necessary information.
 *       Downloads the dataset as "data.zip" with fixed filename.
 *     tags: [YOLO Dataset]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Export token obtained from POST /export-token
 *     responses:
 *       200:
 *         description: ZIP file download (filename is always "data.zip")
 *         content:
 *           application/zip:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Invalid or expired token
 */

/**
 * @swagger
 * /yolo/datasets/{datasetId}/import:
 *   post:
 *     summary: Import images from ZIP file into existing dataset
 *     description: |
 *       Import images from a ZIP file into an existing dataset.
 *       ZIP file structure expected:
 *       - images/ - folder containing image files
 *       - labels/ - folder containing .txt label files (optional)
 *       - classes.txt - class names, one per line (optional, will merge with existing)
 *       
 *       Process:
 *       1. Extract ZIP file
 *       2. Merge classes from ZIP with existing dataset classes
 *       3. Import all images with corresponding labels
 *       4. Mark imported images as COMPLETED
 *       5. Update dataset counters
 *     tags: [YOLO Dataset]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: datasetId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the existing dataset to import into
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - zipFile
 *             properties:
 *               zipFile:
 *                 type: string
 *                 format: binary
 *                 description: ZIP file containing YOLO format dataset (max 500MB)
 *     responses:
 *       200:
 *         description: Images imported successfully into existing dataset
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "Imported 150 images (5 failed)"
 *                 data:
 *                   type: object
 *                   properties:
 *                     importedCount:
 *                       type: integer
 *                       description: Number of successfully imported images
 *                     failedCount:
 *                       type: integer
 *                       description: Number of failed imports
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: List of error messages for failed imports
 *       400:
 *         description: No ZIP file provided
 *       404:
 *         description: Dataset not found
 */
router.post(
  '/:datasetId/import',
  authenticateToken,
  requirePermission(PERMISSIONS.YOLO.MANAGE_DATASET),
  validate(datasetIdParamSchema, 'params'),
  uploadDatasetZip,
  handleZipUploadError,
  yoloDatasetController.importDatasetToExisting
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
 *     summary: Update image annotations, notes, or status
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
 *                 description: Notes about the image
 *               status:
 *                 type: string
 *                 enum: [PENDING, PROCESSING, COMPLETED, FAILED]
 *                 description: Image processing status
 *                 example: COMPLETED
 *               annotations:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     class_id:
 *                       type: integer
 *                     class_name:
 *                       type: string
 *                     confidence:
 *                       type: number
 *                     x1:
 *                       type: number
 *                     y1:
 *                       type: number
 *                     x2:
 *                       type: number
 *                     y2:
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
