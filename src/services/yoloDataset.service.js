import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { AppError } from '../utils/errors.js';
import yoloDatasetRepository from '../repositories/yoloDataset.repository.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class YOLODatasetService {
  constructor() {
    this.datasetManagerScript = path.join(__dirname, '../python/dataset_manager.py');
    this.trainerScript = path.join(__dirname, '../python/yolo_trainer.py');
    this.tempDir = path.join(process.cwd(), 'temp', 'uploads');
    this.datasetsDir = path.join(__dirname, '../python/datasets');
  }

  /**
   * Save temporary image file
   */
  async saveTemporaryFile(buffer, originalName) {
    await fs.mkdir(this.tempDir, { recursive: true });
    
    const timestamp = Date.now();
    const ext = path.extname(originalName);
    const filename = `dataset_${timestamp}${ext}`;
    const filePath = path.join(this.tempDir, filename);
    
    await fs.writeFile(filePath, buffer);
    return filePath;
  }

  /**
   * Delete temporary file
   */
  async deleteTemporaryFile(filePath) {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Failed to delete temporary file:', error);
    }
  }

  /**
   * Create new dataset
   */
  async createDataset(data) {
    return yoloDatasetRepository.createDataset(data);
  }

  /**
   * Get datasets with pagination
   */
  async getDatasets(queryParams) {
    return yoloDatasetRepository.findDatasets(queryParams);
  }

  /**
   * Get dataset by ID
   */
  async getDatasetById(id) {
    const dataset = await yoloDatasetRepository.findDatasetById(id);
    if (!dataset) {
      throw new AppError('Dataset not found', 404);
    }
    return dataset;
  }

  /**
   * Update dataset
   */
  async updateDataset(id, data) {
    await this.getDatasetById(id); // Check exists
    return yoloDatasetRepository.updateDataset(id, data);
  }

  /**
   * Delete dataset
   */
  async deleteDataset(id) {
    await this.getDatasetById(id); // Check exists
    return yoloDatasetRepository.deleteDataset(id);
  }

  /**
   * Save image with labels to dataset
   */
  async saveImageToDataset(imageBuffer, originalName, datasetId, labels, split, sourceType, uploadedBy) {
    let tempFilePath = null;

    try {
      // Verify dataset exists
      await this.getDatasetById(datasetId);

      // Save temporary file
      tempFilePath = await this.saveTemporaryFile(imageBuffer, originalName);

      // Call Python script to save in YOLO format
      const labelsJson = JSON.stringify(labels);
      const imageId = `img_${Date.now()}`;
      
      const result = await this.executePythonScript(
        this.datasetManagerScript,
        ['save_image', tempFilePath, labelsJson, split, imageId]
      );

      if (!result.success) {
        throw new AppError(`Failed to save dataset: ${result.error}`, 500);
      }

      // Get image info from result
      const imageInfo = await this.getImageInfo(tempFilePath);

      // Save to database
      const imageData = {
        datasetId: parseInt(datasetId),
        imagePath: result.image_path,
        width: result.image_size.width,
        height: result.image_size.height,
        split: split.toUpperCase(),
        sourceType: sourceType || 'MANUAL',
        uploadedBy,
        originalName,
        fileSize: imageInfo.size
      };

      const labelsData = labels.map(label => ({
        classId: label.class_id,
        className: label.class_name,
        centerX: label.center_x,
        centerY: label.center_y,
        width: label.width,
        height: label.height,
        confidence: label.confidence,
        verified: label.verified || false
      }));

      // Ensure classes exist
      for (const label of labels) {
        await yoloDatasetRepository.findOrCreateClass(label.class_id, label.class_name);
      }

      // Create image with labels in transaction
      const savedImage = await yoloDatasetRepository.createImageWithLabels(imageData, labelsData);

      // Clean up temp file
      await this.deleteTemporaryFile(tempFilePath);

      return {
        image: savedImage,
        dataset_info: result
      };

    } catch (error) {
      if (tempFilePath) {
        await this.deleteTemporaryFile(tempFilePath);
      }
      throw error;
    }
  }

  /**
   * Save detection result to dataset
   */
  async saveDetectionToDataset(imageBuffer, originalName, datasetId, detectionResult, split, uploadedBy) {
    let tempFilePath = null;

    try {
      // Verify dataset exists
      await this.getDatasetById(datasetId);

      // Save temporary file
      tempFilePath = await this.saveTemporaryFile(imageBuffer, originalName);

      // Call Python script to save detection result
      const detectionJson = JSON.stringify(detectionResult);
      const imageId = `detect_${Date.now()}`;
      
      const result = await this.executePythonScript(
        this.datasetManagerScript,
        ['save_detection', tempFilePath, detectionJson, split, imageId]
      );

      if (!result.success) {
        throw new AppError(`Failed to save detection: ${result.error}`, 500);
      }

      // Extract labels from detection
      const labels = detectionResult.detections.map(det => ({
        class_id: det.class_id,
        class_name: det.class_name,
        center_x: (det.bbox.x1 + det.bbox.x2) / 2 / detectionResult.image_info.width,
        center_y: (det.bbox.y1 + det.bbox.y2) / 2 / detectionResult.image_info.height,
        width: (det.bbox.x2 - det.bbox.x1) / detectionResult.image_info.width,
        height: (det.bbox.y2 - det.bbox.y1) / detectionResult.image_info.height,
        confidence: det.confidence,
        verified: false
      }));

      // Get image info
      const imageInfo = await this.getImageInfo(tempFilePath);

      // Save to database
      const imageData = {
        datasetId: parseInt(datasetId),
        imagePath: result.image_path,
        width: result.image_size.width,
        height: result.image_size.height,
        split: split.toUpperCase(),
        sourceType: 'DETECTION',
        uploadedBy,
        originalName,
        fileSize: imageInfo.size
      };

      const labelsData = labels.map(label => ({
        classId: label.class_id,
        className: label.class_name,
        centerX: label.center_x,
        centerY: label.center_y,
        width: label.width,
        height: label.height,
        confidence: label.confidence,
        verified: false
      }));

      // Ensure classes exist
      for (const det of detectionResult.detections) {
        await yoloDatasetRepository.findOrCreateClass(det.class_id, det.class_name);
      }

      // Create image with labels
      const savedImage = await yoloDatasetRepository.createImageWithLabels(imageData, labelsData);

      // Clean up temp file
      await this.deleteTemporaryFile(tempFilePath);

      return {
        image: savedImage,
        dataset_info: result
      };

    } catch (error) {
      if (tempFilePath) {
        await this.deleteTemporaryFile(tempFilePath);
      }
      throw error;
    }
  }

  /**
   * Get dataset statistics
   */
  async getDatasetStats(datasetId) {
    await this.getDatasetById(datasetId); // Check exists

    const result = await this.executePythonScript(
      this.datasetManagerScript,
      ['stats']
    );

    return result;
  }

  /**
   * Split dataset into train/val
   * If validation set is empty but training set has images, split training into train/val
   */
  async splitDatasetIfNeeded(datasetId, valRatio = 0.2) {
    // Verify dataset exists
    await this.getDatasetById(datasetId);
    
    // Get dataset stats to check splits
    const currentStats = await this.getDatasetStats(datasetId);
    
    if (currentStats.stats?.val?.images > 0) {
      // Already has validation images
      return { message: 'Dataset already has validation images, no split needed' };
    }

    if (currentStats.stats?.train?.images === 0) {
      throw new AppError('No training images available to split', 400);
    }

    // Call Python script to split train into train/val
    const result = await this.executePythonScript(
      this.datasetManagerScript,
      ['split_dataset', valRatio.toString()]
    );

    if (!result.success) {
      throw new AppError(`Failed to split dataset: ${result.error}`, 500);
    }

    // Update dataset stats
    const updatedStats = await this.getDatasetStats(datasetId);
    if (updatedStats.success) {
      await yoloDatasetRepository.updateDataset(datasetId, {
        trainImages: updatedStats.stats.train.images,
        valImages: updatedStats.stats.val.images,
        testImages: updatedStats.stats.test.images
      });
    }

    return result;
  }

  /**
   * Create data.yaml for training
   */
  async createDataYaml(datasetId) {
    // Verify dataset exists
    await this.getDatasetById(datasetId);
    
    // Get all classes
    const classes = await yoloDatasetRepository.findAllClasses(true);
    const classNames = classes.map(c => c.className);

    const result = await this.executePythonScript(
      this.datasetManagerScript,
      ['create_yaml', JSON.stringify(classNames)]
    );

    if (!result.success) {
      throw new AppError(`Failed to create data.yaml: ${result.error}`, 500);
    }

    return result.yaml_path;
  }

  /**
   * Start training run
   */
  async startTraining(datasetId, config, triggeredBy) {
    const dataset = await this.getDatasetById(datasetId);

    if (dataset.totalImages === 0) {
      throw new AppError('Dataset has no images', 400);
    }

    // Create data.yaml
    const dataYaml = await this.createDataYaml(datasetId);

    // Create training run record
    const trainRun = await yoloDatasetRepository.createTrainRun({
      datasetId: parseInt(datasetId),
      baseModel: config.baseModel || 'best.pt',
      epochs: config.epochs || 100,
      batchSize: config.batchSize || 16,
      imageSize: config.imageSize || 640,
      triggeredBy
    });

    // Start training in background (don't await)
    this.executeTraining(trainRun.id, dataYaml, config).catch(err => {
      console.error('Training failed:', err);
    });

    return trainRun;
  }

  /**
   * Execute training (background process)
   */
  async executeTraining(trainRunId, dataYaml, config) {
    try {
      // Update status to RUNNING
      await yoloDatasetRepository.updateTrainRun(trainRunId, {
        status: 'RUNNING',
        startedAt: new Date()
      });

      // Call training script
      const result = await this.executePythonScript(
        this.trainerScript,
        [
          'train',
          dataYaml,
          config.baseModel || 'best.pt',
          (config.epochs || 100).toString(),
          (config.batchSize || 16).toString(),
          (config.imageSize || 640).toString()
        ],
        600000 // 10 minutes timeout
      );

      if (!result.success) {
        throw new Error(result.error);
      }

      // Update training run with results
      await yoloDatasetRepository.updateTrainRun(trainRunId, {
        status: 'COMPLETED',
        completedAt: new Date(),
        modelPath: result.models.best,
        mapScore: result.metrics.map50_95,
        precision: result.metrics.precision,
        recall: result.metrics.recall,
        logPath: result.run_directory
      });

    } catch (error) {
      // Update status to FAILED
      await yoloDatasetRepository.updateTrainRun(trainRunId, {
        status: 'FAILED',
        completedAt: new Date(),
        errorMsg: error.message
      });
    }
  }

  /**
   * Get training runs
   */
  async getTrainingRuns(queryParams) {
    return yoloDatasetRepository.findTrainRuns(queryParams);
  }

  /**
   * Get training run by ID
   */
  async getTrainingRunById(id) {
    const run = await yoloDatasetRepository.findTrainRunById(id);
    if (!run) {
      throw new AppError('Training run not found', 404);
    }
    return run;
  }

  /**
   * Get all classes
   */
  async getClasses(activeOnly = true) {
    return yoloDatasetRepository.findAllClasses(activeOnly);
  }

  /**
   * Execute Python script
   */
  async executePythonScript(scriptPath, args = [], timeout = 300000) {
    return new Promise((resolve, reject) => {
      const python = spawn('python', [scriptPath, ...args], {
        timeout,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      python.on('error', (err) => {
        reject(new AppError(`Failed to start Python process: ${err.message}`, 500));
      });

      python.on('close', (code) => {
        if (code !== 0) {
          return reject(new AppError(`Python script exited with code ${code}: ${stderr}`, 500));
        }

        try {
          const result = JSON.parse(stdout.trim());
          resolve(result);
        } catch (parseErr) {
          return reject(new AppError(`Failed to parse script output: ${parseErr.message}`, 500));
        }
      });
    });
  }

  /**
   * Get image file info
   */
  async getImageInfo(filePath) {
    const stats = await fs.stat(filePath);
    return {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime
    };
  }
}

export default new YOLODatasetService();

