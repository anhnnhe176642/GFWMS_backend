import { shelfRepository } from '../repositories/shelf.repository.js';
import { NotFoundError , ConflictError } from '../utils/errors.js';

class ShelfService {

  async getAllShelvesAdvanced(queryOptions) {
    return await shelfRepository.findWithAdvancedQuery(queryOptions);
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
