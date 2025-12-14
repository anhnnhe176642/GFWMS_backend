import { userRepository } from '../repositories/user.repository.js';
import { AppError } from '../utils/errors.js';

export class StoreAccessService {
  /**
   * Lấy danh sách stores mà user quản lý
   * @param {string} userId
   * @returns {Promise<Array>} - Mảng stores
   */
  async getUserStores(userId) {
    return await userRepository.getUserStores(userId);
  }

  /**
   * Lấy danh sách store IDs mà user quản lý
   * @param {string} userId
   * @returns {Promise<Array>} - Mảng store IDs
   */
  async getUserStoreIds(userId) {
    return await userRepository.getUserStoreIds(userId);
  }

  /**
   * Check user là quản lý cửa hàng cố định (có stores được assign)
   * @param {string} userId
   * @returns {Promise<boolean>}
   */
  async isStoreManager(userId) {
    return await userRepository.isStoreManager(userId);
  }

  /**
   * Check user là quản lý tất cả cửa hàng (có permission store:manager_all)
   * @param {string} userId
   * @returns {Promise<boolean>}
   */
  async isStoreManagerAll(userId) {
    return await userRepository.isStoreManagerAll(userId);
  }

  /**
   * Check user là quản lý cửa hàng (cố định hoặc toàn bộ)
   * @param {string} userId
   * @returns {Promise<boolean>}
   */
  async isStoreManagerAny(userId) {
    const isManager = await this.isStoreManager(userId);
    const isManagerAll = await this.isStoreManagerAll(userId);
    return isManager || isManagerAll;
  }

  /**
   * Check user có quản lý store cụ thể không
   * @param {string} userId
   * @param {number} storeId
   * @returns {Promise<boolean>}
   */
  async canUserManageStore(userId, storeId) {
    return await userRepository.canManageStore(userId, storeId);
  }

  /**
   * Ensure user có quyền quản lý store (throw error nếu không)
   * Kiểm tra: user quản lý cửa hàng cụ thể HOẶC có permission quản lý tất cả cửa hàng
   * @param {string} userId
   * @param {number} storeId
   * @throws {AppError}
   */
  async ensureUserCanManageStore(userId, storeId) {
    const [canManage, canManageAll] = await Promise.all([
      this.canUserManageStore(userId, storeId),
      this.isStoreManagerAll(userId)
    ]);
    
    if (!canManage && !canManageAll) {
      throw new AppError('Bạn không có quyền quản lý cửa hàng này', 403);
    }
  }

  /**
   * Check user có quản lý bất kỳ store nào trong danh sách không
   * @param {string} userId
   * @param {Array<number>} storeIds
   * @returns {Promise<Array<number>>} - Mảng store IDs mà user quản lý
   */
  async filterManagedStores(userId, storeIds) {
    const userStoreIds = await this.getUserStoreIds(userId);
    return storeIds.filter(id => userStoreIds.includes(id));
  }

  /**
   * Lấy stores theo IDs với validation
   * @param {string} userId
   * @param {Array<number>} storeIds
   * @returns {Promise<Array>}
   */
  async getUserStoresToFilter(userId, storeIds) {
    const managedStoreIds = await this.filterManagedStores(userId, storeIds);
    if (managedStoreIds.length === 0) {
      throw new AppError('Bạn không có quyền quản lý các cửa hàng được chỉ định', 403);
    }
    return managedStoreIds;
  }
}

export const storeAccessService = new StoreAccessService();
