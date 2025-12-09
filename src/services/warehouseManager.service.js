import { warehouseManagerRepository } from '../repositories/warehouseManager.repository.js';
import { ValidationError } from '../utils/errors.js';

/**
 * Get all warehouses assigned to a user
 * @param {string} userId
 */
export const getUserWarehouses = async (userId) => {
  if (!userId) {
    throw new ValidationError('userId không được để trống');
  }

  return await warehouseManagerRepository.getUserWarehouses(userId);
};

/**
 * Get all managers of a warehouse
 * @param {number} warehouseId
 */
export const getWarehouseManagers = async (warehouseId) => {
  if (!warehouseId) {
    throw new ValidationError('warehouseId không được để trống');
  }

  return await warehouseManagerRepository.getWarehouseManagers(warehouseId);
};

/**
 * Check if user is assigned to a warehouse
 * @param {string} userId
 * @param {number} warehouseId
 */
export const isUserAssignedToWarehouse = async (userId, warehouseId) => {
  if (!userId || !warehouseId) {
    throw new ValidationError('userId và warehouseId không được để trống');
  }

  return await warehouseManagerRepository.isUserAssignedToWarehouse(userId, warehouseId);
};

/**
 * Get warehouse IDs for a user
 * @param {string} userId
 */
export const getUserWarehouseIds = async (userId) => {
  if (!userId) {
    throw new ValidationError('userId không được để trống');
  }

  return await warehouseManagerRepository.getUserWarehouseIds(userId);
};

/**
 * Batch assign warehouses to a user
 * @param {string} userId
 * @param {Array<number>} warehouseIds
 * @param {string} assignedBy
 */
export const assignMultipleWarehousesToUser = async (userId, warehouseIds, assignedBy) => {
  if (!userId || !warehouseIds || warehouseIds.length === 0 || !assignedBy) {
    throw new ValidationError('userId, warehouseIds (không rỗng), và assignedBy không được để trống');
  }

  return await warehouseManagerRepository.assignMultipleWarehousesToUser(userId, warehouseIds, assignedBy);
};

/**
 * Remove all warehouses from a user
 * @param {string} userId
 */
export const removeAllWarehousesFromUser = async (userId) => {
  if (!userId) {
    throw new ValidationError('userId không được để trống');
  }

  return await warehouseManagerRepository.removeAllWarehousesFromUser(userId);
};
