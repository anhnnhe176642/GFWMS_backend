import { warehouseRepository } from '../repositories/warehouse.repository.js';
import { NotFoundError} from '../utils/errors.js';
class WarehouseService {
  async getAllWarehousesAdvanced(queryOptions) {
    return await warehouseRepository.findWithAdvancedQuery(queryOptions);
  }
  
  async createWarehouse(warehouseData) {
    return await warehouseRepository.create(warehouseData);
  }


  async updateWarehouse(id, warehouseData) {
    const warehouse = await warehouseRepository.findById(id);
    if (!warehouse) {
      throw new NotFoundError("Không tìm thấy kho");
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