import multer from 'multer';
import { ValidationError } from '../utils/errors.js';

// Configure multer to use memory storage (no disk write)
const storage = multer.memoryStorage();

/**
 * Create file filter for images
 * @param {string} fieldName - Name of the field (for error messages)
 * @returns {Function} File filter function
 */
const createImageFileFilter = (fieldName = 'file') => {
  return (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ValidationError('Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WEBP)', fieldName), false);
    }
  };
};

/**
 * Create file filter for YOLO model (.pt files)
 * @param {string} fieldName - Name of the field (for error messages)
 * @returns {Function} File filter function
 */
const createModelFileFilter = (fieldName = 'file') => {
  return (req, file, cb) => {
    // Accept .pt files - they may have various mime types
    if (file.originalname.endsWith('.pt') || file.mimetype === 'application/octet-stream') {
      cb(null, true);
    } else {
      cb(new ValidationError('Chỉ chấp nhận file model (.pt)', fieldName), false);
    }
  };
};

/**
 * Create file filter for ZIP files
 * @param {string} fieldName - Name of the field (for error messages)
 * @returns {Function} File filter function
 */
const createZipFileFilter = (fieldName = 'file') => {
  return (req, file, cb) => {
    // Accept .zip files
    if (file.originalname.endsWith('.zip') || file.mimetype === 'application/zip' || file.mimetype === 'application/x-zip-compressed') {
      cb(null, true);
    } else {
      cb(new ValidationError('Chỉ chấp nhận file ZIP (.zip)', fieldName), false);
    }
  };
};

/**
 * Create multer upload middleware with custom options
 * @param {Object} options - Upload options
 * @param {string} options.fieldName - Name of the field (default: 'file')
 * @param {number} options.maxSize - Max file size in MB (default: 5)
 * @param {boolean} options.multiple - Allow multiple files (default: false)
 * @param {number} options.maxCount - Max number of files if multiple (default: 10)
 * @param {string} options.fileType - Type of file: 'image' or 'model' (default: 'image')
 * @returns {Function} Multer middleware
 */
export const createUploadMiddleware = (options = {}) => {
  const {
    fieldName = 'file',
    maxSize = 5,
    multiple = false,
    maxCount = 10,
    fileType = 'image'
  } = options;

  // Select appropriate file filter based on fileType
  const fileFilter = fileType === 'model' 
    ? createModelFileFilter(fieldName)
    : fileType === 'zip'
    ? createZipFileFilter(fieldName)
    : createImageFileFilter(fieldName);

  const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: maxSize * 1024 * 1024 // Convert MB to bytes
    }
  });

  // Return appropriate middleware based on multiple flag
  if (multiple) {
    return upload.array(fieldName, maxCount);
  }
  return upload.single(fieldName);
};

/**
 * Create error handler for multer errors
 * @param {string} fieldName - Name of the field (for error messages)
 * @param {number} maxSize - Max file size in MB (for error messages)
 * @returns {Function} Error handler middleware
 */
export const createUploadErrorHandler = (fieldName = 'file', maxSize = 5) => {
  return (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        console.log(`[UPLOAD DEBUG] File size exceeded. Max: ${maxSize}MB, Error:`, error.limit, error.field, error);
        return next(new ValidationError(`Kích thước file không được vượt quá ${maxSize}MB`, fieldName));
      }
      if (error.code === 'LIMIT_FILE_COUNT') {
        return next(new ValidationError('Số lượng file vượt quá giới hạn cho phép', fieldName));
      }
      if (error.code === 'LIMIT_UNEXPECTED_FILE') {
        return next(new ValidationError('Tên field không đúng hoặc gửi quá nhiều file', fieldName));
      }
      return next(new ValidationError(error.message, fieldName));
    }
    next(error);
  };
};

// ===== PRESET MIDDLEWARES - Sử dụng cho các trường hợp phổ biến =====

// Middleware to handle avatar upload (single file, 5MB max)
export const uploadAvatar = createUploadMiddleware({
  fieldName: 'avatar',
  maxSize: 5,
  multiple: false
});

export const handleAvatarUploadError = createUploadErrorHandler('avatar', 5);

// Middleware to handle category image upload (single file, 10MB max)
export const uploadCategoryImage = createUploadMiddleware({
  fieldName: 'image',
  maxSize: 10,
  multiple: false
});

export const handleCategoryImageUploadError = createUploadErrorHandler('image', 10);

// Middleware to handle product images (multiple files, 10MB each, max 5 files)
export const uploadProductImages = createUploadMiddleware({
  fieldName: 'images',
  maxSize: 10,
  multiple: true,
  maxCount: 5
});

export const handleProductImagesUploadError = createUploadErrorHandler('images', 10);

// Middleware to handle document/attachment (single file, 10MB max)
export const uploadDocument = createUploadMiddleware({
  fieldName: 'document',
  maxSize: 10,
  multiple: false
});

export const handleDocumentUploadError = createUploadErrorHandler('document', 10);

// Middleware to handle ZIP file upload (single file, 1000MB max for large datasets)
export const uploadZipFile = createUploadMiddleware({
  fieldName: 'zipFile',
  maxSize: 1000,
  multiple: false,
  fileType: 'zip'
});

export const handleZipFileUploadError = createUploadErrorHandler('zipFile', 1000);

// Legacy export for backward compatibility
export const handleUploadError = handleAvatarUploadError;

/**
 * Parse multipart form data with nested arrays
 * Converts flat form fields like:
 *   detections[0].class_id = 0
 *   detections[0].class_name = "defect"
 *   detections[0].bbox.x1 = 100
 * Into nested structure:
 *   { detections: [{ class_id: 0, class_name: "defect", bbox: { x1: 100 } }] }
 */
export const parseMultipartFormData = (req, res, next) => {
  if (!req.body) {
    return next();
  }

  const parsed = {};

  // Process each field in request body
  for (const [key, value] of Object.entries(req.body)) {
    // Skip file fields
    if (typeof value === 'object' && value && !Array.isArray(value) && !value.buffer) {
      // Already an object, keep it
      parsed[key] = value;
      continue;
    }

    // Parse array notation: arr[0].field = value
    const arrayMatch = key.match(/^(\w+)\[(\d+)\]\.(.+)$/);
    if (arrayMatch) {
      const [, arrayName, index, fieldPath] = arrayMatch;
      const idx = parseInt(index);

      if (!parsed[arrayName]) {
        parsed[arrayName] = [];
      }

      if (!parsed[arrayName][idx]) {
        parsed[arrayName][idx] = {};
      }

      // Set nested property
      setNestedProperty(parsed[arrayName][idx], fieldPath, value);
    } else {
      parsed[key] = value;
    }
  }

  req.body = parsed;
  next();
};

/**
 * Helper to set nested property
 * setNestedProperty(obj, 'bbox.x1', 100)
 * Results in: obj = { bbox: { x1: 100 } }
 */
function setNestedProperty(obj, path, value) {
  const parts = path.split('.');
  let current = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!current[part]) {
      current[part] = {};
    }
    current = current[part];
  }

  // Convert string numbers to actual numbers where appropriate
  const finalPart = parts[parts.length - 1];
  if (!isNaN(value) && value !== '') {
    current[finalPart] = parseFloat(value);
  } else if (value === 'true') {
    current[finalPart] = true;
  } else if (value === 'false') {
    current[finalPart] = false;
  } else {
    current[finalPart] = value;
  }
}

/**
 * Parse JSON fields from multipart/form-data
 * Converts JSON string fields to objects
 * Useful for handling complex data in multipart requests
 */
export const parseJsonFields = (req, res, next) => {
  if (!req.body) {
    return next();
  }

  // List of field names that should be parsed as JSON
  const jsonFieldNames = ['detections', 'image_info', 'annotations', 'classes', 'data'];

  for (const fieldName of jsonFieldNames) {
    if (fieldName in req.body && typeof req.body[fieldName] === 'string') {
      try {
        req.body[fieldName] = JSON.parse(req.body[fieldName]);
      } catch (error) {
        // If JSON parse fails, keep the string value
        // Validation middleware will catch the error
        console.error(`Error parsing JSON field "${fieldName}":`, error);
      }
    }
  }

  next();
};
