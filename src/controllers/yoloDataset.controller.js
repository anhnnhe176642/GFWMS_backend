import yoloDatasetService from '../services/yoloDataset.service.js';
import { buildQueryParams } from '../utils/filter-builder.js';
import { enrichImageWithUrl, enrichImagesWithUrls } from '../utils/image-url.js';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Create new dataset
 * @route POST /api/yolo/datasets
 */
export const createDataset = async (req, res, next) => {
  try {
    const dataset = await yoloDatasetService.createDataset(req.body);

    res.status(201).json({
      success: true,
      message: 'Dataset created successfully',
      data: dataset
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all datasets with pagination and filtering
 * @route GET /api/yolo/datasets
 */
export const getAllDatasets = async (req, res, next) => {
  try {
    const queryParams = buildQueryParams(req.query, {
      filterFields: ['status'],
      dateRangeConfig: {
        fromField: 'createdFrom',
        toField: 'createdTo',
        targetField: 'createdAt'
      }
    });

    const result = await yoloDatasetService.getAllDatasets(queryParams);

    res.json({
      success: true,
      message: 'Datasets retrieved successfully',
      ...result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get dataset by ID
 * @route GET /api/yolo/datasets/:datasetId
 */
export const getDatasetById = async (req, res, next) => {
  try {
    const dataset = await yoloDatasetService.getDatasetById(req.params.datasetId);

    res.json({
      success: true,
      message: 'Dataset retrieved successfully',
      data: dataset
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update dataset
 * @route PATCH /api/yolo/datasets/:datasetId
 */
export const updateDataset = async (req, res, next) => {
  try {
    const dataset = await yoloDatasetService.updateDataset(
      req.params.datasetId,
      req.body
    );

    res.json({
      success: true,
      message: 'Dataset updated successfully',
      data: dataset
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete dataset
 * @route DELETE /api/yolo/datasets/:datasetId
 */
export const deleteDataset = async (req, res, next) => {
  try {
    await yoloDatasetService.deleteDataset(req.params.datasetId);

    res.json({
      success: true,
      message: 'Dataset deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add labeled image to dataset
 * @route POST /api/yolo/datasets/:datasetId/images
 */
export const addLabeledImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    // Parse detection data from body (optional)
    // detections already parsed by parseMultipartJson middleware
    const detectionData = {
      detections: req.body.detections || [],
      notes: req.body.notes
    };

    const image = await yoloDatasetService.addLabeledImage(
      req.params.datasetId,
      req.file,
      detectionData,
      req.user?.id
    );

    const baseUrl = process.env.API_BASE_URL || `http://localhost:3000`;
    const enrichedImage = enrichImageWithUrl(image, baseUrl);

    res.status(201).json({
      success: true,
      message: 'Labeled image added to dataset successfully',
      data: enrichedImage
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get images in dataset
 * @route GET /api/yolo/datasets/:datasetId/images
 */
export const getDatasetImages = async (req, res, next) => {
  try {
    const queryParams = buildQueryParams(req.query, {
      filterFields: ['status'],
      dateRangeConfig: {
        fromField: 'createdFrom',
        toField: 'createdTo',
        targetField: 'createdAt'
      }
    });

    const result = await yoloDatasetService.getDatasetImages(
      req.params.datasetId,
      queryParams
    );

    const baseUrl = process.env.API_BASE_URL || `http://localhost:3000`;
    const enrichedResult = {
      ...result,
      data: enrichImagesWithUrls(result.data, baseUrl)
    };

    res.json({
      success: true,
      message: 'Dataset images retrieved successfully',
      ...enrichedResult
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get image by ID
 * @route GET /api/yolo/datasets/images/:imageId
 */
export const getImageById = async (req, res, next) => {
  try {
    const image = await yoloDatasetService.getImageById(req.params.imageId);
    const baseUrl = process.env.API_BASE_URL || `http://localhost:3000`;
    const enrichedImage = enrichImageWithUrl(image, baseUrl);

    res.json({
      success: true,
      message: 'Image retrieved successfully',
      data: enrichedImage
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update image
 * @route PATCH /api/yolo/datasets/images/:imageId
 */
export const updateImage = async (req, res, next) => {
  try {
    const image = await yoloDatasetService.updateImage(
      req.params.imageId,
      req.body
    );

    res.json({
      success: true,
      message: 'Image updated successfully',
      data: image
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete image
 * @route DELETE /api/yolo/datasets/images/:imageId
 */
export const deleteImage = async (req, res, next) => {
  try {
    await yoloDatasetService.deleteImage(req.params.imageId);

    res.json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Export dataset as ZIP
 * @route GET /api/yolo/datasets/:datasetId/export
 */
export const exportDataset = async (req, res, next) => {
  try {
    const dataset = await yoloDatasetService.getDatasetById(req.params.datasetId);
    
    // Create temp file for ZIP
    const timestamp = Date.now();
    const zipFilename = `${dataset.name}_${timestamp}.zip`;
    const tempZipPath = path.join(__dirname, '../../temp', zipFilename);

    // Ensure temp directory exists
    await fs.mkdir(path.dirname(tempZipPath), { recursive: true });

    // Create ZIP
    await yoloDatasetService.exportDataset(
      req.params.datasetId,
      tempZipPath
    );

    // Send file
    res.download(tempZipPath, zipFilename, async (err) => {
      // Clean up temp file after download
      try {
        await fs.unlink(tempZipPath);
      } catch (cleanupError) {
        console.error('Failed to clean up temp ZIP file:', cleanupError);
      }

      if (err) {
        next(err);
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Import dataset from ZIP file and create a new dataset
 * @route POST /api/yolo/datasets/import-zip
 */
export const importDatasetFromZip = async (req, res, next) => {
  try {
    console.log('importDatasetFromZip called');
    console.log('req.file:', req.file ? 'exists' : 'missing');
    console.log('req.body:', req.body);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No ZIP file provided'
      });
    }

    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Dataset name is required'
      });
    }

    console.log('Calling importDatasetFromZip service with name:', name);
    const result = await yoloDatasetService.importDatasetFromZip(
      req.file,
      name,
      description,
      req.user?.id
    );
    console.log('Import result:', result);

    res.status(201).json({
      success: result.success,
      message: result.message,
      data: {
        dataset: result.dataset,
        importedCount: result.importedCount,
        failedCount: result.failedCount,
        errors: result.errors
      }
    });
  } catch (error) {
    console.error('Error in importDatasetFromZip:', error);
    next(error);
  }
};

/**
 * Import dataset from ZIP file into existing dataset
 * @route POST /api/yolo/datasets/:datasetId/import
 */
export const importDatasetToExisting = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No ZIP file provided'
      });
    }

    const result = await yoloDatasetService.importDataset(
      req.params.datasetId,
      req.file,
      req.user?.id
    );

    res.status(200).json({
      success: result.success,
      message: result.message,
      data: {
        importedCount: result.importedCount,
        failedCount: result.failedCount,
        errors: result.errors
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get dataset statistics
 * @route GET /api/yolo/datasets/:datasetId/stats
 */
export const getDatasetStats = async (req, res, next) => {
  try {
    const stats = await yoloDatasetService.getDatasetStats(req.params.datasetId);

    res.json({
      success: true,
      message: 'Dataset statistics retrieved successfully',
      data: stats
    });
  } catch (error) {
    next(error);
  }
};
