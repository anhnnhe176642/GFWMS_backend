import cloudinary from '../config/cloudinary.js';
import { ValidationError } from './errors.js';

/**
 * Default transformation presets for different use cases
 */
export const TRANSFORMATION_PRESETS = {
  avatar: [
    { width: 500, height: 500, crop: 'limit' },
    { quality: 'auto' },
    { fetch_format: 'auto' }
  ],
  product: [
    { width: 1200, height: 1200, crop: 'limit' },
    { quality: 'auto:good' },
    { fetch_format: 'auto' }
  ],
  thumbnail: [
    { width: 200, height: 200, crop: 'fill', gravity: 'auto' },
    { quality: 'auto:low' },
    { fetch_format: 'auto' }
  ],
  banner: [
    { width: 1920, height: 600, crop: 'fill' },
    { quality: 'auto:best' },
    { fetch_format: 'auto' }
  ],
  document: [
    { quality: 'auto' },
    { fetch_format: 'auto' }
  ]
};

/**
 * Upload image buffer to Cloudinary
 * @param {Buffer} buffer - Image buffer from multer
 * @param {Object} options - Upload options
 * @param {string} options.folder - Cloudinary folder path (default: 'uploads')
 * @param {string} options.publicId - Custom public ID (optional, auto-generated if not provided)
 * @param {string} options.oldPublicId - Old public ID to delete after successful upload (optional)
 * @param {Array} options.transformation - Custom transformation array (optional, uses preset if not provided)
 * @param {string} options.preset - Transformation preset name ('avatar', 'product', 'thumbnail', 'banner', 'document')
 * @param {string} options.fieldName - Field name for error messages (default: 'file')
 * @returns {Promise<Object>} - Cloudinary upload response with secure_url, public_id, etc.
 */
export const uploadImageToCloudinary = async (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const {
      folder = 'uploads',
      publicId,
      oldPublicId,
      transformation,
      preset = 'avatar',
      fieldName = 'file'
    } = options;

    // Use custom transformation or preset
    const finalTransformation = transformation || TRANSFORMATION_PRESETS[preset] || TRANSFORMATION_PRESETS.avatar;

    // Create upload stream to Cloudinary
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        public_id: publicId,
        resource_type: 'image',
        transformation: finalTransformation,
        unique_filename: !publicId, // Auto-generate unique filename if publicId not provided
        overwrite: !!publicId // Overwrite if publicId is specified
      },
      async (error, result) => {
        if (error) {
          reject(new ValidationError('Lỗi khi upload ảnh lên Cloudinary: ' + error.message, fieldName));
        } else {
          // Delete old image if exists and upload successful
          if (oldPublicId) {
            try {
              await deleteImageFromCloudinary(oldPublicId);
            } catch (deleteError) {
              // Log error but don't fail the upload
              console.error('Failed to delete old image:', deleteError);
            }
          }
          resolve(result);
        }
      }
    );

    // Write buffer to stream
    uploadStream.end(buffer);
  });
};

/**
 * Upload multiple images to Cloudinary
 * @param {Array<Buffer>} buffers - Array of image buffers from multer
 * @param {Object} options - Upload options (same as uploadImageToCloudinary)
 * @returns {Promise<Array<Object>>} - Array of Cloudinary upload responses
 */
export const uploadMultipleImagesToCloudinary = async (buffers, options = {}) => {
  if (!Array.isArray(buffers) || buffers.length === 0) {
    return [];
  }

  const uploadPromises = buffers.map((buffer, index) => {
    // Add index to publicId if specified
    const optionsWithIndex = options.publicId 
      ? { ...options, publicId: `${options.publicId}_${index}` }
      : options;
    
    return uploadImageToCloudinary(buffer, optionsWithIndex);
  });

  return Promise.all(uploadPromises);
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Public ID of the image to delete
 * @returns {Promise<Object>} - Cloudinary delete response
 */
export const deleteImageFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    throw error;
  }
};

/**
 * Delete multiple images from Cloudinary
 * @param {Array<string>} publicIds - Array of public IDs to delete
 * @returns {Promise<Array<Object>>} - Array of Cloudinary delete responses
 */
export const deleteMultipleImagesFromCloudinary = async (publicIds) => {
  if (!Array.isArray(publicIds) || publicIds.length === 0) {
    return [];
  }

  const deletePromises = publicIds.map(publicId => deleteImageFromCloudinary(publicId));
  return Promise.all(deletePromises);
};

/**
 * Extract public ID from Cloudinary URL
 * @param {string} url - Cloudinary URL
 * @returns {string|null} - Public ID or null if not a valid Cloudinary URL
 */
export const extractPublicIdFromUrl = (url) => {
  if (!url) return null;
  
  try {
    // Pattern: https://res.cloudinary.com/{cloud_name}/image/upload/{version}/{folder}/{public_id}.{extension}
    const regex = /\/v\d+\/(.+)\.\w+$/;
    const match = url.match(regex);
    return match ? match[1] : null;
  } catch (error) {
    console.error('Error extracting public ID from URL:', error);
    return null;
  }
};

/**
 * Extract multiple public IDs from Cloudinary URLs
 * @param {Array<string>} urls - Array of Cloudinary URLs
 * @returns {Array<string>} - Array of public IDs (null entries are filtered out)
 */
export const extractPublicIdsFromUrls = (urls) => {
  if (!Array.isArray(urls) || urls.length === 0) {
    return [];
  }

  return urls.map(url => extractPublicIdFromUrl(url)).filter(id => id !== null);
};
