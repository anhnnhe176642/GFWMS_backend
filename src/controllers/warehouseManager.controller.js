import * as warehouseManagerService from '../services/warehouseManager.service.js';

/**
 * Get all warehouses assigned to a user
 */
export const getUserWarehouses = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const warehouses = await warehouseManagerService.getUserWarehouses(userId);

    res.json({
      message: 'Lấy danh sách kho của người dùng thành công',
      data: warehouses
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all managers of a warehouse
 */
export const getWarehouseManagers = async (req, res, next) => {
  try {
    const { warehouseId } = req.params;

    const managers = await warehouseManagerService.getWarehouseManagers(warehouseId);

    res.json({
      message: 'Lấy danh sách quản lý kho thành công',
      data: managers
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check if user is assigned to a warehouse
 */
export const checkUserWarehouseAccess = async (req, res, next) => {
  try {
    const { userId, warehouseId } = req.params;

    const hasAccess = await warehouseManagerService.isUserAssignedToWarehouse(userId, warehouseId);

    res.json({
      message: 'Kiểm tra quyền truy cập kho thành công',
      data: {
        userId,
        warehouseId,
        hasAccess
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Batch assign warehouses to a user
 */
export const assignMultipleWarehousesToUser = async (req, res, next) => {
  try {
    const { userId, warehouseIds } = req.body;
    const assignedBy = req.user.id;

    const result = await warehouseManagerService.assignMultipleWarehousesToUser(userId, warehouseIds, assignedBy);

    res.status(201).json({
      message: 'Assign nhiều kho thành công',
      data: {
        totalAssigned: result.count,
        successful: result.successful,
        failed: result.failed,
        userId
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove all warehouses from a user
 */
export const removeAllWarehousesFromUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const result = await warehouseManagerService.removeAllWarehousesFromUser(userId);

    res.json({
      message: 'Xóa tất cả assign kho thành công',
      data: {
        totalRemoved: result.count,
        userId
      }
    });
  } catch (error) {
    next(error);
  }
};
