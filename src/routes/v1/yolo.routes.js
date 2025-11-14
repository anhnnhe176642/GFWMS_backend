import express from 'express';
import * as yoloController from '../../controllers/yolo.controller.js';
import { createUploadMiddleware, createUploadErrorHandler } from '../../middlewares/upload.middleware.js';
import { validate } from '../../middlewares/validation.middleware.js';
import { detectSchema } from '../../validations/yolo.validation.js';

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

export default router;
