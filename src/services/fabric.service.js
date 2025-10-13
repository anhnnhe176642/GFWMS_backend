import { NotFoundError } from '../utils/errors.js';
import { fabricRepository } from '../repositories/fabric.repository.js';

/**
 * Lấy danh sách tất cả các Fabric (phân trang cơ bản)
 */
export const getAllFabrics = async (page, limit) => {
  return await fabricRepository.findWithPagination(page, limit);
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
 * Lấy danh sách Fabric nâng cao (lọc, tìm kiếm, sắp xếp)
 */
export const getAllFabricsAdvanced = async (queryOptions) => {
    console.log('🧩 queryOptions trước khi gọi repo:', queryOptions);
  return await fabricRepository.findWithAdvancedQuery(queryOptions);
};
