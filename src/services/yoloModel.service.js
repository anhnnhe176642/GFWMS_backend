import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { AppError, ConflictError } from '../utils/errors.js';
import { withPrismaErrorHandling } from '../utils/prisma-error-handler.js';
import yoloModelRepository from '../repositories/yoloModel.repository.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class YoloModelService {
  constructor() {
    this.modelsDir = path.join(__dirname, '../python/models');
  }

  /**
   * Initialize models directory
   */
  async initializeModelsDir() {
    try {
      await fs.mkdir(this.modelsDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create models directory:', error);
      throw new AppError('Failed to initialize models directory', 500);
    }
  }

  /**
   * Upload and register a new model
   */
  async uploadModel(file, metadata, userId = null) {
    if (!file) {
      throw new AppError('No file provided', 400);
    }

    if (!file.originalname.endsWith('.pt')) {
      throw new AppError('Only .pt files are allowed', 400);
    }

    await this.initializeModelsDir();

    // Check if model name already exists
    const existingModel = await yoloModelRepository.findByName(metadata.name);
    if (existingModel) {
      throw new ConflictError('Tên mô hình đã tồn tại', 'name');
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileName = `${metadata.name}-${timestamp}.pt`;
    const filePath = path.join(this.modelsDir, fileName);

    try {
      // Save file
      await fs.writeFile(filePath, file.buffer);

      // Register in database
      const modelData = {
        name: metadata.name,
        fileName: fileName,
        filePath: filePath,
        description: metadata.description || null,
        version: metadata.version || '1.0',
        status: 'ACTIVE',
        uploadedBy: userId,
        metadata: {
          originalName: file.originalname,
          mimetype: file.mimetype,
          uploadedAt: new Date().toISOString()
        }
      };

      const createdModel = await withPrismaErrorHandling(
        () => yoloModelRepository.create(modelData),
        {
          'name': 'Model name already exists'
        }
      );

      return {
        id: createdModel.id,
        name: createdModel.name,
        fileName: createdModel.fileName,
        fileSize: createdModel.fileSize,
        description: createdModel.description,
        version: createdModel.version,
        uploadedBy: createdModel.uploadedBy,
        uploadedAt: createdModel.uploadedAt
      };
    } catch (error) {
      // Clean up file if DB save fails
      try {
        await fs.unlink(filePath);
      } catch (unlinkError) {
        console.error('Failed to cleanup uploaded file:', unlinkError);
      }

      if (error.statusCode) {
        throw error;
      }
      throw new AppError(`Failed to upload model: ${error.message}`, 500);
    }
  }

  async getAllModels(queryOptions) {
    return await yoloModelRepository.findWithAdvancedQuery(queryOptions);
  }

  /**
   * Get model by ID
   */
  async getModelById(modelId) {
    const model = await yoloModelRepository.findById(modelId);
    if (!model) {
      throw new AppError('Model not found', 404);
    }
    return model;
  }

  /**
   * Set a model as active
   * Only one model can be active at a time
   */
  async setActiveModel(modelId) {
    // Verify model exists
    const model = await yoloModelRepository.findById(modelId);
    if (!model) {
      throw new AppError('Model not found', 404);
    }

    if (model.status !== 'ACTIVE') {
      throw new AppError('Can only activate active status models', 400);
    }

    // Set as active
    const updatedModel = await withPrismaErrorHandling(
      () => yoloModelRepository.setActiveModel(modelId),
      {
        'id': 'Model not found'
      }
    );

    return {
      message: `Model "${updatedModel.name}" is now active`,
      model: {
        id: updatedModel.id,
        name: updatedModel.name,
        isActive: updatedModel.isActive,
        version: updatedModel.version
      }
    };
  }

  /**
   * Use default model (deactivate current active model)
   * Remove active status from all models to use default model
   */
  async useDefaultModel() {
    // Find and deactivate the currently active model
    const activeModel = await yoloModelRepository.getActiveModel();
    
    if (activeModel) {
      await yoloModelRepository.update(activeModel.id, { isActive: false });
      return {
        message: `Model "${activeModel.name}" has been deactivated. Using default model.`,
        model: null
      };
    }

    return {
      message: 'No active model found. Already using default model.',
      model: null
    };
  }

  /**
   * Get currently active model
   */
  async getActiveModel() {
    const model = await yoloModelRepository.getActiveModel();
    if (!model) {
      return {
        message: 'No active model found. Using default model.',
        model: null
      };
    }

    return {
      message: 'Active model retrieved',
      model: {
        id: model.id,
        name: model.name,
        version: model.version,
        filePath: model.filePath,
        fileSize: model.fileSize
      }
    };
  }

  /**
   * Update model information (except filePath)
   */
  async updateModel(modelId, data) {
    const model = await yoloModelRepository.findById(modelId);
    if (!model) {
      throw new AppError('Model not found', 404);
    }

    // Don't allow updating filePath
    const { filePath, fileName, fileSize, uploadedAt, ...updateData } = data; // eslint-disable-line no-unused-vars

    const updatedModel = await withPrismaErrorHandling(
      () => yoloModelRepository.update(modelId, updateData),
      {
        'name': 'Model name already exists'
      }
    );

    return updatedModel;
  }

  /**
   * Delete model (soft delete)
   */
  async deleteModel(modelId) {
    const model = await yoloModelRepository.findById(modelId);
    if (!model) {
      throw new AppError('Model not found', 404);
    }

    // If this was the active model, deactivate it
    if (model.isActive) {
      await yoloModelRepository.update(modelId, { isActive: false });
    }

    const deletedModel = await yoloModelRepository.delete(modelId);

    // Try to delete the physical file
    try {
      if (model.filePath) {
        await fs.unlink(model.filePath);
      }
    } catch (error) {
      console.warn('Failed to delete model file:', error.message);
      // Don't throw error, just warn
    }

    return {
      message: `Model "${deletedModel.name}" has been deleted`,
      modelId: deletedModel.id
    };
  }

  /**
   * Get detection logs for a model
   */
  async getDetectionLogs(modelId, queryOptions) {
    return await yoloModelRepository.getDetectionLogs({ modelId, ...queryOptions });
  }

  /**
   * Get model statistics
   */
  async getModelStats(modelId) {
    const model = await yoloModelRepository.findById(modelId);
    if (!model) {
      throw new AppError('Model not found', 404);
    }

    const logs = await yoloModelRepository.getDetectionLogs({
      modelId: modelId,
      page: 1,
      limit: 1000 // Get recent logs
    });

    return {
      model: {
        id: model.id,
        name: model.name,
        version: model.version,
        isActive: model.isActive
      },
      statistics: {
        totalDetections: logs.data?.length || 0,
        averageConfidence: logs.data && logs.data.length > 0
          ? (logs.data.reduce((sum, log) => sum + log.confidence, 0) / logs.data.length).toFixed(4)
          : 0,
        totalObjectsDetected: logs.data ? logs.data.reduce((sum, log) => sum + log.totalObjects, 0) : 0
      },
      recentLogs: logs.data ? logs.data.slice(0, 10) : []
    };
  }
}

export default new YoloModelService();
