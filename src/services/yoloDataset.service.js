import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';
import archiver from 'archiver';
import { fileURLToPath } from 'url';
import yoloDatasetRepository from '../repositories/yoloDataset.repository.js';
import { NotFoundError, ValidationError, InternalServerError } from '../utils/errors.js';
import { withPrismaErrorHandling } from '../utils/prisma-error-handler.js';
import { 
  getImageDimensions,
  saveDatasetImage,
  pixelAnnotationsToYoloString
} from '../utils/yolo-format.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class YoloDatasetService {
  constructor() {
    this.datasetsBasePath = path.join(__dirname, '../datasets');
  }

  /**
   * Ensure datasets base directory exists
   */
  async ensureDatasetsDirectory() {
    try {
      await fs.access(this.datasetsBasePath);
    } catch {
      await fs.mkdir(this.datasetsBasePath, { recursive: true });
    }
  }

  /**
   * Create new dataset
   */
  async createDataset(data) {
    // Check if dataset name already exists
    const existing = await yoloDatasetRepository.findDatasetByName(data.name);
    if (existing) {
      throw new ValidationError(`Dataset with name "${data.name}" already exists`);
    }

    await this.ensureDatasetsDirectory();

    // Create dataset path
    const datasetPath = path.join(this.datasetsBasePath, data.name);

    const datasetData = {
      name: data.name,
      description: data.description || null,
      version: data.version || '1.0',
      datasetPath,
      classes: data.classes || [],
      status: 'ACTIVE'
    };

    const dataset = await withPrismaErrorHandling(
      () => yoloDatasetRepository.createDataset(datasetData),
      {
        name: 'Dataset name already exists'
      }
    );

    // Create physical directory structure
    try {
      await fs.mkdir(datasetPath, { recursive: true });
      await fs.mkdir(path.join(datasetPath, 'images'), { recursive: true });
      await fs.mkdir(path.join(datasetPath, 'labels'), { recursive: true });
      
      // Create initial classes.txt if classes provided
      if (data.classes && data.classes.length > 0) {
        const classesPath = path.join(datasetPath, 'classes.txt');
        await fs.writeFile(classesPath, data.classes.join('\n'));
      }
    } catch (error) {
      // Rollback database entry if directory creation fails
      await yoloDatasetRepository.deleteDataset(dataset.id);
      throw new InternalServerError(`Failed to create dataset directories: ${error.message}`);
    }

    return dataset;
  }

  /**
   * Get all datasets with pagination
   */
  async getAllDatasets(queryOptions) {
    return await yoloDatasetRepository.findDatasetsWithAdvancedQuery(queryOptions);
  }

  /**
   * Get dataset by ID
   */
  async getDatasetById(datasetId) {
    const dataset = await yoloDatasetRepository.findDatasetById(datasetId);
    if (!dataset) {
      throw new NotFoundError('Dataset not found');
    }
    return dataset;
  }

  /**
   * Update dataset
   */
  async updateDataset(datasetId, data) {
    const dataset = await this.getDatasetById(datasetId);

    // If name is being changed, check for duplicates
    if (data.name && data.name !== dataset.name) {
      const existing = await yoloDatasetRepository.findDatasetByName(data.name);
      if (existing) {
        throw new ValidationError(`Dataset with name "${data.name}" already exists`);
      }
    }

    return await withPrismaErrorHandling(
      () => yoloDatasetRepository.updateDataset(datasetId, data),
      {
        name: 'Dataset name already exists'
      }
    );
  }

  /**
   * Delete dataset
   */
  async deleteDataset(datasetId) {
    const dataset = await this.getDatasetById(datasetId);

    // Delete physical files
    try {
      await fs.rm(dataset.datasetPath, { recursive: true, force: true });
    } catch (error) {
      console.error(`Failed to delete dataset files: ${error.message}`);
      // Continue with database deletion even if file deletion fails
    }

    return await yoloDatasetRepository.deleteDataset(datasetId);
  }

  /**
   * Add labeled image to dataset
   * Expects detection results in same format as YOLO detect endpoint
   */
  async addLabeledImage(datasetId, imageFile, detectionData, userId) {
    await this.getDatasetById(datasetId); // Verify dataset exists

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = path.parse(imageFile.originalname).name;
    const ext = path.parse(imageFile.originalname).ext;
    const filename = `${originalName}_${timestamp}${ext}`;

    // Check if filename already exists
    const exists = await yoloDatasetRepository.imageExists(datasetId, filename);
    if (exists) {
      throw new ValidationError('An image with this filename already exists in the dataset');
    }

    try {
      // Get image dimensions
      const dimensions = await getImageDimensions(imageFile.buffer);
      
      // Save image file
      const imagePath = await saveDatasetImage(
        imageFile.buffer,
        filename,
        this.datasetsBasePath
      );

      // Extract unique class names from detections
      const classNames = [...new Set(
        detectionData.detections.map(d => d.class_name || 'unknown')
      )];

      // Prepare annotations data (pixel format - store as-is from detection)
      const annotations = detectionData.detections.map(d => ({
        class_id: d.class_id || 0,
        class_name: d.class_name || 'unknown',
        x1: Math.round(d.bbox.x1),
        y1: Math.round(d.bbox.y1),
        x2: Math.round(d.bbox.x2),
        y2: Math.round(d.bbox.y2),
        confidence: d.confidence || 1.0
      }));

      // Save to database (annotations stored in DB as pixel format)
      const imageData = {
        datasetId,
        filename,
        imagePath,
        width: dimensions.width,
        height: dimensions.height,
        format: ext.replace('.', ''),
        objectCount: detectionData.detections.length,
        classes: classNames,  // ← Store class NAMES not IDs
        annotations,  // ← Stored in DB as pixel format
        uploadedBy: userId || null,
        notes: detectionData.notes || null
      };

      const savedImage = await withPrismaErrorHandling(
        () => yoloDatasetRepository.addImage(imageData),
        {
          datasetId_filename: 'Image with this filename already exists in dataset'
        }
      );

      // Update dataset counters
      await yoloDatasetRepository.updateDatasetCounters(datasetId);

      return savedImage;

    } catch (error) {
      // Clean up image file on error
      try {
        const imagePath = path.join(this.datasetsBasePath, 'images', filename);
        await fs.unlink(imagePath).catch(() => {});
      } catch {
        // Ignore cleanup errors
      }
      throw error;
    }
  }

  /**
   * Get images in dataset
   */
  async getDatasetImages(datasetId, queryOptions) {
    await this.getDatasetById(datasetId); // Verify dataset exists
    return await yoloDatasetRepository.getDatasetImages(datasetId, queryOptions);
  }

  /**
   * Get dataset image by ID
   */
  async getImageById(imageId) {
    const image = await yoloDatasetRepository.findImageById(imageId);
    if (!image) {
      throw new NotFoundError('Image not found');
    }
    return image;
  }

  /**
   * Update image annotations
   */
  async updateImage(imageId, data) {
    await this.getImageById(imageId);
    
    return await withPrismaErrorHandling(
      () => yoloDatasetRepository.updateImage(imageId, data),
      {}
    );
  }

  /**
   * Delete image from dataset
   */
  async deleteImage(imageId) {
    const image = await this.getImageById(imageId);

    // Delete physical image file
    const imagePath = path.join(this.datasetsBasePath, image.imagePath);

    try {
      await fs.unlink(imagePath);
    } catch (error) {
      console.error(`Failed to delete image file: ${error.message}`);
    }

    // Delete from database (annotations stored in DB, no label file to delete)
    const deleted = await yoloDatasetRepository.deleteImage(imageId);

    // Update dataset counters
    await yoloDatasetRepository.updateDatasetCounters(image.datasetId);

    return deleted;
  }

  /**
   * Export dataset as ZIP file (YOLO format)
   * Generates .txt label files from annotations stored in DB
   */
  async exportDataset(datasetId, outputPath) {
    // Verify dataset exists and get full info
    const dataset = await this.getDatasetById(datasetId);
    
    // Get all images in dataset
    const images = await yoloDatasetRepository.getDatasetImages(datasetId, { limit: 10000 });

    return new Promise((resolve, reject) => {
      const output = fsSync.createWriteStream(outputPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => {
        resolve({
          success: true,
          path: outputPath,
          size: archive.pointer()
        });
      });

      archive.on('error', (err) => {
        reject(new InternalServerError(`Failed to create ZIP: ${err.message}`));
      });

      archive.pipe(output);

      // Add classes.txt
      const classNames = dataset.classes || [];
      const classesContent = classNames.join('\n');
      archive.append(classesContent, { name: 'classes.txt' });

      // Add images and labels
      for (const image of images.data) {
        try {
          const imagePath = path.join(this.datasetsBasePath, image.imagePath);
          const imageBuffer = fsSync.readFileSync(imagePath);
          archive.append(imageBuffer, { name: `images/${image.filename}` });

          // Generate and add label file from pixel annotations (convert to YOLO format)
          const labelContent = pixelAnnotationsToYoloString(
            image.annotations || [],
            image.width,
            image.height
          );
          const labelFilename = path.parse(image.filename).name + '.txt';
          archive.append(labelContent, { name: `labels/${labelFilename}` });
        } catch (error) {
          console.error(`Failed to add image to ZIP: ${error.message}`);
        }
      }

      // Add notes.json with dataset metadata
      const notesData = {
        dataset: {
          name: dataset.name,
          description: dataset.description || '',
          version: dataset.version || '1.0',
          totalImages: images.data.length,
          classes: classNames,
          createdAt: dataset.createdAt,
          updatedAt: dataset.updatedAt
        },
        info: {
          year: new Date().getFullYear(),
          version: dataset.version || '1.0',
          description: 'YOLO format dataset exported from GFWMS',
          contributor: 'GFWMS Backend'
        },
        categories: classNames.map((name, index) => ({
          id: index,
          name
        }))
      };
      archive.append(JSON.stringify(notesData, null, 2), { name: 'notes.json' });

      archive.finalize();
    });
  }

  /**
   * Get dataset statistics
   */
  async getDatasetStats(datasetId) {
    await this.getDatasetById(datasetId);
    return await yoloDatasetRepository.getDatasetStats(datasetId);
  }
}

export default new YoloDatasetService();
