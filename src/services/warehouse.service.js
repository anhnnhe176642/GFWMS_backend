import { warehouseRepository } from '../repositories/warehouse.repository.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';

export const getAllWarehouses = async () => {
  return await warehouseRepository.findWithAdvancedQuery({});
};

export const getAllWarehousesAdvanced = async (queryOptions) => {
  return await warehouseRepository.findWithAdvancedQuery(queryOptions);
};

export const createWarehouse = async (data) => {
  const nameExists = await warehouseRepository.nameExists(data.name);
  if (nameExists) {
    throw new ConflictError('Tên kho đã tồn tại');
  }
  return await warehouseRepository.create(data);
};

export const getWarehouseById = async (id) => {
  const warehouse = await warehouseRepository.findById(id);
  if (!warehouse) {
    throw new NotFoundError('Kho không tồn tại');
  }
  return warehouse;
};

export const getActiveWarehouseById = async (id) => {
  const warehouse = await warehouseRepository.findActiveById(id);
  if (!warehouse) {
    throw new NotFoundError('Kho không tồn tại hoặc đã bị xóa');
  }
  return warehouse;
};

export const updateWarehouse = async (id, data) => {
  const exists = await warehouseRepository.exists(id);
  if (!exists) {
    throw new NotFoundError('Kho không tồn tại hoặc đã bị xóa');
  }
  if (data.name) {
    const nameExists = await warehouseRepository.nameExists(data.name, id);
    if (nameExists) {
      throw new ConflictError('Tên kho đã tồn tại');
    }
  }
  return await warehouseRepository.updateById(id, data);
};

export const deleteWarehouse = async (id) => {
  const exists = await warehouseRepository.exists(id);
  if (!exists) {
    throw new NotFoundError('Kho không tồn tại hoặc đã bị xóa');
  }
  return await warehouseRepository.softDelete(id);
};

export const restoreWarehouse = async (id) => {
  const warehouse = await warehouseRepository.findById(id);
  if (!warehouse) {
    throw new NotFoundError('Kho không tồn tại');
  }
  if (warehouse.status === 'ACTIVE') {
    throw new ConflictError('Kho đã ở trạng thái hoạt động');
  }
  return await warehouseRepository.restore(id);
};