import { shelfRepository } from '../repositories/shelf.repository.js';
import { NotFoundError } from '../utils/errors.js';

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
    return await shelfRepository.deleteById(id);
  }
}

export const shelfService = new ShelfService();
