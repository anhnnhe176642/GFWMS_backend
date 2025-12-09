import { userStoreRepository } from '../repositories/userStore.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { storeRepository } from '../repositories/store.repository.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

export class UserStoreService {
  /**
   * Assign a store to a user
   * @param {string} userId
   * @param {number} storeId
   * @returns {Promise<Object>}
   */
  async assignStoreToUser(userId, storeId) {
    // Validate user exists
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('Không tìm thấy user');
    }

    // Validate store exists
    const store = await storeRepository.findById(storeId);
    if (!store) {
      throw new NotFoundError('Không tìm thấy cửa hàng');
    }

    return await userStoreRepository.assignStoreToUser(userId, storeId);
  }

  /**
   * Remove a store from a user
   * @param {string} userId
   * @param {number} storeId
   * @returns {Promise<Object>}
   */
  async removeStoreFromUser(userId, storeId) {
    // Validate user exists
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('Không tìm thấy user');
    }

    // Validate store exists
    const store = await storeRepository.findById(storeId);
    if (!store) {
      throw new NotFoundError('Không tìm thấy cửa hàng');
    }

    return await userStoreRepository.removeStoreFromUser(userId, storeId);
  }

  /**
   * Get all stores assigned to a user
   * @param {string} userId
   * @returns {Promise<Array>}
   */
  async getUserStores(userId) {
    // Validate user exists
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('Không tìm thấy user');
    }

    return await userStoreRepository.getUserStores(userId);
  }

  /**
   * Get all managers assigned to a store
   * @param {number} storeId
   * @returns {Promise<Array>}
   */
  async getStoreManagers(storeId) {
    // Validate store exists
    const store = await storeRepository.findById(storeId);
    if (!store) {
      throw new NotFoundError('Không tìm thấy cửa hàng');
    }

    return await userStoreRepository.getStoreManagers(storeId);
  }

  /**
   * Assign multiple stores to a user at once
   * @param {string} userId
   * @param {Array<number>} storeIds
   * @returns {Promise<Array>}
   */
  async assignMultipleStoresToUser(userId, storeIds) {
    if (!Array.isArray(storeIds) || storeIds.length === 0) {
      throw new ValidationError('storeIds', 'Danh sách cửa hàng không được trống');
    }

    // Validate user exists
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('Không tìm thấy user');
    }

    // Validate all stores exist
    const stores = await storeRepository.findByIds(storeIds);
    if (stores.length !== storeIds.length) {
      throw new NotFoundError('Một hoặc nhiều cửa hàng không tồn tại');
    }

    return await userStoreRepository.assignMultipleStoresToUser(userId, storeIds);
  }

  /**
   * Remove all stores from a user
   * @param {string} userId
   * @returns {Promise<void>}
   */
  async removeAllStoresFromUser(userId) {
    // Validate user exists
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('Không tìm thấy user');
    }

    return await userStoreRepository.removeAllStoresFromUser(userId);
  }
}

export const userStoreService = new UserStoreService();
