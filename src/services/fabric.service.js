import { NotFoundError } from '../utils/errors.js';
import { fabricRepository } from '../repositories/fabric.repository.js';

/**
 * Lấy danh sách tất cả các Fabric (phân trang cơ bản)
 */
export const getAllFabrics = async (page, limit) => {
  return await fabricRepository.findWithPagination(page, limit);
};

/**
 * Tạo mới một Fabric
 */
export const createFabric = async (data) => {
  return await fabricRepository.create(data);
};

/**
 * Lấy chi tiết Fabric theo ID
 */
export const getFabricById = async (id) => {
  const fabric = await fabricRepository.findById(id);

  if (!fabric) {
    throw new NotFoundError('Vải không tồn tại');
  }

  return fabric;
};

/**
 * Cập nhật thông tin Fabric theo ID
 */
export const updateFabric = async (id, data) => {
  const existingFabric = await fabricRepository.findById(id);
  if (!existingFabric) {
    throw new NotFoundError('Vải không tồn tại');
  }

  return await fabricRepository.updateById(id, data);
};

/**
 * Lấy danh sách Fabric nâng cao (lọc, tìm kiếm, sắp xếp)
 */
export const getAllFabricsAdvanced = async (queryOptions) => {
  return await fabricRepository.findWithAdvancedQuery(queryOptions);
};
