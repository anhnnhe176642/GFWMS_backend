import { NotFoundError } from '../utils/errors.js';
import { warehouseRepository } from '../repositories/warehouse.repository.js';

export const getAllWarehouses = async (page, limit) => {
  return await warehouseRepository.findWithPagination(page, limit);
};

export const createWarehouse = async (data) => {
  return await warehouseRepository.create(data);
};

export const getWarehouseById = async (id) => {
  const warehouse = await warehouseRepository.findById(id);
  
  if (!warehouse) {
    throw new NotFoundError('Kho không tồn tại');
  }
  
  return warehouse;
};

export const updateWarehouse = async (id, data) => {
  // Check if warehouse exists first
  const existingWarehouse = await warehouseRepository.findById(id);
  if (!existingWarehouse) {
    throw new NotFoundError('Kho không tồn tại');
  }
  
  return await warehouseRepository.updateById(id, data);
};

export const getAllWarehousesAdvanced = async (queryOptions) => {
  return await warehouseRepository.findWithAdvancedQuery(queryOptions);
};