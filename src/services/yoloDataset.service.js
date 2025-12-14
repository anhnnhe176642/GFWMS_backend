import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';
import archiver from 'archiver';
import extractZip from 'extract-zip';
import yoloDatasetRepository from '../repositories/yoloDataset.repository.js';
import { NotFoundError, ValidationError, InternalServerError } from '../utils/errors.js';
import { withPrismaErrorHandling } from '../utils/prisma-error-handler.js';
import { 
  getImageDimensions,
  saveDatasetImage,
  pixelAnnotationsToYoloString,
  parseYoloFormat,
  buildClassIdMapping,
  remapDetectionsToAnnotations
} from '../utils/yolo-format.js';

class YoloDatasetService {
  constructor() {
    this.datasetsBasePath = path.join(process.cwd(), 'datasets');
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
   * - Allow adding new classes only (merge with existing)
   * - Disallow modifying or deleting existing classes
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

    // Handle classes - only allow adding new ones, not modifying/deleting
    if (data.classes !== undefined) {
      const existingClasses = dataset.classes || [];
      const newClasses = data.classes || [];

      // Check if trying to remove or modify existing classes
      for (const existingClass of existingClasses) {
        if (!newClasses.includes(existingClass)) {
          throw new ValidationError('Không thể xóa hoặc sửa đổi các lớp đã tồn tại. Chỉ được phép thêm lớp mới.');
        }
      }

      // Merge classes - keep existing and add new ones (avoid duplicates)
      const mergedClasses = [...new Set([...existingClasses, ...newClasses])];
      data.classes = mergedClasses;
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
   * Expects detection results in same format as YOLO detect endpoint (optional)
   */
  async addLabeledImage(datasetId, imageFile, detectionData, userId) {
    const dataset = await this.getDatasetById(datasetId); // Verify dataset exists

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

      // Handle detections - they are now optional
      const detections = detectionData?.detections || [];

      // Prepare annotations data (pixel format - store as-is from detection)
      const annotations = detections.map(d => ({
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
        objectCount: detections.length,
        classes: dataset.classes,  //  Use classes from dataset
        annotations,  //  Stored in DB as pixel format
        status: 'PENDING',  // Default status
        uploadedBy: userId || null,
        notes: detectionData?.notes || null
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
    const image = await this.getImageById(imageId);
    
    // If annotations are being updated, recalculate objectCount
    if (data.annotations !== undefined) {
      data.objectCount = Array.isArray(data.annotations) ? data.annotations.length : 0;
    }
    
    const updatedImage = await withPrismaErrorHandling(
      () => yoloDatasetRepository.updateImage(imageId, data),
      {}
    );

    // If status changed to/from COMPLETED, update dataset counters
    if (data.status && data.status !== image.status) {
      await yoloDatasetRepository.updateDatasetCounters(image.datasetId);
    }

    return updatedImage;
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
   * @param {string} datasetId - ID of dataset to export
   * @param {string} outputPath - Path where ZIP file will be saved
   * @param {Array<string>} statusFilter - Optional array of image statuses to include (e.g., ['COMPLETED', 'PROCESSING'])
   */
  async exportDataset(datasetId, outputPath, statusFilter = null) {
    // Verify dataset exists and get full info
    const dataset = await this.getDatasetById(datasetId);
    
    // Get all images in dataset (with optional status filter)
    const images = await yoloDatasetRepository.getAllDatasetImages(datasetId, statusFilter);

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
      for (const image of images) {
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
          totalImages: images.length,
          classes: classNames,
          createdAt: dataset.createdAt,
          updatedAt: dataset.updatedAt
        },
        info: {
          year: new Date().getFullYear(),
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

  /**
   * Import dataset from ZIP file (YOLO format) - Creates a new dataset
   * Expects ZIP structure:
   *  - images/
   *  - labels/
   *  - classes.txt (optional)
   *  - notes.json (optional)
   */
  async importDatasetFromZip(zipFile, datasetName, datasetDescription, userId, imageStatus = 'COMPLETED') {
    console.log('importDatasetFromZip - Starting with datasetName:', datasetName);
    console.log('importDatasetFromZip - ZIP file size:', zipFile.size, 'bytes');
    
    // Validate ZIP file format
    if (!zipFile.buffer || zipFile.buffer.length < 4) {
      throw new ValidationError('Định dạng tệp không hợp lệ: Tệp quá nhỏ hoặc trống');
    }

    // Check ZIP file signature (PK\x03\x04)
    const zipSignature = zipFile.buffer.slice(0, 4);
    if (zipSignature[0] !== 0x50 || zipSignature[1] !== 0x4b || zipSignature[2] !== 0x03 || zipSignature[3] !== 0x04) {
      throw new ValidationError('Định dạng tệp không hợp lệ: Đây không phải là tệp ZIP hợp lệ. Vui lòng tải lên một tệp ZIP.');
    }

    // Validate dataset name doesn't already exist
    const existing = await yoloDatasetRepository.findDatasetByName(datasetName);
    if (existing) {
      throw new ValidationError(`Dataset with name "${datasetName}" already exists`);
    }
    
    // Create temp directory for extraction
    const tempDir = path.join(this.datasetsBasePath, `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    console.log('importDatasetFromZip - tempDir:', tempDir);
    
    await fs.mkdir(tempDir, { recursive: true });

    // Create temp zip file path
    const tempZipPath = path.join(tempDir, 'upload.zip');

    try {
      // Write buffer to temp zip file (stream large files)
      console.log('importDatasetFromZip - Writing ZIP file to disk');
      await fs.writeFile(tempZipPath, zipFile.buffer);
      console.log('importDatasetFromZip - ZIP file written successfully');

      // Extract ZIP file with error handling
      console.log('importDatasetFromZip - Extracting ZIP (this may take a while for large files)');
      try {
        await extractZip(tempZipPath, { dir: tempDir });
        console.log('importDatasetFromZip - ZIP extracted successfully');
      } catch (extractError) {
        throw new ValidationError(`Tệp ZIP không hợp lệ: ${extractError.message}. Vui lòng đảm bảo tệp là tệp lưu trữ ZIP hợp lệ.`);
      }

      // Delete temp zip file after extraction to save space
      try {
        await fs.unlink(tempZipPath);
        console.log('importDatasetFromZip - Temp ZIP file deleted');
      } catch {
        console.warn('Could not delete temp ZIP file');
      }

      // Verify ZIP structure - check if images directory exists
      const imagesDir = path.join(tempDir, 'images');
      try {
        const imagesDirStats = await fs.stat(imagesDir);
        if (!imagesDirStats.isDirectory()) {
          throw new ValidationError('Cấu trúc ZIP không hợp lệ: "images" không phải là thư mục. Vui lòng đảm bảo tệp ZIP của bạn chứa một thư mục "images" có các tệp hình ảnh.');
        }
      } catch (statError) {
        if (statError instanceof ValidationError) {
          throw statError;
        }
        throw new ValidationError('Cấu trúc ZIP không hợp lệ: Thiếu thư mục "images" bắt buộc. Vui lòng đảm bảo tệp ZIP của bạn chứa: \n- images/ (thư mục chứa các tệp hình ảnh)\n- labels/ (tùy chọn, thư mục chứa các tệp nhãn YOLO .txt)\n- classes.txt (tùy chọn, mỗi tên lớp một dòng)');
      }

      // Check if images directory is empty
      const imageFiles = await fs.readdir(imagesDir);
      if (imageFiles.length === 0) {
        throw new ValidationError('Không tìm thấy hình ảnh trong tệp ZIP. Vui lòng đảm bảo thư mục "images" chứa ít nhất một tệp hình ảnh.');
      }
      console.log('importDatasetFromZip - ZIP structure validated, found', imageFiles.length, 'images');

      // Read classes.txt if exists
      const classesPath = path.join(tempDir, 'classes.txt');
      let importedClassesMap = []; // Map old class_id -> new class_id
      let classes = [];
      try {
        const classesContent = await fs.readFile(classesPath, 'utf-8');
        importedClassesMap = classesContent.trim().split('\n').map(c => c.trim()).filter(c => c);
        classes = importedClassesMap; // For new dataset, imported classes become dataset classes
        console.log('importDatasetFromZip - Found classes:', classes);
      } catch {
        console.warn('classes.txt not found in ZIP, creating dataset without predefined classes');
      }

      // Create the new dataset
      console.log('importDatasetFromZip - Creating new dataset in DB');
      await this.ensureDatasetsDirectory();
      const datasetPath = path.join(this.datasetsBasePath, datasetName);

      const datasetData = {
        name: datasetName,
        description: datasetDescription || null,
        datasetPath,
        classes: classes || [],
        status: 'ACTIVE'
      };

      const dataset = await withPrismaErrorHandling(
        () => yoloDatasetRepository.createDataset(datasetData),
        {
          name: 'Dataset name already exists'
        }
      );
      console.log('importDatasetFromZip - Dataset created with id:', dataset.id);

      // Create physical directory structure
      try {
        console.log('importDatasetFromZip - Creating physical directories');
        await fs.mkdir(datasetPath, { recursive: true });
        await fs.mkdir(path.join(datasetPath, 'images'), { recursive: true });
        await fs.mkdir(path.join(datasetPath, 'labels'), { recursive: true });
        
        // Create classes.txt if classes provided
        if (classes.length > 0) {
          const classesFilePath = path.join(datasetPath, 'classes.txt');
          await fs.writeFile(classesFilePath, classes.join('\n'));
        }
        console.log('importDatasetFromZip - Directories created successfully');
      } catch (dirError) {
        console.error('importDatasetFromZip - Directory creation failed:', dirError);
        // Rollback database entry if directory creation fails
        await yoloDatasetRepository.deleteDataset(dataset.id);
        throw new InternalServerError(`Failed to create dataset directories: ${dirError.message}`);
      }

      // Process images and labels from ZIP
      console.log('importDatasetFromZip - Processing images from ZIP');
      const labelsDir = path.join(tempDir, 'labels');

      let importedCount = 0;
      let failedCount = 0;
      const errors = [];

      try {
        const imageFilesInTemp = await fs.readdir(imagesDir);
        console.log('importDatasetFromZip - Found', imageFilesInTemp.length, 'image files');

        for (const imageFile of imageFilesInTemp) {
          try {
            const imagePath = path.join(imagesDir, imageFile);
            const imageBuffer = await fs.readFile(imagePath);
            
            // Get image dimensions
            const dimensions = await getImageDimensions(imageBuffer);

            // Try to find corresponding label file
            const labelFilename = path.parse(imageFile).name + '.txt';
            const labelPath = path.join(labelsDir, labelFilename);
            
            let annotations = [];
            try {
              const labelContent = await fs.readFile(labelPath, 'utf-8');
              // Parse YOLO format to pixel annotations
              const detections = parseYoloFormat(labelContent, dimensions.width, dimensions.height);
              
              // For new dataset import, class_id matches directly to importedClassesMap
              annotations = detections.map(d => ({
                class_id: d.class_id || 0,
                class_name: classes[d.class_id] || 'unknown',
                x1: Math.round(d.bbox[0]),
                y1: Math.round(d.bbox[1]),
                x2: Math.round(d.bbox[0] + d.bbox[2]),
                y2: Math.round(d.bbox[1] + d.bbox[3]),
                confidence: d.confidence || 1.0
              }));
            } catch {
              console.warn(`No label file found for ${imageFile}`);
              // Continue without annotations
            }

            // Save image using existing utility
            const timestamp = Date.now();
            const originalName = path.parse(imageFile).name;
            const ext = path.parse(imageFile).ext;
            const filename = `${originalName}_${timestamp}${ext}`;

            // Check if filename already exists
            const exists = await yoloDatasetRepository.imageExists(dataset.id, filename);
            if (exists) {
              failedCount++;
              errors.push(`${imageFile}: File already exists in dataset`);
              continue;
            }

            const savedImagePath = await saveDatasetImage(imageBuffer, filename, this.datasetsBasePath);

            // Save to database
            const imageData = {
              datasetId: dataset.id,
              filename,
              imagePath: savedImagePath,
              width: dimensions.width,
              height: dimensions.height,
              format: ext.replace('.', ''),
              objectCount: annotations.length,
              classes: classes, // Use classes from imported ZIP
              annotations,
              status: imageStatus || 'COMPLETED', // Use provided status or default to COMPLETED
              uploadedBy: userId || null,
              notes: 'Imported from ZIP'
            };

            await withPrismaErrorHandling(
              () => yoloDatasetRepository.addImage(imageData),
              {
                datasetId_filename: 'Image with this filename already exists in dataset'
              }
            );

            importedCount++;
          } catch (error) {
            failedCount++;
            errors.push(`${imageFile}: ${error.message}`);
            console.error(`Failed to import image ${imageFile}:`, error);
          }
        }
      } catch (error) {
        throw new InternalServerError(`Failed to read images directory: ${error.message}`);
      }

      // Update dataset counters
      console.log('importDatasetFromZip - Updating dataset counters');
      await yoloDatasetRepository.updateDatasetCounters(dataset.id);

      console.log('importDatasetFromZip - Complete. Imported:', importedCount, 'Failed:', failedCount);
      return {
        success: true,
        dataset: {
          id: dataset.id,
          name: dataset.name,
          description: dataset.description,
          classes: dataset.classes,
          totalImages: importedCount
        },
        importedCount,
        failedCount,
        errors,
        message: `Dataset "${datasetName}" created and imported ${importedCount} images${failedCount > 0 ? ` (${failedCount} failed)` : ''}`
      };

    } catch (error) {
      console.error('importDatasetFromZip - Error caught:', error);
      throw error;
    } finally {
      // Clean up temp directory
      console.log('importDatasetFromZip - Cleaning up temp directory:', tempDir);
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
        console.log('importDatasetFromZip - Temp directory cleaned');
      } catch (cleanupError) {
        console.error('Failed to clean up temp directory:', cleanupError);
      }
    }
  }

  /**
   * Import images from ZIP file into existing dataset
   * Expects ZIP structure:
   *  - images/
   *  - labels/
   *  - classes.txt (optional - will merge)
   */
  async importDataset(datasetId, zipFile, userId, imageStatus = 'COMPLETED') {
    // Validate ZIP file format
    if (!zipFile.buffer || zipFile.buffer.length < 4) {
      throw new ValidationError('Định dạng tệp không hợp lệ: Tệp quá nhỏ hoặc trống');
    }

    // Check ZIP file signature (PK\x03\x04)
    const zipSignature = zipFile.buffer.slice(0, 4);
    if (zipSignature[0] !== 0x50 || zipSignature[1] !== 0x4b || zipSignature[2] !== 0x03 || zipSignature[3] !== 0x04) {
      throw new ValidationError('Định dạng tệp không hợp lệ: Đây không phải là tệp ZIP hợp lệ. Vui lòng tải lên một tệp ZIP.');
    }

    const dataset = await this.getDatasetById(datasetId);
    
    // Create temp directory for extraction
    const tempDir = path.join(this.datasetsBasePath, `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    await fs.mkdir(tempDir, { recursive: true });

    try {
      // Extract ZIP file from buffer (multer uses memory storage)
      console.log('importDataset - Writing ZIP buffer to temp file');
      const tempZipPath = path.join(tempDir, 'upload.zip');
      await fs.writeFile(tempZipPath, zipFile.buffer);

      console.log('importDataset - Extracting ZIP');
      try {
        await extractZip(tempZipPath, { dir: tempDir });
        console.log('importDataset - ZIP extracted successfully');
      } catch (extractError) {
        throw new ValidationError(`Tệp ZIP không hợp lệ: ${extractError.message}. Vui lòng đảm bảo tệp là tệp lưu trữ ZIP hợp lệ.`);
      }

      // Verify ZIP structure - check if images directory exists
      const imagesDir = path.join(tempDir, 'images');
      try {
        const imagesDirStats = await fs.stat(imagesDir);
        if (!imagesDirStats.isDirectory()) {
          throw new ValidationError('Cấu trúc ZIP không hợp lệ: "images" không phải là thư mục. Vui lòng đảm bảo tệp ZIP của bạn chứa một thư mục "images" có các tệp hình ảnh.');
        }
      } catch (statError) {
        if (statError instanceof ValidationError) {
          throw statError;
        }
        throw new ValidationError('Cấu trúc ZIP không hợp lệ: Thiếu thư mục "images" bắt buộc. Vui lòng đảm bảo tệp ZIP của bạn chứa: \n- images/ (thư mục chứa các tệp hình ảnh)\n- labels/ (tùy chọn, thư mục chứa các tệp nhãn YOLO .txt)\n- classes.txt (tùy chọn, mỗi tên lớp một dòng)');
      }

      // Check if images directory is empty
      const imageFilesInTemp = await fs.readdir(imagesDir);
      if (imageFilesInTemp.length === 0) {
        throw new ValidationError('Không tìm thấy hình ảnh trong tệp ZIP. Vui lòng đảm bảo thư mục "images" chứa ít nhất một tệp hình ảnh.');
      }
      console.log('importDataset - ZIP structure validated, found', imageFilesInTemp.length, 'images');

      // Read classes.txt if exists
      const classesPath = path.join(tempDir, 'classes.txt');
      let importedClasses = [];
      let classIdMap = {}; // Map: oldClassId -> newClassId
      let mergedClasses = [];
      
      try {
        const classesContent = await fs.readFile(classesPath, 'utf-8');
        importedClasses = classesContent.trim().split('\n').map(c => c.trim()).filter(c => c);
        console.log('importDataset - Found imported classes:', importedClasses);
      } catch {
        console.warn('classes.txt not found in ZIP');
      }

      // Update dataset with new classes (merge) and build mapping
      let updatedDataset = dataset;
      if (importedClasses.length > 0) {
        const existingClasses = dataset.classes || [];
        
        // Use utility function to build class mapping
        const mappingResult = buildClassIdMapping(existingClasses, importedClasses);
        classIdMap = mappingResult.classIdMap;
        mergedClasses = mappingResult.mergedClasses;
        
        updatedDataset = await yoloDatasetRepository.updateDataset(datasetId, { classes: mergedClasses });
        console.log('importDataset - Class ID mapping:', classIdMap);
        console.log('importDataset - Updated classes:', mergedClasses);
      }

      // Process images and labels
      const labelsDir = path.join(tempDir, 'labels');

      let importedCount = 0;
      let failedCount = 0;
      const errors = [];

      try {
        const imageFiles = await fs.readdir(imagesDir);

        for (const imageFile of imageFiles) {
          try {
            const imagePath = path.join(imagesDir, imageFile);
            const imageBuffer = await fs.readFile(imagePath);
            
            // Get image dimensions
            const dimensions = await getImageDimensions(imageBuffer);

            // Try to find corresponding label file
            const labelFilename = path.parse(imageFile).name + '.txt';
            const labelPath = path.join(labelsDir, labelFilename);
            
            let annotations = [];
            try {
              const labelContent = await fs.readFile(labelPath, 'utf-8');
              // Parse YOLO format to pixel annotations
              const detections = parseYoloFormat(labelContent, dimensions.width, dimensions.height);
              
              // Remap class_id based on classIdMap using utility function
              annotations = remapDetectionsToAnnotations(detections, classIdMap, updatedDataset.classes);
            } catch {
              console.warn(`No label file found for ${imageFile}`);
              // Continue without annotations
            }

            // Save image using existing utility
            const timestamp = Date.now();
            const originalName = path.parse(imageFile).name;
            const ext = path.parse(imageFile).ext;
            const filename = `${originalName}_${timestamp}${ext}`;

            // Check if filename already exists
            const exists = await yoloDatasetRepository.imageExists(datasetId, filename);
            if (exists) {
              failedCount++;
              errors.push(`${imageFile}: File already exists in dataset`);
              continue;
            }

            const savedImagePath = await saveDatasetImage(imageBuffer, filename, this.datasetsBasePath);

            // Save to database
            const imageData = {
              datasetId,
              filename,
              imagePath: savedImagePath,
              width: dimensions.width,
              height: dimensions.height,
              format: ext.replace('.', ''),
              objectCount: annotations.length,
              classes: updatedDataset.classes,
              annotations,
              status: imageStatus || 'COMPLETED', // Use provided status or default to COMPLETED
              uploadedBy: userId || null,
              notes: 'Imported from ZIP'
            };

            await withPrismaErrorHandling(
              () => yoloDatasetRepository.addImage(imageData),
              {
                datasetId_filename: 'Image with this filename already exists in dataset'
              }
            );

            importedCount++;
          } catch (error) {
            failedCount++;
            errors.push(`${imageFile}: ${error.message}`);
            console.error(`Failed to import image ${imageFile}:`, error);
          }
        }
      } catch (error) {
        throw new InternalServerError(`Failed to read images directory: ${error.message}`);
      }

      // Update dataset counters
      await yoloDatasetRepository.updateDatasetCounters(datasetId);

      return {
        success: true,
        importedCount,
        failedCount,
        errors,
        message: `Imported ${importedCount} images${failedCount > 0 ? ` (${failedCount} failed)` : ''}`
      };
    } finally {
      // Clean up temp directory
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch (cleanupError) {
        console.error('Failed to clean up temp directory:', cleanupError);
      }
    }
  }
}

export default new YoloDatasetService();
