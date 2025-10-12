import { warehouseRepository } from '../repositories/warehouse.repository.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';


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
    throw new NotFoundError('Kho không tồn tại hoặc đã không hoạt động');
  }
  return warehouse;
};

export const updateWarehouse = async (id, data) => {
  const exists = await warehouseRepository.exists(id);
  if (!exists) {
    throw new NotFoundError('Kho không tồn tại hoặc đã ngững hoạt động');
  }
  if (data.name) {
    const nameExists = await warehouseRepository.nameExists(data.name, id);
    if (nameExists) {
      throw new ConflictError('Tên kho đã tồn tại');
    }
  }
  return await warehouseRepository.updateById(id, data);
};

export const changeWarehouseStatus = async (id, status) => {
  const warehouse = await warehouseRepository.findById(id);
  if (!warehouse) {
    throw new NotFoundError('Kho không tồn tại');
  }

  if (warehouse.status === status) {
    throw new ConflictError(`Kho đã ở trạng thái ${status}`);
  }
  
  if (status === 'INACTIVE') {
    return await warehouseRepository.softDelete(id);
  } else if (status === 'ACTIVE') {
    return await warehouseRepository.restore(id);
  } else {
    throw new Error('Trạng thái không hợp lệ');
  }
};
