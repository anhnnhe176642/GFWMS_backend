import { 
  uploadImageToCloudinary, 
  uploadMultipleImagesToCloudinary,
  deleteMultipleImagesFromCloudinary
} from '../utils/cloudinary.js';

/**
 * Service for handling file uploads with Cloudinary
 * Provides reusable functions for different upload scenarios
 */

/**
 * Upload single image with automatic cleanup
 * @param {Object} file - Multer file object with buffer
 * @param {Object} options - Upload options
 * @param {string} options.folder - Cloudinary folder
 * @param {string} options.preset - Transformation preset
 * @param {string} options.oldPublicId - Old public ID to delete
 * @param {string} options.fieldName - Field name for errors
 * @returns {Promise<Object>} - { url, publicId }
 */
export const uploadSingleImage = async (file, options = {}) => {
  if (!file || !file.buffer) {
    return null;
  }

  const {
    folder = 'uploads',
    preset = 'avatar',
    oldPublicId,
    fieldName = 'file'
  } = options;

  const result = await uploadImageToCloudinary(file.buffer, {
    folder,
    oldPublicId,
    preset,
    fieldName
  });

  return {
    url: result.secure_url,
    publicId: result.public_id
  };
};

/**
 * Upload multiple images with automatic cleanup
 * @param {Array<Object>} files - Array of Multer file objects
 * @param {Object} options - Upload options
 * @param {Array<string>} options.oldPublicIds - Old public IDs to delete
 * @returns {Promise<Array<Object>>} - Array of { url, publicId }
 */
export const uploadMultipleImages = async (files, options = {}) => {
  if (!files || files.length === 0) {
    return [];
  }

  const {
    folder = 'uploads',
    preset = 'product',
    oldPublicIds = [],
    fieldName = 'files'
  } = options;

  // Delete old images asynchronously
  if (oldPublicIds.length > 0) {
    deleteMultipleImagesFromCloudinary(oldPublicIds).catch(err => {
      console.error('Failed to delete old images:', err);
    });
  }

  const buffers = files.map(file => file.buffer);
  const results = await uploadMultipleImagesToCloudinary(buffers, {
    folder,
    preset,
    fieldName
  });

  return results.map(result => ({
    url: result.secure_url,
    publicId: result.public_id
  }));
};
