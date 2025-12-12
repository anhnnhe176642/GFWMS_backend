/**
 * Utility function to classify color family from hex code
 * This is the same algorithm used in the SQL procedure
 */

export function getColorFamilyFromHex(hexCode) {
  if (!hexCode) return 'Không xác định';

  // Remove # if present
  let hex = hexCode.startsWith('#') ? hexCode.substring(1) : hexCode;

  // Convert #RGB to #RRGGBB
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }

  // Validate hex length
  if (hex.length !== 6) {
    return 'Không xác định';
  }

  // Convert hex to RGB (0-255)
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate max and min
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);

  // Calculate lightness (0-1 range)
  const lightness = (max + min) / 2 / 255;

  // Classify achromatic colors first
  if (lightness < 0.15) return 'Đen';
  if (lightness > 0.80) return 'Trắng';

  // Calculate saturation
  let saturation;
  if (max === min) {
    saturation = 0;
  } else {
    const delta = max - min;
    saturation = delta / (255 * (1 - Math.abs(2 * lightness - 1)));
  }

  // If saturation is low, classify as gray
  if (saturation < 0.18) return 'Xám';

  // Calculate hue (0-360 range)
  let hue;
  if (max === r) {
    hue = ((g - b) / (max - min)) % 6;
  } else if (max === g) {
    hue = (b - r) / (max - min) + 2;
  } else {
    hue = (r - g) / (max - min) + 4;
  }

  hue = Math.round(hue * 60);
  if (hue < 0) hue += 360;

  // Classify by hue ranges (adjusted for better color separation)
  // Red: 0-20, 340-360
  // Orange: 20-40
  // Yellow: 40-65
  // Green: 65-170
  // Blue: 170-260
  // Purple: 260-290
  // Pink: 290-340
  
  if (hue < 20 || hue >= 340) return 'Đỏ';
  if (hue < 40) return 'Cam';
  if (hue < 65) return 'Vàng';
  if (hue < 170) return 'Xanh lá';
  if (hue < 260) return 'Xanh dương';
  if (hue < 290) return 'Tím';
  if (hue < 340) return 'Hồng';
  
  return 'Đỏ';
}

/**
 * Get all available color families
 */
export const COLOR_FAMILIES = [
  'Đỏ',
  'Cam',
  'Vàng',
  'Xanh lá',
  'Xanh dương',
  'Tím',
  'Hồng',
  'Đen',
  'Trắng',
  'Xám',
  'Không xác định'
];
