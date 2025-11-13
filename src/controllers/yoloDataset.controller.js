import yoloDatasetService from '../services/yoloDataset.service.js';

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
 * Get all datasets
 * @route GET /api/yolo/datasets
 */
export const getDatasets = async (req, res, next) => {
  try {
    const result = await yoloDatasetService.getDatasets(req.queryParams);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get dataset by ID
 * @route GET /api/yolo/datasets/:id
 */
export const getDatasetById = async (req, res, next) => {
  try {
    const dataset = await yoloDatasetService.getDatasetById(req.params.id);

    res.json({
      success: true,
      data: dataset
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update dataset
 * @route PATCH /api/yolo/datasets/:id
 */
export const updateDataset = async (req, res, next) => {
  try {
    const dataset = await yoloDatasetService.updateDataset(req.params.id, req.body);

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
 * @route DELETE /api/yolo/datasets/:id
 */
export const deleteDataset = async (req, res, next) => {
  try {
    await yoloDatasetService.deleteDataset(req.params.id);

    res.json({
      success: true,
      message: 'Dataset deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Save image with manual labels to dataset
 * @route POST /api/yolo/datasets/:id/images
 */
export const saveImageToDataset = async (req, res, next) => {
  try {
    const { labels, split } = req.body;

    const result = await yoloDatasetService.saveImageToDataset(
      req.file.buffer,
      req.file.originalname,
      req.params.id,
      labels, // Already parsed by Joi
      split,
      'MANUAL',
      req.user?.id
    );

    res.status(201).json({
      success: true,
      message: 'Image saved to dataset successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Save detection result to dataset
 * @route POST /api/yolo/datasets/:id/save-detection
 */
export const saveDetectionToDataset = async (req, res, next) => {
  try {
    const { detection_result, split } = req.body;

    const result = await yoloDatasetService.saveDetectionToDataset(
      req.file.buffer,
      req.file.originalname,
      req.params.id,
      detection_result, // Already parsed by Joi
      split,
      req.user?.id
    );

    res.status(201).json({
      success: true,
      message: 'Detection result saved to dataset successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get dataset statistics
 * @route GET /api/yolo/datasets/:id/stats
 */
export const getDatasetStats = async (req, res, next) => {
  try {
    const stats = await yoloDatasetService.getDatasetStats(req.params.id);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Split dataset into train/val
 * @route POST /api/yolo/datasets/:id/split
 */
export const splitDataset = async (req, res, next) => {
  try {
    const valRatio = req.body.valRatio || 0.2;
    const result = await yoloDatasetService.splitDatasetIfNeeded(req.params.id, valRatio);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Start training
 * @route POST /api/yolo/datasets/:id/train
 */
export const startTraining = async (req, res, next) => {
  try {
    const config = {
      baseModel: req.body.base_model,
      epochs: req.body.epochs,
      batchSize: req.body.batch_size,
      imageSize: req.body.image_size
    };

    const trainRun = await yoloDatasetService.startTraining(
      req.params.id,
      config,
      req.user?.id
    );

    res.status(202).json({
      success: true,
      message: 'Training started in background',
      data: trainRun
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get training runs
 * @route GET /api/yolo/training-runs
 */
export const getTrainingRuns = async (req, res, next) => {
  try {
    const result = await yoloDatasetService.getTrainingRuns(req.queryParams);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get training run by ID
 * @route GET /api/yolo/training-runs/:id
 */
export const getTrainingRunById = async (req, res, next) => {
  try {
    const run = await yoloDatasetService.getTrainingRunById(req.params.id);

    res.json({
      success: true,
      data: run
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all classes
 * @route GET /api/yolo/classes
 */
export const getClasses = async (req, res, next) => {
  try {
    const classes = await yoloDatasetService.getClasses(req.query.active_only);

    res.json({
      success: true,
      data: classes
    });
  } catch (error) {
    next(error);
  }
};

