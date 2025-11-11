import yoloService from '../services/yolo.service.js';
import { AppError } from '../utils/errors.js';

/**
 * Detect objects in uploaded image
 * @route POST /api/yolo/detect
 * @access Public (có thể thêm authentication sau)
 */
export const detectObjects = async (req, res, next) => {
  try {
    // Kiểm tra file upload
    if (!req.file) {
      throw new AppError('No image file provided. Please upload an image.', 400);
    }

    // Lấy options từ request
    const confidence = req.body.confidence 
      ? parseFloat(req.body.confidence) 
      : 0.5;

    // Validate confidence
    if (confidence < 0 || confidence > 1) {
      throw new AppError('Confidence must be between 0 and 1', 400);
    }

    // Run detection từ buffer
    const result = await yoloService.detectFromBuffer(
      req.file.buffer,
      req.file.originalname,
      { confidence }
    );

    // Format response
    const response = {
      success: true,
      message: 'Object detection completed successfully',
      data: {
        summary: {
          total_objects: result.total_objects,
          counts_by_class: result.counts_by_class
        },
        detections: result.detections,
        image_info: result.image_info,
        model_info: result.model_info
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Get YOLO model information
 * @route GET /api/yolo/model-info
 * @access Public
 */
export const getModelInfo = async (req, res, next) => {
  try {
    const modelInfo = await yoloService.getModelInfo();
    
    res.json({
      success: true,
      data: modelInfo
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Health check endpoint
 * @route GET /api/yolo/health
 * @access Public
 */
export const healthCheck = async (req, res, next) => {
  try {
    const modelExists = await yoloService.verifyModelExists();
    
    res.json({
      success: true,
      status: 'healthy',
      model_available: modelExists,
      message: modelExists 
        ? 'YOLO service is ready' 
        : 'YOLO service is running but model file not found. Please add your .pt file to src/python/models/best.pt'
    });
  } catch (error) {
    next(error);
  }
};
