import { warehouseRepository } from '../repositories/warehouse.repository.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
class WarehouseService {
  async getAllWarehousesAdvanced(queryOptions) {
    return await warehouseRepository.findWithAdvancedQuery(queryOptions);
  }
  
  async createWarehouse(warehouseData) {
    const nameExists = await warehouseRepository.nameExists(warehouseData.name);
    if (nameExists) {
      throw new ValidationError("Tên kho đã tồn tại");
    }

    return await warehouseRepository.create(warehouseData);
  }


  async updateWarehouse(id, warehouseData) {
    const warehouse = await warehouseRepository.findById(id);
    if (!warehouse) {
      throw new NotFoundError("Không tìm thấy kho");
    }
    if (warehouseData.name && warehouseData.name !== warehouse.name) {
      const nameExists = await warehouseRepository.nameExists(warehouseData.name, id);
      if (nameExists) {
        throw new ValidationError("Tên kho đã tồn tại");
      }
    }
    return await warehouseRepository.updateById(id, warehouseData);
  }
  
  async getWarehouseById(id) {
    const warehouse = await warehouseRepository.findById(id);
    if (!warehouse) {
      throw new NotFoundError('Không tìm thấy kho');
    }
    return warehouse;
  }

  async deleteWarehouse(id) {
  const warehouse = await warehouseRepository.findById(id);
  if (!warehouse) {
    throw new NotFoundError('Không tìm thấy kho hàng');
  }
    
  return await warehouseRepository.deleteById(id);
}
  
}
export const warehouseService = new WarehouseService();