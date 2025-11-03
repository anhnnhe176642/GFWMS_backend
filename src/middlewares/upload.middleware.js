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
 * Create multer upload middleware with custom options
 * @param {Object} options - Upload options
 * @param {string} options.fieldName - Name of the field (default: 'file')
 * @param {number} options.maxSize - Max file size in MB (default: 5)
 * @param {boolean} options.multiple - Allow multiple files (default: false)
 * @param {number} options.maxCount - Max number of files if multiple (default: 10)
 * @returns {Function} Multer middleware
 */
export const createUploadMiddleware = (options = {}) => {
  const {
    fieldName = 'file',
    maxSize = 5,
    multiple = false,
    maxCount = 10
  } = options;

  const upload = multer({
    storage: storage,
    fileFilter: createImageFileFilter(fieldName),
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

// Legacy export for backward compatibility
export const handleUploadError = handleAvatarUploadError;
