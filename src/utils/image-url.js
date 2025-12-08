/**
 * Generate public image URL for dataset images
 * @param {string} imagePath - Relative path from datasets folder (e.g., "images/filename.jpg")
 * @returns {string} Public URL for the image (e.g., "/datasets/images/filename.jpg")
 */
export function getImageUrl(imagePath) {
  if (!imagePath) return null;
  
  // Remove leading slashes and normalize path
  const normalizedPath = imagePath.replace(/\\/g, '/').replace(/^\/+/, '');
  
  return `/datasets/${normalizedPath}`;
}

/**
 * Add imageUrl to image object
 * @param {Object} image - Image object from DB
 * @returns {Object} Image object with imageUrl added
 */
export function enrichImageWithUrl(image) {
  return {
    ...image,
    imageUrl: getImageUrl(image.imagePath)
  };
}

/**
 * Add imageUrl to multiple images
 * @param {Array} images - Array of image objects
 * @returns {Array} Images with imageUrl added
 */
export function enrichImagesWithUrls(images) {
  return images.map(img => enrichImageWithUrl(img));
}
