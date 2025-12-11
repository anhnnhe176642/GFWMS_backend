/**
 * Utility functions for calculating distance between coordinates
 */

/**
 * Calculate distance between two geographic coordinates using Haversine formula
 * @param {number} lat1 - Latitude of point 1 (degrees)
 * @param {number} lng1 - Longitude of point 1 (degrees)
 * @param {number} lat2 - Latitude of point 2 (degrees)
 * @param {number} lng2 - Longitude of point 2 (degrees)
 * @returns {number} Distance in kilometers
 */
export const calculateHaversineDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in kilometers
  
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return parseFloat(distance.toFixed(2)); // Return rounded to 2 decimal places
};

/**
 * Convert degrees to radians
 * @param {number} degrees
 * @returns {number} Radians
 */
const toRadians = (degrees) => {
  return (degrees * Math.PI) / 180;
};

/**
 * Calculate total distance from a location to multiple warehouses
 * @param {Array<{latitude: number, longitude: number}>} warehouseLocations
 * @param {number} storeLat - Store latitude
 * @param {number} storeLng - Store longitude
 * @returns {Array<{warehouseIndex: number, distance: number}>} Distances for each warehouse
 */
export const calculateWarehouseDistances = (warehouseLocations, storeLat, storeLng) => {
  return warehouseLocations.map((warehouse, index) => ({
    warehouseIndex: index,
    distance: calculateHaversineDistance(
      warehouse.latitude,
      warehouse.longitude,
      storeLat,
      storeLng
    )
  }));
};

/**
 * Calculate total distance for a set of warehouses
 * Assumes warehouses are visited in order, calculating cumulative distance
 * @param {Array<{latitude: number, longitude: number}>} warehouseLocations - Ordered list of warehouses
 * @param {number} startLat - Starting location latitude (e.g., store)
 * @param {number} startLng - Starting location longitude
 * @returns {number} Total cumulative distance in km
 */
export const calculateTotalDistance = (warehouseLocations, startLat, startLng) => {
  if (!warehouseLocations || warehouseLocations.length === 0) {
    return 0;
  }

  let totalDistance = 0;
  let currentLat = startLat;
  let currentLng = startLng;

  for (const warehouse of warehouseLocations) {
    if (warehouse.latitude !== null && warehouse.latitude !== undefined &&
        warehouse.longitude !== null && warehouse.longitude !== undefined) {
      totalDistance += calculateHaversineDistance(
        currentLat,
        currentLng,
        warehouse.latitude,
        warehouse.longitude
      );
      currentLat = warehouse.latitude;
      currentLng = warehouse.longitude;
    }
  }

  return parseFloat(totalDistance.toFixed(2));
};
