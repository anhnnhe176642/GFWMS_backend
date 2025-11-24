// src/services/exportFabric.service.js
import { NotFoundError ,ConflictError} from '../utils/errors.js';
import { exportFabricRepository } from '../repositories/exportFabric.repository.js';
import { fabricRepository } from '../repositories/fabric.repository.js';
import { warehouseRepository } from '../repositories/warehouse.repository.js';
import { storeRepository } from '../repositories/store.repository.js';
import { fabricShelfRepository } from '../repositories/fabricShelf.repository.js';

/**
 *  Lấy danh sách phiếu xuất vải (phân trang cơ bản)
 */
export const getAllExportFabrics = async (page, limit) => {
  return await exportFabricRepository.findWithPagination(page, limit);
};

/**
 *  Lấy chi tiết phiếu xuất vải theo ID
 */
/** Lấy chi tiết phiếu xuất vải cho nhân viên cửa hàng */
export const getExportFabricDetailForStore = async (id) => {
  const exportFabric = await exportFabricRepository.findById(id);

  if (!exportFabric) throw new NotFoundError('Phiếu xuất vải không tồn tại');

  // Không trả thông tin kệ
  return exportFabric;
};

/** Lấy chi tiết phiếu xuất vải cho nhân viên kho, kèm gợi ý kệ */
export const getExportFabricDetailForWarehouse = async (id) => {
  const exportFabric = await exportFabricRepository.findById(id);

  if (!exportFabric) throw new NotFoundError('Phiếu xuất vải không tồn tại');

  const warehouseId = exportFabric.warehouseId;

  const itemsWithShelfSuggestions = await Promise.all(
    exportFabric.exportItems.map(async (item) => {
      const shelves = await fabricShelfRepository.findByFabricIdInWarehouse(
        item.fabricId,
        warehouseId
      );

      return {
        ...item,
        shelfSuggestions: shelves.map(s => ({
          shelfId: s.shelf.id,
          shelfCode: s.shelf.code,
          availableQuantity: s.quantity
        }))
      };
    })
  );

  return {
    ...exportFabric,
    exportItems: itemsWithShelfSuggestions
  };
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
      throw new NotFoundError(`Loại vải bạn chọn (ID: ${item.fabricId}) hiện không có trong kho.`);
    }

    if (item.quantity > fabric.quantityInStock) {
      throw new ConflictError(
        `Số lượng cần xuất (${item.quantity}) lớn hơn số lượng còn trong kho (${fabric.quantityInStock}).`
      );
    }
  }

  const warehouse = await warehouseRepository.findById(warehouseId);
  if (!warehouse) {
    throw new NotFoundError(`Kho (ID ${warehouseId}) không tồn tại hoặc đã bị xoá.`);
  }

  const store = await storeRepository.findById(storeId);
  if (!store) {
    throw new NotFoundError(`Cửa hàng (ID ${storeId}) không tồn tại hoặc đã bị xoá.`);
  }

  return await exportFabricRepository.create(exportData);
};


export const approveExportFabric = async ({
  exportFabricId,
  status,
  itemShelfSelections = [],
  approvedById
}) => {
  const exportFabric = await exportFabricRepository.findById(exportFabricId);

  if (!exportFabric) throw new NotFoundError('Phiếu xuất vải không tồn tại');
  if (exportFabric.status !== 'PENDING')
    throw new ConflictError('Phiếu xuất này đã được xử lý trước đó và không thể duyệt lại.');

  if (status === 'APPROVED') {
  if (!itemShelfSelections || itemShelfSelections.length === 0) {
    throw new ConflictError('Bạn cần chọn kệ và số lượng lấy từ kệ để duyệt phiếu.');
  }

  // Map quantityToTake sang quantity
  const selections = itemShelfSelections.map(sel => ({
    fabricId: sel.fabricId,
    shelfId: sel.shelfId,
    quantity: sel.quantityToTake
  }));

  // Validate cơ bản
  for (const sel of selections) {
    if (!sel.fabricId || !sel.shelfId || !sel.quantity || sel.quantity <= 0) {
      throw new ConflictError('Vui lòng chọn đúng loại vải, kệ và số lượng cần lấy (phải lớn hơn 0).');
    }
  }

  // Group theo fabricId để kiểm tra tổng quantity
  const selectionsByFabric = selections.reduce((acc, sel) => {
    if (!acc[sel.fabricId]) acc[sel.fabricId] = [];
    acc[sel.fabricId].push(sel);
    return acc;
  }, {});

  for (const item of exportFabric.exportItems) {
    const fabricSelections = selectionsByFabric[item.fabricId] || [];
    const totalSelected = fabricSelections.reduce((sum, s) => sum + s.quantity, 0);

    if (totalSelected !== item.quantity) {
      throw new ConflictError(
        `Tổng số lượng lấy từ kệ cho loại vải (ID: ${item.fabricId}) phải đúng bằng ${item.quantity}.`
      );
    }
  }

  // Kiểm tra tồn kho kệ và trừ kho
  for (const sel of selections) {
    const shelfItem = await fabricShelfRepository.findByShelfIdAndFabricId(
      sel.shelfId,
      sel.fabricId
    );
    if (!shelfItem) 
      throw new ConflictError(
        `Kệ bạn chọn (ID: ${sel.shelfId}) không chứa loại vải (ID: ${sel.fabricId}).`
    );

    if (shelfItem.quantity < sel.quantity) {
      throw new ConflictError(
        `Kệ ${shelfItem.shelf.code} không đủ số lượng vải cần lấy. 
        Cần: ${sel.quantity}, Còn: ${shelfItem.quantity}.`
      );
    }

    // Trừ tồn kho trong kệ và tổng kho
    await fabricShelfRepository.decreaseQuantity(sel.shelfId, sel.fabricId, sel.quantity);
    await fabricRepository.decreaseQuantityInStock(sel.fabricId, sel.quantity);
  }
  }


  // Cập nhật trạng thái phiếu xuất
  return await exportFabricRepository.updateStatus(exportFabricId, status, approvedById, itemShelfSelections);
};


