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

  if (warehouse.status !== 'INACTIVE') {
    throw new ValidationError('Không thể xóa kho đang hoạt động. Vui lòng chuyển trạng thái thành INACTIVE trước khi xóa.');
  }

  const references = await warehouseRepository.checkForeignKeyReferences(id);
  
  if (references.hasReferences) {
    const referencedTables = [];
    if (references.shelveCount > 0) referencedTables.push(`${references.shelveCount} kệ hàng`);
    if (references.importCount > 0) referencedTables.push(`${references.importCount} phiếu nhập`);
    if (references.exportCount > 0) referencedTables.push(`${references.exportCount} phiếu xuất`);
    if (references.fabricShelfCount > 0) referencedTables.push(`${references.fabricShelfCount} vải trên kệ`);
    if (references.destroyCount > 0) referencedTables.push(`${references.destroyCount} phiếu hủy`);
    if (references.manageCount > 0) referencedTables.push(`${references.manageCount} kho quản lý`);

    throw new ValidationError(
      `Không thể xóa kho. Kho đang được tham chiếu ở: ${referencedTables.join(', ')}. ` +
      'Vui lòng xóa tất cả dữ liệu liên quan trước khi xóa kho.'
    );
  }
  return await warehouseRepository.deleteById(id);
}
  
}
export const warehouseService = new WarehouseService();