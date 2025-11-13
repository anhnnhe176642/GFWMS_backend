import express from 'express';
import * as yoloController from '../../controllers/yolo.controller.js';
import * as yoloDatasetController from '../../controllers/yoloDataset.controller.js';
import { createUploadMiddleware, createUploadErrorHandler } from '../../middlewares/upload.middleware.js';
import { validate } from '../../middlewares/validation.middleware.js';
import { detectSchema } from '../../validations/yolo.validation.js';
import {
  createDatasetSchema,
  updateDatasetSchema,
  saveImageSchema,
  saveDetectionSchema,
  startTrainingSchema,
  datasetQuerySchema,
  trainingRunQuerySchema,
  classesQuerySchema,
  requireImageFile
} from '../../validations/yoloDataset.validation.js';
import { buildQueryParams } from '../../utils/filter-builder.js';

const router = express.Router();

// Create upload middleware for YOLO detection (single image, 10MB max)
const uploadYoloImage = createUploadMiddleware({
  fieldName: 'image',
  maxSize: 10,
  multiple: false
});

const handleYoloUploadError = createUploadErrorHandler('image', 10);

/**
 * @swagger
 * tags:
 *   name: YOLO
 *   description: Object detection using YOLO model
 */

/**
 * @swagger
 * /yolo/health:
 *   get:
 *     summary: Health check for YOLO service
 *     tags: [YOLO]
 *     responses:
 *       200:
 *         description: Service health status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 status:
 *                   type: string
 *                 model_available:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
router.get('/health', yoloController.healthCheck);

/**
 * @swagger
 * /yolo/model-info:
 *   get:
 *     summary: Get YOLO model information
 *     tags: [YOLO]
 *     responses:
 *       200:
 *         description: Model information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     model_path:
 *                       type: string
 *                     exists:
 *                       type: boolean
 *                     name:
 *                       type: string
 */
router.get('/model-info', yoloController.getModelInfo);

/**
 * @swagger
 * /yolo/detect:
 *   post:
 *     summary: Detect and count objects in an image
 *     tags: [YOLO]
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
 *                 description: Image file to analyze (JPEG, PNG, GIF, WEBP)
 *               confidence:
 *                 type: number
 *                 format: float
 *                 minimum: 0
 *                 maximum: 1
 *                 default: 0.5
 *                 description: Confidence threshold for detections (0-1)
 *     responses:
 *       200:
 *         description: Detection results with object counts and coordinates
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
 *                   example: Object detection completed successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     summary:
 *                       type: object
 *                       properties:
 *                         total_objects:
 *                           type: integer
 *                           example: 5
 *                         counts_by_class:
 *                           type: object
 *                           example: { "person": 3, "car": 2 }
 *                     detections:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           class_id:
 *                             type: integer
 *                           class_name:
 *                             type: string
 *                           confidence:
 *                             type: number
 *                           bbox:
 *                             type: object
 *                             properties:
 *                               x1:
 *                                 type: number
 *                               y1:
 *                                 type: number
 *                               x2:
 *                                 type: number
 *                               y2:
 *                                 type: number
 *                           center:
 *                             type: object
 *                             properties:
 *                               x:
 *                                 type: number
 *                               y:
 *                                 type: number
 *                           dimensions:
 *                             type: object
 *                             properties:
 *                               width:
 *                                 type: number
 *                               height:
 *                                 type: number
 *                     image_info:
 *                       type: object
 *                       properties:
 *                         width:
 *                           type: integer
 *                         height:
 *                           type: integer
 *                     model_info:
 *                       type: object
 *       400:
 *         description: Bad request - no image or invalid parameters
 *       500:
 *         description: Server error or detection failed
 */
router.post(
  '/detect',
  uploadYoloImage,
  handleYoloUploadError,
  validate(detectSchema, 'body'),
  yoloController.detectObjects
);

// ===== DATASET MANAGEMENT ROUTES =====

/**
 * @swagger
 * /yolo/datasets:
 *   post:
 *     summary: Create a new YOLO training dataset
 *     tags: [YOLO]
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
 *                 description: Dataset name/version
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, ARCHIVED, TRAINING]
 *     responses:
 *       201:
 *         description: Dataset created successfully
 */
router.post(
  '/datasets',
  validate(createDatasetSchema, 'body'),
  yoloDatasetController.createDataset
);

/**
 * @swagger
 * /yolo/datasets:
 *   get:
 *     summary: Get all datasets with pagination
 *     tags: [YOLO]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, ARCHIVED, TRAINING]
 *     responses:
 *       200:
 *         description: List of datasets
 */
router.get(
  '/datasets',
  validate(datasetQuerySchema, 'query'),
  (req, res, next) => {
    req.queryParams = buildQueryParams(req.query, {
      searchFields: ['name', 'description'],
      filterFields: ['status'],
      defaultSort: { field: 'createdAt', order: 'desc' }
    });
    next();
  },
  yoloDatasetController.getDatasets
);

/**
 * @swagger
 * /yolo/datasets/{id}:
 *   get:
 *     summary: Get dataset by ID
 *     tags: [YOLO]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Dataset details
 *       404:
 *         description: Dataset not found
 */
router.get('/datasets/:id', yoloDatasetController.getDatasetById);

/**
 * @swagger
 * /yolo/datasets/{id}:
 *   patch:
 *     summary: Update dataset
 *     tags: [YOLO]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
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
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Dataset updated
 */
router.patch(
  '/datasets/:id',
  validate(updateDatasetSchema, 'body'),
  yoloDatasetController.updateDataset
);

/**
 * @swagger
 * /yolo/datasets/{id}:
 *   delete:
 *     summary: Delete dataset
 *     tags: [YOLO]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Dataset deleted
 */
router.delete('/datasets/:id', yoloDatasetController.deleteDataset);

/**
 * @swagger
 * /yolo/datasets/{id}/images:
 *   post:
 *     summary: Save image with manual labels to dataset
 *     tags: [YOLO]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *               - labels
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *               labels:
 *                 type: string
 *                 description: JSON array of labels
 *               split:
 *                 type: string
 *                 enum: [train, val, test]
 *                 default: train
 *     responses:
 *       201:
 *         description: Image saved successfully
 */
router.post(
  '/datasets/:id/images',
  uploadYoloImage,
  handleYoloUploadError,
  requireImageFile,
  validate(saveImageSchema, 'body'),
  yoloDatasetController.saveImageToDataset
);

/**
 * @swagger
 * /yolo/datasets/{id}/save-detection:
 *   post:
 *     summary: Save detection result to dataset for retraining
 *     tags: [YOLO]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *               - detection_result
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *               detection_result:
 *                 type: string
 *                 description: JSON detection result from /detect endpoint
 *               split:
 *                 type: string
 *                 enum: [train, val, test]
 *                 default: train
 *     responses:
 *       201:
 *         description: Detection saved successfully
 */
router.post(
  '/datasets/:id/save-detection',
  uploadYoloImage,
  handleYoloUploadError,
  requireImageFile,
  validate(saveDetectionSchema, 'body'),
  yoloDatasetController.saveDetectionToDataset
);

/**
 * @swagger
 * /yolo/datasets/{id}/stats:
 *   get:
 *     summary: Get dataset statistics
 *     tags: [YOLO]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Dataset statistics
 */
router.get('/datasets/:id/stats', yoloDatasetController.getDatasetStats);

/**
 * @swagger
 * /yolo/datasets/{id}/split:
 *   post:
 *     summary: Split training images into train/val if val is empty
 *     tags: [YOLO]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               valRatio:
 *                 type: number
 *                 description: Fraction of training images for validation (default 0.2)
 *                 default: 0.2
 *     responses:
 *       200:
 *         description: Dataset split successfully
 */
router.post('/datasets/:id/split', yoloDatasetController.splitDataset);

/**
 * @swagger
 * /yolo/datasets/{id}/train:
 *   post:
 *     summary: Start training on dataset
 *     tags: [YOLO]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               base_model:
 *                 type: string
 *                 default: best.pt
 *               epochs:
 *                 type: integer
 *                 default: 100
 *               batch_size:
 *                 type: integer
 *                 default: 16
 *               image_size:
 *                 type: integer
 *                 default: 640
 *     responses:
 *       202:
 *         description: Training started
 */
router.post(
  '/datasets/:id/train',
  validate(startTrainingSchema, 'body'),
  yoloDatasetController.startTraining
);

/**
 * @swagger
 * /yolo/training-runs:
 *   get:
 *     summary: Get all training runs
 *     tags: [YOLO]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, RUNNING, COMPLETED, FAILED]
 *       - in: query
 *         name: datasetId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of training runs
 */
router.get(
  '/training-runs',
  validate(trainingRunQuerySchema, 'query'),
  (req, res, next) => {
    req.queryParams = buildQueryParams(req.query, {
      filterFields: ['status', 'datasetId'],
      defaultSort: { field: 'createdAt', order: 'desc' }
    });
    next();
  },
  yoloDatasetController.getTrainingRuns
);

/**
 * @swagger
 * /yolo/training-runs/{id}:
 *   get:
 *     summary: Get training run by ID
 *     tags: [YOLO]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Training run details
 */
router.get('/training-runs/:id', yoloDatasetController.getTrainingRunById);

/**
 * @swagger
 * /yolo/classes:
 *   get:
 *     summary: Get all YOLO classes
 *     tags: [YOLO]
 *     parameters:
 *       - in: query
 *         name: active_only
 *         schema:
 *           type: boolean
 *           default: true
 *     responses:
 *       200:
 *         description: List of classes
 */
router.get(
  '/classes',
  validate(classesQuerySchema, 'query'),
  yoloDatasetController.getClasses
);

export default router;
