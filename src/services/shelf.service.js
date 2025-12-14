import { shelfRepository } from '../repositories/shelf.repository.js';
import { NotFoundError , ConflictError } from '../utils/errors.js';

class ShelfService {

  /**
   * Get shelves with optional grouping by fabric attributes
   * @param {Object} queryOptions - Query options (page, limit, search, sortBy, order, filters)
   * @param {Array<string>} groupByFields - Optional fields to group by
   * @returns {Object} Shelves data (grouped or ungrouped)
   */
  async getAllShelvesAdvanced(queryOptions, groupByFields = null) {
    // If grouping is requested
    if (groupByFields && groupByFields.length > 0) {
      return await shelfRepository.getShelvesGroupedByFabric(queryOptions, groupByFields);
    }

    // Normal shelf list
    return await shelfRepository.findWithAdvancedQuery(queryOptions);
  }

  /**
   * Get shelves in a warehouse grouped by fabric attributes
   * @param {number} warehouseId - ID kho
   * @param {Array<string>} groupByFields - Fields to group by
   * @param {Object} options - Query options
   */
  async getShelvesInWarehouseGroupedByFabric(warehouseId, groupByFields = [], options = {}) {
    return await shelfRepository.getShelvesInWarehouseGroupedByFabric(warehouseId, groupByFields, options);
  }

  async createShelf(shelfData) {
    return await shelfRepository.create(shelfData);
  }


  async getShelfById(id) {
    const shelf = await shelfRepository.findById(id);
    if (!shelf) {
      throw new NotFoundError('Không tìm thấy kệ');
    }
    return shelf;
  }


  async updateShelf(id, shelfData) {
    const shelf = await shelfRepository.findById(id);
    if (!shelf) {
      throw new NotFoundError('Không tìm thấy kệ');
    }

      // Nếu update maxQuantity, kiểm tra không nhỏ hơn currentQuantity
    if (shelfData.maxQuantity !== undefined && shelfData.maxQuantity < shelf.currentQuantity) {
      throw new ConflictError(
        `Không thể giảm sức chứa tối đa của kệ xuống ${shelfData.maxQuantity} vì hiện tại kệ đang chứa ${shelf.currentQuantity} cuộn vải`
      );
    }

    return await shelfRepository.updateById(id, shelfData);
  }


  async deleteShelf(id) {
    const shelf = await shelfRepository.findById(id);
    if (!shelf) {
      throw new NotFoundError('Không tìm thấy kệ');
    }

    const fabricCount = await shelfRepository.countFabricsOnShelf(id);
    if (fabricCount > 0) {
      throw new ConflictError(
        `Không thể xóa kệ ${shelf.code} vì đang có ${fabricCount} mẫu vải ở trên kệ này`
      );
    }

    return await shelfRepository.deleteById(id);
  }
}

export const shelfService = new ShelfService();
