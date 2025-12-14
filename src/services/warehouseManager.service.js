import { warehouseManagerRepository } from '../repositories/warehouseManager.repository.js';
import { userRepository } from '../repositories/user.repository.js';
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

/**
 * Check warehouse access with special permissions
 * - User with warehouse:manager_all permission can access any warehouse
 * - User with warehouse:manager permission must be assigned to the warehouse
 * @param {string} userId - ID người dùng
 * @param {number} warehouseId - ID kho
 * @returns {Promise<boolean>} true nếu có quyền, false nếu không
 */
export const checkWarehouseAccess = async (userId, warehouseId) => {
  if (!userId || !warehouseId) {
    throw new ValidationError('userId và warehouseId không được để trống');
  }

  // Check if user has MANAGER_ALL permission (can access all warehouses)
  const hasManagerAllPerm = await userRepository.hasPermission(userId, 'warehouse:manager_all');
  if (hasManagerAllPerm) {
    return true;
  }

  // Check if user has MANAGER permission (must be assigned to warehouse)
  const hasManagerPerm = await userRepository.hasPermission(userId, 'warehouse:manager');
  if (hasManagerPerm) {
    // Check if user is assigned to this specific warehouse
    return await warehouseManagerRepository.isUserAssignedToWarehouse(userId, warehouseId);
  }

  return false;
};
