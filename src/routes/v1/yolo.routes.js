import express from 'express';
import * as yoloController from '../../controllers/yolo.controller.js';
import * as yoloModelController from '../../controllers/yoloModel.controller.js';
import { createUploadMiddleware, createUploadErrorHandler } from '../../middlewares/upload.middleware.js';
import { validate } from '../../middlewares/validation.middleware.js';
import { detectSchema } from '../../validations/yolo.validation.js';
import {
  uploadYoloModelSchema,
  getModelsSchema,
  modelIdParamSchema,
  paginationSchema
} from '../../validations/yoloModel.validation.js';
import { authenticateToken } from '../../middlewares/auth.middleware.js';

const router = express.Router();

// Create upload middleware for YOLO detection (single image, 10MB max)
const uploadYoloImage = createUploadMiddleware({
  fieldName: 'image',
  maxSize: 10,
  multiple: false
});

// Create upload middleware for YOLO model (.pt files, up to 100MB)
const uploadYoloModel = createUploadMiddleware({
  fieldName: 'model',
  maxSize: 100,
  multiple: false,
  fileType: 'model'
});

const handleYoloUploadError = createUploadErrorHandler('image', 10);
const handleModelUploadError = createUploadErrorHandler('model', 100);

/**
 * @swagger
 * tags:
 *   name: YOLO
 *   description: Object detection and model management using YOLO
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

// ============================================
// MODEL MANAGEMENT ROUTES
// ============================================

/**
 * @swagger
 * /yolo/models:
 *   get:
 *     summary: Get all available YOLO models with pagination and filtering
 *     tags: [YOLO]
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
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by model name or description
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, DEPRECATED, TESTING]
 *         description: Filter models by status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, createdAt, version, status]
 *         description: Field to sort by
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of models with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       version:
 *                         type: string
 *                       status:
 *                         type: string
 *                       isActive:
 *                         type: boolean
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/models',
  authenticateToken,
  validate(getModelsSchema, 'query'),
  yoloModelController.getAllModels
);

/**
 * @swagger
 * /yolo/models/active:
 *   get:
 *     summary: Get currently active YOLO model
 *     tags: [YOLO]
 *     responses:
 *       200:
 *         description: Active model information
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
 *                   nullable: true
 */
router.get('/models/active', yoloModelController.getActiveModel);

/**
 * @swagger
 * /yolo/models/upload:
 *   post:
 *     summary: Upload a new YOLO model (.pt file)
 *     tags: [YOLO]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - model
 *             properties:
 *               model:
 *                 type: string
 *                 format: binary
 *                 description: .pt file (YOLO model)
 *               name:
 *                 type: string
 *                 description: Model name (optional - if not provided, will use timestamp format YYYYMMDD_HHMMSS)
 *               description:
 *                 type: string
 *                 description: Model description (optional)
 *               version:
 *                 type: string
 *                 description: Model version (optional)
 *               accuracy:
 *                 type: number
 *                 description: Model accuracy (optional, 0-100)
 *     responses:
 *       201:
 *         description: Model uploaded successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/models/upload',
  authenticateToken,
  uploadYoloModel,
  handleModelUploadError,
  validate(uploadYoloModelSchema, 'fields'),
  yoloModelController.uploadModel
);

/**
 * @swagger
 * /yolo/models/{modelId}:
 *   get:
 *     summary: Get model by ID
 *     tags: [YOLO]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: modelId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Model details
 *       404:
 *         description: Model not found
 */
router.get(
  '/models/:modelId',
  authenticateToken,
  validate(modelIdParamSchema, 'params'),
  yoloModelController.getModelById
);

/**
 * @swagger
 * /yolo/models/{modelId}/activate:
 *   put:
 *     summary: Set a model as active
 *     tags: [YOLO]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: modelId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Model activated successfully
 *       404:
 *         description: Model not found
 */
router.put(
  '/models/:modelId/activate',
  authenticateToken,
  validate(modelIdParamSchema, 'params'),
  yoloModelController.setActiveModel
);

/**
 * @swagger
 * /yolo/models/{modelId}:
 *   patch:
 *     summary: Update model information
 *     tags: [YOLO]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: modelId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *               version:
 *                 type: string
 *               accuracy:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, DEPRECATED, TESTING]
 *     responses:
 *       200:
 *         description: Model updated
 *       404:
 *         description: Model not found
 */
router.patch(
  '/models/:modelId',
  authenticateToken,
  validate(modelIdParamSchema, 'params'),
  yoloModelController.updateModel
);

/**
 * @swagger
 * /yolo/models/{modelId}:
 *   delete:
 *     summary: Delete a YOLO model
 *     tags: [YOLO]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: modelId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Model deleted
 *       404:
 *         description: Model not found
 */
router.delete(
  '/models/:modelId',
  authenticateToken,
  validate(modelIdParamSchema, 'params'),
  yoloModelController.deleteModel
);

/**
 * @swagger
 * /yolo/models/{modelId}/logs:
 *   get:
 *     summary: Get detection logs for a model with pagination
 *     tags: [YOLO]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: modelId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Model ID
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
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in detection logs
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [detectedAt, confidence]
 *         description: Field to sort by
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Detection logs with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       modelId:
 *                         type: integer
 *                       imagePath:
 *                         type: string
 *                       totalObjects:
 *                         type: integer
 *                       confidence:
 *                         type: number
 *                       detectedAt:
 *                         type: string
 *                         format: date-time
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Model not found
 */
router.get(
  '/models/:modelId/logs',
  authenticateToken,
  validate([
    { schema: modelIdParamSchema, source: 'params' },
    { schema: paginationSchema, source: 'query' }
  ]),
  yoloModelController.getDetectionLogs
);

/**
 * @swagger
 * /yolo/models/{modelId}/stats:
 *   get:
 *     summary: Get model statistics
 *     tags: [YOLO]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: modelId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Model statistics
 */
router.get(
  '/models/:modelId/stats',
  authenticateToken,
  validate(modelIdParamSchema, 'params'),
  yoloModelController.getModelStats
);

export default router;
