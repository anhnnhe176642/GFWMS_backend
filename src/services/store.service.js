import { storeRepository } from '../repositories/store.repository.js';
import { NotFoundError } from '../utils/errors.js';

class StoreService {
  async getAllStoresAdvanced(queryOptions) {
    return storeRepository.findWithAdvancedQuery(queryOptions);
  }

  async createStore(storeData) {
    return storeRepository.create(storeData);
  }

  async updateStore(id, storeData) {
    const store = await storeRepository.findById(id);
    if (!store) {
      throw new NotFoundError('Không tìm thấy cửa hàng');
    }
    return storeRepository.updateById(id, storeData);
  }

  async getStoreById(id) {
    const store = await storeRepository.findById(id);
    if (!store) {
      throw new NotFoundError('Không tìm thấy cửa hàng');
    }
    return store;
  }

  async deleteStore(id) {
    const store = await storeRepository.findById(id);
    if (!store) {
      throw new NotFoundError('Không tìm thấy cửa hàng');
    }
    return storeRepository.deleteById(id);
  }
}

export const storeService = new StoreService();
