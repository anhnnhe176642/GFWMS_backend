import yoloModelService from '../services/yoloModel.service.js';
import { AppError } from '../utils/errors.js';
import { buildQueryParams } from '../utils/filter-builder.js';
import jwt from 'jsonwebtoken';
import { sendYoloModelUploadNotification } from '../utils/mailer.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Upload a new YOLO model
 * @route POST /api/yolo/models/upload
 * @access Private - Requires permission to manage models
 */
export const uploadModel = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError('Không có file được cung cấp', 400);
    }

    let { name, description, version } = req.body;

    // Generate default name if not provided
    if (!name) {
      const now = new Date();
      name = `model_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
    }

    const model = await yoloModelService.uploadModel(
      req.file,
      { name, description, version },
      req.user.id
    );

    // Fetch user email and send notification
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { email: true, fullname: true }
      });

      if (user && user.email) {
        await sendYoloModelUploadNotification(user.email, name, version || '1.0');
      }
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
      // Don't throw error, just log it
    }

    res.status(201).json({
      success: true,
      message: 'Model uploaded successfully',
      data: model
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload a new YOLO model using public token (Public API)
 * @route POST /api/yolo/models/upload-with-token/:token
 * @access Public - Uses token instead of authentication
 */
export const uploadModelWithToken = async (req, res, next) => {
  try {
    const { token } = req.params;

    if (!token) {
      throw new AppError('Token là bắt buộc', 400);
    }

    if (!req.file) {
      throw new AppError('Không có file được cung cấp', 400);
    }

    let { name, description, version } = req.body;

    // Generate default name if not provided
    if (!name) {
      const now = new Date();
      name = `model_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
    }

    // Verify and decode token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      console.error('JWT verification error:', error);
      throw new AppError('Token không hợp lệ hoặc đã hết hạn', 401);
    }

    // Verify token type
    if (decoded.type !== 'export') {
      throw new AppError('Loại token không hợp lệ', 401);
    }

    const userId = decoded.userId;

    const model = await yoloModelService.uploadModel(
      req.file,
      { name, description, version },
      userId
    );

    // Fetch user email and send notification
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, fullname: true }
      });

      if (user && user.email) {
        await sendYoloModelUploadNotification(user.email, name, version || '1.0');
      }
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
      // Don't throw error, just log it
    }

    res.status(201).json({
      success: true,
      message: 'Model uploaded successfully',
      data: model
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all available models
 * @route GET /api/yolo/models
 * @access Private
 */
export const getAllModels = async (req, res, next) => {
  try {
    const queryParams = buildQueryParams(req.query, {
      filterFields: ['status']
    });

    const result = await yoloModelService.getAllModels(queryParams);

    res.json({
      success: true,
      message: 'Models retrieved successfully',
      ...result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get model by ID
 * @route GET /api/yolo/models/:modelId
 * @access Private
 */
export const getModelById = async (req, res, next) => {
  try {
    const { modelId } = req.params;
    const model = await yoloModelService.getModelById(modelId);

    res.json({
      success: true,
      message: 'Model retrieved successfully',
      data: model
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Set a model as active
 * @route PUT /api/yolo/models/:modelId/activate
 * @access Private - Requires permission
 */
export const setActiveModel = async (req, res, next) => {
  try {
    const { modelId } = req.params;
    const result = await yoloModelService.setActiveModel(modelId);

    res.json({
      success: true,
      message: result.message,
      data: result.model
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Use default model (deactivate current active model)
 * @route PUT /api/yolo/models/use-default
 * @access Private - Requires permission
 */
export const useDefaultModel = async (req, res, next) => {
  try {
    const result = await yoloModelService.useDefaultModel();

    res.json({
      success: true,
      message: result.message,
      data: result.model
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get currently active model
 * @route GET /api/yolo/models/active
 * @access Public
 */
export const getActiveModel = async (req, res, next) => {
  try {
    const result = await yoloModelService.getActiveModel();

    res.json({
      success: true,
      message: result.message,
      data: result.model
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update model information
 * @route PATCH /api/yolo/models/:modelId
 * @access Private
 */
export const updateModel = async (req, res, next) => {
  try {
    const { modelId } = req.params;
    const { description, version, status } = req.body;

    const model = await yoloModelService.updateModel(modelId, {
      description,
      version,
      status
    });

    res.json({
      success: true,
      message: 'Model updated successfully',
      data: model
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete model (soft delete)
 * @route DELETE /api/yolo/models/:modelId
 * @access Private - Requires permission
 */
export const deleteModel = async (req, res, next) => {
  try {
    const { modelId } = req.params;
    const result = await yoloModelService.deleteModel(modelId);

    res.json({
      success: true,
      message: result.message,
      data: { modelId: result.modelId }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get detection logs for a model
 * @route GET /api/yolo/models/:modelId/logs
 * @access Private
 */
export const getDetectionLogs = async (req, res, next) => {
  try {
    const { modelId } = req.params;
    const queryParams = buildQueryParams(req.query);

    const logs = await yoloModelService.getDetectionLogs(modelId, queryParams);

    res.json({
      success: true,
      message: 'Detection logs retrieved successfully',
      ...logs
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get model statistics
 * @route GET /api/yolo/models/:modelId/stats
 * @access Private
 */
export const getModelStats = async (req, res, next) => {
  try {
    const { modelId } = req.params;
    const stats = await yoloModelService.getModelStats(modelId);

    res.json({
      success: true,
      message: 'Model statistics retrieved successfully',
      data: stats
    });
  } catch (error) {
    next(error);
  }
};
