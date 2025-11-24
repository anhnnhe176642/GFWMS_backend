import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

/**
 * Convert detection results to YOLO format
 * @param {Array} detections - Array of detection objects with bbox and class
 * @param {number} imageWidth - Original image width
 * @param {number} imageHeight - Original image height
 * @returns {string} YOLO format label content
 */
function convertToYoloFormat(detections, imageWidth, imageHeight) {
  return detections
    .map((detection) => {
      const { bbox, class_id: classId } = detection;
      
      // bbox format: [x, y, width, height] (pixel coordinates)
      const [x, y, width, height] = bbox;
      
      // Convert to YOLO format (normalized center coordinates)
      const xCenter = (x + width / 2) / imageWidth;
      const yCenter = (y + height / 2) / imageHeight;
      const normWidth = width / imageWidth;
      const normHeight = height / imageHeight;
      
      // YOLO format: <class_id> <x_center> <y_center> <width> <height>
      const finalClassId = classId !== undefined ? classId : 0;
      
      return `${finalClassId} ${xCenter.toFixed(6)} ${yCenter.toFixed(6)} ${normWidth.toFixed(6)} ${normHeight.toFixed(6)}`;
    })
    .join('\n');
}

/**
 * Parse YOLO format label file
 * @param {string} labelContent - Content of YOLO label file
 * @param {number} imageWidth - Original image width
 * @param {number} imageHeight - Original image height
 * @returns {Array} Array of detection objects
 */
function parseYoloFormat(labelContent, imageWidth, imageHeight) {
  const lines = labelContent.trim().split('\n').filter(line => line.trim());
  
  return lines.map((line) => {
    const [classId, xCenter, yCenter, width, height] = line.split(' ').map(Number);
    
    // Convert from normalized YOLO format to pixel coordinates
    const x = (xCenter - width / 2) * imageWidth;
    const y = (yCenter - height / 2) * imageHeight;
    const w = width * imageWidth;
    const h = height * imageHeight;
    
    return {
      class_id: classId,
      bbox: [x, y, w, h],
      confidence: 1.0, // Default confidence for labeled data
    };
  });
}

/**
 * Get image dimensions from buffer
 * @param {Buffer} imageBuffer - Image buffer
 * @returns {Promise<{width: number, height: number}>}
 */
async function getImageDimensions(imageBuffer) {
  // Use sharp for getting image dimensions
  try {
    const metadata = await sharp(imageBuffer).metadata();
    return { width: metadata.width, height: metadata.height };
  } catch (error) {
    throw new Error(`Failed to get image dimensions: ${error.message}`);
  }
}

/**
 * Validate YOLO label format
 * @param {string} labelContent - Content of label file
 * @returns {boolean} True if valid
 */
function validateYoloLabel(labelContent) {
  const lines = labelContent.trim().split('\n').filter(line => line.trim());
  
  for (const line of lines) {
    const parts = line.split(' ');
    if (parts.length !== 5) return false;
    
    const values = parts.map(Number);
    if (values.some(isNaN)) return false;
    
    const [classId, xCenter, yCenter, width, height] = values;
    
    // Validate ranges
    if (classId < 0 || !Number.isInteger(classId)) return false;
    if (xCenter < 0 || xCenter > 1) return false;
    if (yCenter < 0 || yCenter > 1) return false;
    if (width < 0 || width > 1) return false;
    if (height < 0 || height > 1) return false;
  }
  
  return true;
}

/**
 * Save image to datasets folder
 * @param {Buffer} imageBuffer - Image buffer
 * @param {string} filename - Target filename
 * @param {string} datasetsPath - Base datasets path
 * @returns {Promise<string>} Relative path to saved image
 */
async function saveDatasetImage(imageBuffer, filename, datasetsPath) {
  const imagesDir = path.join(datasetsPath, 'images');
  await fs.mkdir(imagesDir, { recursive: true });
  
  const imagePath = path.join(imagesDir, filename);
  await fs.writeFile(imagePath, imageBuffer);
  
  return path.join('images', filename);
}

/**
 * Convert YOLO format string to annotations array
 * @param {string} yoloContent - YOLO format label content
 * @returns {Array} Array of annotations objects
 */
function yoloStringToAnnotations(yoloContent) {
  const lines = yoloContent.trim().split('\n').filter(line => line.trim());
  
  return lines.map((line) => {
    const [classId, xCenter, yCenter, width, height] = line.split(' ').map(Number);
    
    return {
      class_id: classId,
      class_name: 'unknown',
      x_center: xCenter,
      y_center: yCenter,
      width,
      height,
      confidence: 1.0
    };
  });
}

/**
 * Convert pixel format annotations to YOLO format string
 * @param {Array} annotations - Array of annotations with pixel coordinates {class_id, x1, y1, x2, y2}
 * @param {number} imageWidth - Image width in pixels
 * @param {number} imageHeight - Image height in pixels
 * @returns {string} YOLO format label content
 */
function pixelAnnotationsToYoloString(annotations, imageWidth, imageHeight) {
  return annotations
    .map(ann => {
      // Convert from bbox format (x1, y1, x2, y2) to center + dimensions
      const x1 = ann.x1;
      const y1 = ann.y1;
      const x2 = ann.x2;
      const y2 = ann.y2;
      
      const boxWidth = x2 - x1;
      const boxHeight = y2 - y1;
      const xCenter = (x1 + boxWidth / 2) / imageWidth;
      const yCenter = (y1 + boxHeight / 2) / imageHeight;
      const normWidth = boxWidth / imageWidth;
      const normHeight = boxHeight / imageHeight;
      
      return `${ann.class_id} ${xCenter.toFixed(6)} ${yCenter.toFixed(6)} ${normWidth.toFixed(6)} ${normHeight.toFixed(6)}`;
    })
    .join('\n');
}

/**
 * Convert annotations array to YOLO format string
 * @param {Array} annotations - Array of annotations objects
 * @returns {string} YOLO format label content
 */
function annotationsToYoloString(annotations) {
  return annotations
    .map(ann => {
      const xCenter = ann.x_center || ann.bbox[0];
      const yCenter = ann.y_center || ann.bbox[1];
      const width = ann.width || ann.bbox[2];
      const height = ann.height || ann.bbox[3];
      
      return `${ann.class_id} ${xCenter.toFixed(6)} ${yCenter.toFixed(6)} ${width.toFixed(6)} ${height.toFixed(6)}`;
    })
    .join('\n');
}

/**
 * Read dataset files (image and label)
 * @param {string} imagePath - Relative path to image
 * @param {string} labelPath - Relative path to label
 * @param {string} datasetsPath - Base datasets path
 * @returns {Promise<{imageBuffer: Buffer, labelContent: string}>}
 */
async function readDatasetFiles(imagePath, labelPath, datasetsPath) {
  const fullImagePath = path.join(datasetsPath, imagePath);
  const fullLabelPath = path.join(datasetsPath, labelPath);
  
  const [imageBuffer, labelContent] = await Promise.all([
    fs.readFile(fullImagePath),
    fs.readFile(fullLabelPath, 'utf-8'),
  ]);
  
  return { imageBuffer, labelContent };
}

/**
 * Delete dataset files
 * @param {string} imagePath - Relative path to image
 * @param {string} labelPath - Relative path to label
 * @param {string} datasetsPath - Base datasets path
 */
async function deleteDatasetFiles(imagePath, labelPath, datasetsPath) {
  const fullImagePath = path.join(datasetsPath, imagePath);
  const fullLabelPath = path.join(datasetsPath, labelPath);
  
  await Promise.all([
    fs.unlink(fullImagePath).catch(() => {}), // Ignore errors if file doesn't exist
    fs.unlink(fullLabelPath).catch(() => {}),
  ]);
}

/**
 * Build class ID mapping when importing classes into existing dataset
 * Maps old class IDs (from imported dataset) to new class IDs (in merged dataset)
 * 
 * @param {Array<string>} existingClasses - Current classes in dataset
 * @param {Array<string>} importedClasses - Classes from imported dataset
 * @returns {Object} classIdMap - Mapping {oldClassId: newClassId}, and updated existingClasses array
 * 
 * @example
 * const existing = ['cat', 'dog'];
 * const imported = ['dog', 'bird', 'fish'];
 * const result = buildClassIdMapping(existing, imported);
 * // result = {
 * //   classIdMap: { 0: 1, 1: 2, 2: 3 }, // dog@0->1, bird@1->2, fish@2->3
 * //   mergedClasses: ['cat', 'dog', 'bird', 'fish']
 * // }
 */
function buildClassIdMapping(existingClasses, importedClasses) {
  const classIdMap = {};
  const mergedClasses = [...existingClasses]; // Make a copy
  
  for (let oldId = 0; oldId < importedClasses.length; oldId++) {
    const className = importedClasses[oldId];
    let newId = mergedClasses.indexOf(className);
    
    if (newId === -1) {
      // Class doesn't exist, add it to the end
      newId = mergedClasses.length;
      mergedClasses.push(className);
    }
    
    classIdMap[oldId] = newId;
  }
  
  return { classIdMap, mergedClasses };
}

/**
 * Remap detection class IDs and convert to pixel annotations
 * Used when importing YOLO labels - remaps class IDs based on classIdMap
 * 
 * @param {Array} detections - Detections from parseYoloFormat (with class_id, bbox)
 * @param {Object} classIdMap - Mapping {oldClassId: newClassId}
 * @param {Array<string>} classNames - Array of class names for ID lookup
 * @returns {Array} Array of remapped annotations in pixel format
 * 
 * @example
 * const detections = [
 *   { class_id: 0, bbox: [10, 20, 100, 150] },
 *   { class_id: 2, bbox: [200, 250, 350, 400] }
 * ];
 * const classIdMap = { 0: 1, 2: 3 };
 * const classNames = ['old_0', 'dog', 'old_2', 'bird'];
 * const result = remapDetectionsToAnnotations(detections, classIdMap, classNames);
 * // Returns annotations with remapped class_id and pixel coordinates
 */
function remapDetectionsToAnnotations(detections, classIdMap, classNames) {
  return detections.map(d => {
    const oldClassId = d.class_id || 0;
    const newClassId = classIdMap[oldClassId] !== undefined ? classIdMap[oldClassId] : oldClassId;
    
    return {
      class_id: newClassId,
      class_name: classNames?.[newClassId] || 'unknown',
      x1: Math.round(d.bbox[0]),
      y1: Math.round(d.bbox[1]),
      x2: Math.round(d.bbox[0] + d.bbox[2]),
      y2: Math.round(d.bbox[1] + d.bbox[3]),
      confidence: d.confidence || 1.0
    };
  });
}

export {
  convertToYoloFormat,
  parseYoloFormat,
  getImageDimensions,
  validateYoloLabel,
  saveDatasetImage,
  readDatasetFiles,
  deleteDatasetFiles,
  yoloStringToAnnotations,
  annotationsToYoloString,
  pixelAnnotationsToYoloString,
  buildClassIdMapping,
  remapDetectionsToAnnotations,
};
