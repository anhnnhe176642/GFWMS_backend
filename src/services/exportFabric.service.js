// src/services/exportFabric.service.js
import { NotFoundError ,ConflictError} from '../utils/errors.js';
import { exportFabricRepository } from '../repositories/exportFabric.repository.js';
import { fabricRepository } from '../repositories/fabric.repository.js';
import { warehouseRepository } from '../repositories/warehouse.repository.js';
import { storeRepository } from '../repositories/store.repository.js';
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

export const createExportFabric = async (exportData) => {
  const { warehouseId, storeId, exportItems = [] } = exportData;

  if (exportItems.length === 0) {
    throw new ConflictError('Phiếu xuất phải có ít nhất một loại vải');
  }

  for (const item of exportItems) {
    const fabric = await fabricRepository.findById(item.fabricId);

    if (!fabric) {
      throw new NotFoundError(`Vải có ID ${item.fabricId} không tồn tại trong kho`);
    }

    if (item.quantity > fabric.quantityInStock) {
      throw new ConflictError(
        `Số lượng cuộn cần xuất (${item.quantity}) vượt quá số lượng hiện có trong kho (${fabric.quantityInStock})`
      );
    }
  }

  const warehouse = await warehouseRepository.findById(warehouseId);
  if (!warehouse) {
    throw new NotFoundError(`Kho với ID ${warehouseId} không tồn tại`);
  }

  const store = await storeRepository.findById(storeId);
  if (!store) {
    throw new NotFoundError(`Cửa hàng với ID ${storeId} không tồn tại`);
  }

  return await exportFabricRepository.create(exportData);
};

