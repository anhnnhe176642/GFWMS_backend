/**
 * Color similarity/distance calculation utilities
 */

/**
 * Calculate weighted Euclidean distance between two hex colors
 * @param {string} hex1 - First hex color (#RGB or #RRGGBB)
 * @param {string} hex2 - Second hex color (#RGB or #RRGGBB)
 * @returns {number} Distance (0-765 range)
 */
export function colorDistance(hex1, hex2) {
  const parseHex = (hex) => {
    let h = hex.replace(/^#/, '').toUpperCase();
    // Convert #RGB to #RRGGBB
    if (h.length === 3) {
      h = h.split('').map(c => c + c).join('');
    }
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
    };
  };

  try {
    const c1 = parseHex(hex1);
    const c2 = parseHex(hex2);

    // Weighted Euclidean distance
    const rMean = (c1.r + c2.r) / 2;
    const dR = c1.r - c2.r;
    const dG = c1.g - c2.g;
    const dB = c1.b - c2.b;

    return Math.sqrt(
      (2 + rMean / 256) * dR * dR +
      4 * dG * dG +
      (2 + (255 - rMean) / 256) * dB * dB
    );
  } catch (error) {
    console.error(`Error calculating color distance for ${hex1} and ${hex2}:`, error);
    return Infinity; // Return max distance on error
  }
}

/**
 * Calculate max distance from range percentage (0-100)
 * @param {number} range - Range percentage (0-100, higher = more lenient)
 * @returns {number} Max distance allowed
 */
export function getMaxDistanceFromRange(range) {
  // Max distance in RGB space is ~765
  // range: 100 = lenient (765), 0 = strict (0)
  return ((100 - range) / 100) * 765;
}

/**
 * Check if color distance is within acceptable range
 * @param {number} distance - Calculated color distance
 * @param {number} range - Range percentage (0-100)
 * @returns {boolean}
 */
export function isColorWithinRange(distance, range) {
  const maxDistance = getMaxDistanceFromRange(range);
  return distance <= maxDistance;
}
