/**
 * Generate public image URL for dataset images
 * @param {string} imagePath - Relative path from datasets folder (e.g., "images/filename.jpg")
 * @param {string} baseUrl - Base URL (e.g., "http://localhost:3000")
 * @returns {string} Full public URL
 */
export function getImageUrl(imagePath, baseUrl = process.env.API_BASE_URL || 'http://localhost:3000') {
  if (!imagePath) return null;
  
  // Remove leading slashes and normalize path
  const normalizedPath = imagePath.replace(/\\/g, '/').replace(/^\/+/, '');
  
  return `${baseUrl}/datasets/${normalizedPath}`;
}

/**
 * Add imageUrl to image object
 * @param {Object} image - Image object from DB
 * @param {string} baseUrl - Base URL
 * @returns {Object} Image object with imageUrl added
 */
export function enrichImageWithUrl(image, baseUrl) {
  return {
    ...image,
    imageUrl: getImageUrl(image.imagePath, baseUrl)
  };
}

/**
 * Add imageUrl to multiple images
 * @param {Array} images - Array of image objects
 * @param {string} baseUrl - Base URL
 * @returns {Array} Images with imageUrl added
 */
export function enrichImagesWithUrls(images, baseUrl) {
  return images.map(img => enrichImageWithUrl(img, baseUrl));
}
