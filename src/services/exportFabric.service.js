// src/services/exportFabric.service.js
import { NotFoundError } from '../utils/errors.js';
import { exportFabricRepository } from '../repositories/exportFabric.repository.js';

/**
 *  Lấy danh sách phiếu xuất vải (phân trang cơ bản)
 */
export const getAllExportFabrics = async (page, limit) => {
  return await exportFabricRepository.findWithPagination(page, limit);
};

/**
 *  Lấy chi tiết phiếu xuất vải theo ID
 */
export const getExportFabricById = async (id) => {
  const exportFabric = await exportFabricRepository.findById(id);

  if (!exportFabric) {
    throw new NotFoundError('Phiếu xuất vải không tồn tại');
  }

  return exportFabric;
};

/**
 *  Lấy danh sách phiếu xuất vải nâng cao (lọc, sắp xếp, phân trang)
 */
export const getAllExportFabricsAdvanced = async (queryOptions) => {
  return await exportFabricRepository.findWithAdvancedQuery(queryOptions);
};
