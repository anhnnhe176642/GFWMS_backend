import { userStoreService } from '../services/userStore.service.js';

/**
 * Assign a store to a user
 */
export const assignStoreToUser = async (req, res, next) => {
  try {
    const { userId, storeId } = req.body;

    const result = await userStoreService.assignStoreToUser(userId, storeId);

    res.status(201).json({
      message: 'Thêm cửa hàng cho user thành công',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove a store from a user
 */
export const removeStoreFromUser = async (req, res, next) => {
  try {
    const { userId, storeId } = req.body;

    const result = await userStoreService.removeStoreFromUser(userId, storeId);

    res.json({
      message: 'Xóa cửa hàng khỏi user thành công',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all stores assigned to a user
 */
export const getUserStores = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const stores = await userStoreService.getUserStores(userId);

    res.json({
      message: 'Lấy danh sách cửa hàng của user thành công',
      data: stores
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all managers assigned to a store
 */
export const getStoreManagers = async (req, res, next) => {
  try {
    const { storeId } = req.params;

    const managers = await userStoreService.getStoreManagers(storeId);

    res.json({
      message: 'Lấy danh sách quản lý cửa hàng thành công',
      data: managers
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Assign multiple stores to a user
 */
export const assignMultipleStoresToUser = async (req, res, next) => {
  try {
    const { userId, storeIds } = req.body;

    const result = await userStoreService.assignMultipleStoresToUser(userId, storeIds);

    res.status(201).json({
      message: 'Thêm nhiều cửa hàng cho user thành công',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove all stores from a user
 */
export const removeAllStoresFromUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    await userStoreService.removeAllStoresFromUser(userId);

    res.json({
      message: 'Xóa tất cả cửa hàng của user thành công'
    });
  } catch (error) {
    next(error);
  }
};
