import { storeRepository } from '../repositories/store.repository.js';
import { NotFoundError,ConflictError  } from '../utils/errors.js';
import { BadRequestError } from '../utils/errors.js';

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

  // Phân công nhân viên cho cửa hàng
   async assignStaffToStore(storeId, staffIds) {
    // Kiểm tra store tồn tại
    const store = await storeRepository.findById(storeId);
    if (!store) {
      throw new NotFoundError('Không tìm thấy cửa hàng');
    }

    //Lấy thông tin tất cả staff từ repository
    const staffs = await Promise.all(
      staffIds.map(id => storeRepository.findUserById(id))
    );

    // Kiểm tra staff có tồn tại không
    const notFoundStaffs = staffIds.filter((id, index) => ! staffs[index]);
    if (notFoundStaffs.length > 0) {
      throw new NotFoundError(`Không tìm thấy nhân viên với ID: ${notFoundStaffs.join(', ')}`);
    }

    // Kiểm tra tất cả có phải là STAFF không
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

    // Kiểm tra staff đã được phân công cho store khác chưa
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
        `Một số nhân viên đã được phân công cho cửa hàng khác.  Chi tiết: ${JSON.stringify(alreadyAssignedToOther)}`
      );
    }

    // Phân công từng staff qua repository
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
    // Kiểm tra store tồn tại
    const store = await storeRepository.findById(storeId);
    if (!store) {
      throw new NotFoundError('Không tìm thấy cửa hàng');
    }

    // Lấy thông tin staff từ repository
    const staff = await storeRepository.findUserById(staffId);
    if (!staff) {
      throw new NotFoundError('Không tìm thấy nhân viên');
    }

    // Kiểm tra staff có được phân công không
    if (! staff.storeId) {
      throw new BadRequestError('Nhân viên chưa được phân công cho cửa hàng nào');
    }

    // Kiểm tra staff có thuộc store này không
    const staffStoreId = parseInt(staff.storeId);
    const targetStoreId = parseInt(storeId);

    if (staffStoreId !== targetStoreId) {
      throw new BadRequestError(
        `Nhân viên đang thuộc cửa hàng ID ${staffStoreId}, không phải cửa hàng ID ${targetStoreId}`
      );
    }
    // Hủy phân công qua repository
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
    // Kiểm tra store tồn tại
    const store = await storeRepository.findById(storeId);
    if (!store) {
      throw new NotFoundError('Không tìm thấy cửa hàng');
    }
    // Lấy danh sách staff từ repository
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
