import { storeRepository } from '../repositories/store.repository.js';
import { NotFoundError,ConflictError,BadRequestError  } from '../utils/errors.js';

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

    const fabricCount = await storeRepository.countFabricsInStore(id);
    if (fabricCount > 0) {
      throw new ConflictError(
        `Không thể xóa cửa hàng ${store.name} vì cửa hàng đang hoạt động`
      );
    }

    return await storeRepository.deleteById(id);
  }

  /**
   *  Phân công nhiều staff cho store (1-1)
   */
  async assignStaffToStore(storeId, staffIds) {
    const store = await storeRepository.findById(storeId);
    if (!store) {
      throw new NotFoundError('Không tìm thấy cửa hàng');
    }

    const staffs = await Promise.all(
      staffIds.map(id => storeRepository.findUserById(id))
    );

    const notFoundStaffs = staffIds.filter((id, index) => ! staffs[index]);
    if (notFoundStaffs.length > 0) {
      throw new NotFoundError(`Không tìm thấy nhân viên với ID: ${notFoundStaffs. join(', ')}`);
    }

    const invalidRoles = [];
    for (let i = 0; i < staffs.length; i++) {
      if (staffs[i].role !== 'STAFF') {
        invalidRoles.push(staffIds[i]);
      }
    }

    if (invalidRoles.length > 0) {
      throw new BadRequestError(
        `Chỉ được phân công user có role STAFF.  Các user sau không hợp lệ: ${invalidRoles.join(', ')}`
      );
    }

    const alreadyAssignedToOther = [];
    for (let i = 0; i < staffs.length; i++) {
      if (staffs[i].storeId && staffs[i].storeId !== parseInt(storeId)) {
        alreadyAssignedToOther.push({
          staffId: staffIds[i],
          currentStoreId: staffs[i].storeId
        });
      }
    }

    if (alreadyAssignedToOther.length > 0) {
      throw new BadRequestError(
        `Một số nhân viên đã được phân công cho cửa hàng khác. Chi tiết: ${JSON.stringify(alreadyAssignedToOther)}`
      );
    }

    const results = await Promise.all(
      staffIds.map(id => storeRepository.assignStaffToStore(id, storeId))
    );

    return {
      store: {
        id: store.id,
        name: store.name,
        address: store.address,
        isActive: store.isActive
      },
      assignedStaffs: results
    };
  }

  /**
   * Hủy phân công staff khỏi store (1-1)
   */
  async unassignStaffFromStore(storeId, staffId) {
    const store = await storeRepository.findById(storeId);
    if (!store) {
      throw new NotFoundError('Không tìm thấy cửa hàng');
    }

    const staff = await storeRepository.findUserById(staffId);
    if (!staff) {
      throw new NotFoundError('Không tìm thấy nhân viên');
    }

    if (! staff.storeId) {
      throw new BadRequestError('Nhân viên chưa được phân công cho cửa hàng nào');
    }

    const staffStoreId = parseInt(staff.storeId);
    const targetStoreId = parseInt(storeId);

    if (staffStoreId !== targetStoreId) {
      throw new BadRequestError(
        `Nhân viên đang thuộc cửa hàng ID ${staffStoreId}, không phải cửa hàng ID ${targetStoreId}`
      );
    }

    const result = await storeRepository.unassignStaffFromStore(staffId);
    
    return {
      store: {
        id: store.id,
        name: store.name,
        address: store.address,
        isActive: store.isActive
      },
      unassignedStaff: result
    };
  }

  /**
   * Lấy danh sách staff của store
   */
  async getStaffsByStoreId(storeId, queryOptions) {
    const store = await storeRepository.findById(storeId);
    if (!store) {
      throw new NotFoundError('Không tìm thấy cửa hàng');
    }

    const result = await storeRepository.findStaffsByStoreId(storeId, queryOptions);
    
    return {
      store: {
        id: store. id,
        name: store. name,
        address: store. address,
        isActive: store.isActive
      },
      ... result
    };
  }
}

export const storeService = new StoreService();
