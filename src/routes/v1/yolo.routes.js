import express from 'express';
import * as yoloController from '../../controllers/yolo.controller.js';
import * as yoloModelController from '../../controllers/yoloModel.controller.js';
import yoloDatasetRoutes from './yoloDataset.routes.js';
import { createUploadMiddleware, createUploadErrorHandler } from '../../middlewares/upload.middleware.js';
import { validate } from '../../middlewares/validation.middleware.js';
import { detectSchema } from '../../validations/yolo.validation.js';
import {
  uploadYoloModelSchema,
  getModelsSchema,
  modelIdParamSchema,
  paginationSchema,
  tokenParamSchema,
  uploadModelWithTokenSchema
} from '../../validations/yoloModel.validation.js';
import { authenticateToken, requirePermission } from '../../middlewares/auth.middleware.js';
import { PERMISSIONS } from '../../constants/permissions.js';

const router = express.Router();

// Create upload middleware for YOLO detection (single image, 50MB max)
const uploadYoloImage = createUploadMiddleware({
  fieldName: 'image',
  maxSize: 50,
  multiple: false
});

// Create upload middleware for YOLO model (.pt files, up to 100MB)
const uploadYoloModel = createUploadMiddleware({
  fieldName: 'model',
  maxSize: 100,
  multiple: false,
  fileType: 'model'
});

const handleYoloUploadError = createUploadErrorHandler('image', 50);
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
 *     summary: Detect and count objects in an image (with row sorting based on detection slope)
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
 *         description: Detection results with object counts, coordinates, and row assignment
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
 *                             example: 0
 *                           class_name:
 *                             type: string
 *                             example: "person"
 *                           confidence:
 *                             type: number
 *                             example: 0.95
 *                           bbox:
 *                             type: object
 *                             description: Bounding box coordinates
 *                             properties:
 *                               x1:
 *                                 type: number
 *                                 example: 100.5
 *                               y1:
 *                                 type: number
 *                                 example: 50.3
 *                               x2:
 *                                 type: number
 *                                 example: 200.8
 *                               y2:
 *                                 type: number
 *                                 example: 300.2
 *                           center:
 *                             type: object
 *                             description: Center point of detection
 *                             properties:
 *                               x:
 *                                 type: number
 *                                 example: 150.65
 *                               y:
 *                                 type: number
 *                                 example: 175.25
 *                           dimensions:
 *                             type: object
 *                             description: Width and height of detection
 *                             properties:
 *                               width:
 *                                 type: number
 *                                 example: 100.3
 *                               height:
 *                                 type: number
 *                                 example: 249.9
 *                           row:
 *                             type: integer
 *                             description: Row index (row number of detection based on slope analysis). Objects on the same row are grouped together based on their Y-coordinate with tolerance calculated from detection height.
 *                             example: 1
 *                     image_info:
 *                       type: object
 *                       description: Information about the analyzed image
 *                       properties:
 *                         width:
 *                           type: integer
 *                           example: 640
 *                         height:
 *                           type: integer
 *                           example: 480
 *                         path:
 *                           type: string
 *                     model_info:
 *                       type: object
 *                       description: Information about the YOLO model used
 *       400:
 *         description: Bad request - no image or invalid parameters
 *       500:
 *         description: Server error or detection failed
 */
router.post(
  '/detect',
  authenticateToken,
  requirePermission(PERMISSIONS.YOLO.DETECT),
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
  requirePermission(PERMISSIONS.YOLO.VIEW_MODELS),
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
  requirePermission(PERMISSIONS.YOLO.UPLOAD_MODEL),
  uploadYoloModel,
  handleModelUploadError,
  validate(uploadYoloModelSchema, 'fields'),
  yoloModelController.uploadModel
);

/**
 * @swagger
 * /yolo/models/upload-with-token/{token}:
 *   post:
 *     summary: Upload a new YOLO model (.pt file) using public token (Public API)
 *     description: |
 *       Public endpoint to upload a YOLO model using an export token.
 *       No authentication required - the token contains necessary user information.
 *       Token must be created by POST /datasets/{datasetId}/export-token endpoint.
 *     tags: [YOLO]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Export token obtained from POST /datasets/{datasetId}/export-token
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
 *         description: Bad request or token is required
 *       401:
 *         description: Invalid or expired token
 */
router.post(
  '/models/upload-with-token/:token',
  uploadYoloModel,
  handleModelUploadError,
  validate([
    { schema: tokenParamSchema, source: 'params' },
    { schema: uploadModelWithTokenSchema, source: 'fields' }
  ]),
  yoloModelController.uploadModelWithToken
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
  requirePermission(PERMISSIONS.YOLO.VIEW_MODEL),
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
  requirePermission(PERMISSIONS.YOLO.ACTIVATE_MODEL),
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
  requirePermission(PERMISSIONS.YOLO.UPDATE_MODEL),
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
  requirePermission(PERMISSIONS.YOLO.DELETE_MODEL),
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
  requirePermission(PERMISSIONS.YOLO.VIEW_LOGS),
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
  requirePermission(PERMISSIONS.YOLO.VIEW_STATS),
  validate(modelIdParamSchema, 'params'),
  yoloModelController.getModelStats
);

// ============================================
// DATASET MANAGEMENT ROUTES
// ============================================

/**
 * @swagger
 * /yolo/download/{token}:
 *   get:
 *     summary: Download dataset using export token (Public API)
 *     description: |
 *       Public endpoint to download a dataset using an export token created by POST /datasets/{datasetId}/export-token.
 *       No authentication required - the token contains all necessary information.
 *       Downloads the dataset as "data.zip" with fixed filename.
 *     tags: [YOLO Dataset]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Export token obtained from POST /datasets/{datasetId}/export-token
 *     responses:
 *       200:
 *         description: ZIP file download (filename is always "data.zip")
 *         content:
 *           application/zip:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Token is required in URL path
 *       401:
 *         description: Invalid or expired token
 */
router.get(
  '/download/:token',
  (req, res, next) => {
    // Import yoloDatasetController dynamically to avoid circular dependency
    import('../../controllers/yoloDataset.controller.js').then(module => {
      module.downloadDatasetWithToken(req, res, next);
    });
  }
);

router.use('/datasets', yoloDatasetRoutes);

export default router;
