// src/services/exportFabric.service.js
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors.js';
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

/**
 * Preview inventory: Xem tồn kho theo warehouse cho danh sách fabric
 * @param {Array<{fabricId: number, quantity: number}>} fabricItems
 * @returns {Promise<{fabrics: Array, warehouseDetails: Array}>}
 */
export const previewInventory = async (fabricItems) => {
  if (!fabricItems || fabricItems.length === 0) {
    throw new ValidationError('Danh sách vải không được để trống');
  }

  const fabricIds = fabricItems.map(item => item.fabricId);
  const requestedMap = new Map(fabricItems.map(item => [item.fabricId, item.quantity]));

  // Lấy thông tin fabric và warehouse stocks
  const [fabrics, warehouseStocks] = await Promise.all([
    fabricRepository.getFabricsByIds(fabricIds),
    fabricRepository.getWarehouseStocks(fabricIds)
  ]);

  // Kiểm tra fabric không tồn tại
  for (const fabricId of fabricIds) {
    if (!fabrics.find(f => f.id === fabricId)) {
      throw new NotFoundError(`Loại vải (ID: ${fabricId}) không tồn tại`);
    }
  }

  // Group stocks by fabricId
  const stocksByFabric = new Map();
  for (const stock of warehouseStocks) {
    if (!stocksByFabric.has(stock.fabricId)) {
      stocksByFabric.set(stock.fabricId, []);
    }
    stocksByFabric.get(stock.fabricId).push({
      warehouseId: stock.warehouseId,
      warehouseName: stock.warehouse.name,
      currentStock: stock.currentStock
    });
  }

  // Build fabric details result
  const result = fabricIds.map(fabricId => {
    const fabric = fabrics.find(f => f.id === fabricId);
    const requestedQuantity = requestedMap.get(fabricId);
    const stocks = stocksByFabric.get(fabricId) || [];
    const totalAvailable = stocks.reduce((sum, s) => sum + s.currentStock, 0);

    return {
      fabricId,
      fabric,
      requestedQuantity,
      availableStocks: stocks,
      totalAvailable,
      isSufficient: totalAvailable >= requestedQuantity
    };
  });

  return {
    fabrics: result
  };
};

/**
 * Set Cover Algorithm để gợi ý phân bổ tối ưu - tối thiểu hóa số kho
 * @param {Array<{fabricId: number, quantity: number}>} fabricItems
 * @returns {Promise<{fabrics: Array}>}
 * 
 * Thuật toán:
 * 1. Tính điểm mỗi kho = tổng số lượng các fabric items kho đó có thể đáp ứng
 * 2. Chọn kho có điểm cao nhất, lấy tối đa từ kho đó
 * 3. Cập nhật remaining needs, lặp lại đến khi hết
 * 4. Output: số kho ít nhất để xuất được toàn bộ danh sách vải
 */
export const suggestOptimalAllocation = async (fabricItems) => {
  const { fabrics } = await previewInventory(fabricItems);

  // Check đủ hàng không
  for (const fabric of fabrics) {
    if (!fabric.isSufficient) {
      throw new ValidationError(
        `Không đủ số lượng vải ${fabric.fabric.category?.name} (${fabric.fabric.color?.name}). ` +
        `Yêu cầu: ${fabric.requestedQuantity}, Tồn kho: ${fabric.totalAvailable}`
      );
    }
  }

  // Build warehouse data: warehouseId -> { name, stocks: Map<fabricId, currentStock> }
  const warehouseData = new Map();
  for (const fabric of fabrics) {
    for (const stock of fabric.availableStocks) {
      if (!warehouseData.has(stock.warehouseId)) {
        warehouseData.set(stock.warehouseId, {
          name: stock.warehouseName,
          stocks: new Map()
        });
      }
      warehouseData.get(stock.warehouseId).stocks.set(fabric.fabricId, stock.currentStock);
    }
  }

  // Remaining needs: fabricId -> quantity still needed
  const remainingNeeds = new Map(fabricItems.map(item => [item.fabricId, item.quantity]));

  // Track allocation: fabricId -> warehouseId -> quantity to take
  const allocationMap = new Map();
  for (const fabricId of remainingNeeds.keys()) {
    allocationMap.set(fabricId, new Map());
  }

  // Mutable warehouse stocks copy
  const warehouseStocks = new Map();
  for (const [whId, data] of warehouseData) {
    warehouseStocks.set(whId, new Map(data.stocks));
  }

  /**
   * Tính điểm cho 1 kho = tổng số lượng có thể lấy từ kho đó cho các items còn cần
   * Điểm cao = kho đáp ứng được nhiều hơn
   */
  const calculateWarehouseScore = (warehouseId) => {
    const stocks = warehouseStocks.get(warehouseId);
    if (!stocks) return 0;

    let score = 0;
    let itemsCovered = 0; // Số fabric items có thể lấy từ kho này

    for (const [fabricId, needed] of remainingNeeds) {
      if (needed <= 0) continue;
      
      const available = stocks.get(fabricId) || 0;
      if (available > 0) {
        // Điểm = số lượng có thể lấy
        score += Math.min(available, needed);
        itemsCovered++;
      }
    }

    // Ưu tiên kho cover được nhiều items hơn (secondary sort)
    // Score chính + bonus nhỏ cho số items covered
    return score + (itemsCovered * 0.001);
  };

  // Greedy Set Cover: chọn kho có điểm cao nhất mỗi lần
  while (true) {
    // Kiểm tra đã đủ chưa
    let allSatisfied = true;
    for (const [, needed] of remainingNeeds) {
      if (needed > 0) {
        allSatisfied = false;
        break;
      }
    }
    if (allSatisfied) break;

    // Tìm kho có điểm cao nhất
    let bestWarehouseId = null;
    let bestScore = 0;

    for (const warehouseId of warehouseStocks.keys()) {
      const score = calculateWarehouseScore(warehouseId);
      if (score > bestScore) {
        bestScore = score;
        bestWarehouseId = warehouseId;
      }
    }

    if (bestWarehouseId === null || bestScore === 0) {
      // Không tìm được kho nào có thể đáp ứng thêm
      throw new ValidationError('Không thể phân bổ đủ số lượng từ các kho có sẵn');
    }

    // Lấy từ kho này
    const stocks = warehouseStocks.get(bestWarehouseId);
    for (const [fabricId, needed] of remainingNeeds) {
      if (needed <= 0) continue;

      const available = stocks.get(fabricId) || 0;
      if (available > 0) {
        const take = Math.min(available, needed);

        // Cập nhật phân bổ
        allocationMap.get(fabricId).set(bestWarehouseId, take);

        // Cập nhật nhu cầu còn lại
        remainingNeeds.set(fabricId, needed - take);

        // Cập nhật tồn kho kho (để không bị tính lại)
        stocks.set(fabricId, available - take);
      }
    }
  }

  // Build result: fabric format với availableStocks đã thêm selected và takeQuantity
  const result = fabrics.map(fabric => {
    const fabricAllocations = allocationMap.get(fabric.fabricId) || new Map();
    const availableStocksWithSelection = fabric.availableStocks.map(stock => ({
      warehouseId: stock.warehouseId,
      warehouseName: stock.warehouseName,
      currentStock: stock.currentStock,
      selected: fabricAllocations.has(stock.warehouseId),
      takeQuantity: fabricAllocations.get(stock.warehouseId) || 0
    }));
    // sắp xếp kho đã chọn lên trước, sau đó theo số lượng lấy giảm dần
    availableStocksWithSelection.sort((a, b) => {
      if (a.selected !== b.selected) return b.selected ? 1 : -1;
      return b.takeQuantity - a.takeQuantity;
    });

    return {
      fabricId: fabric.fabricId,
      fabric: fabric.fabric,
      requestedQuantity: fabric.requestedQuantity,
      availableStocks: availableStocksWithSelection,
      totalAvailable: fabric.totalAvailable,
      isSufficient: fabric.isSufficient
    };
  });

  return { fabrics: result };
};

/**
 * Tạo batch ExportFabric (nhiều warehouse)
 * - Validate tồn kho
 * - Trừ quantityInStock
 * - Tạo nhiều ExportFabric
 */
export const createBatchExportFabric = async ({ storeId, note, createdById, warehouseAllocations }) => {
  // Validate store
  const store = await storeRepository.findById(storeId);
  if (!store) {
    throw new NotFoundError(`Cửa hàng (ID ${storeId}) không tồn tại`);
  }

  // Validate warehouses and inventory
  const fabricTotals = new Map(); // fabricId -> total quantity across all allocations

  for (const allocation of warehouseAllocations) {
    const warehouse = await warehouseRepository.findById(allocation.warehouseId);
    if (!warehouse) {
      throw new NotFoundError(`Kho (ID ${allocation.warehouseId}) không tồn tại`);
    }

    for (const item of allocation.items) {
      // Check fabric exists
      const fabric = await fabricRepository.findById(item.fabricId);
      if (!fabric) {
        throw new NotFoundError(`Loại vải (ID: ${item.fabricId}) không tồn tại`);
      }

      // Check warehouse has enough stock
      const inventory = await fabricRepository.getFabricInventoryByWarehouse(item.fabricId);
      const whStock = inventory.inventoryByWarehouse.find(w => w.warehouseId === allocation.warehouseId);
      const available = whStock ? whStock.quantity : 0;

      if (available < item.quantity) {
        throw new ValidationError(
          `Kho "${warehouse.name}" không đủ số lượng vải "${fabric.category?.name || 'N/A'}". ` +
          `Yêu cầu: ${item.quantity}, Tồn kho: ${available}`
        );
      }

      // Sum up total for fabric
      const current = fabricTotals.get(item.fabricId) || 0;
      fabricTotals.set(item.fabricId, current + item.quantity);
    }
  }

  // Check total quantityInStock
  for (const [fabricId, totalNeeded] of fabricTotals) {
    const fabric = await fabricRepository.findById(fabricId);
    if (fabric.quantityInStock < totalNeeded) {
      throw new ValidationError(
        `Tổng số lượng vải (ID: ${fabricId}) không đủ. Yêu cầu: ${totalNeeded}, Tổng tồn kho: ${fabric.quantityInStock}`
      );
    }
  }

  // Create batch (transaction handles quantityInStock deduction)
  return await exportFabricRepository.createBatch({
    storeId,
    note,
    createdById,
    warehouseAllocations
  });
};

export const createExportFabric = async (exportData) => {
  const { warehouseId, storeId, exportItems = [] } = exportData;

  if (exportItems.length === 0) {
    throw new ConflictError('Phiếu xuất phải có ít nhất một loại vải');
  }

  for (const item of exportItems) {
    // Lấy thông tin fabric
    const fabric = await fabricRepository.findById(item.fabricId);
    if (!fabric) {
      throw new NotFoundError(`Loại vải (ID: ${item.fabricId}) hiện không có trong kho.`);
    }

    // Lấy tồn kho theo warehouse
    const inventory = await fabricRepository.getFabricInventoryByWarehouse(item.fabricId);
    const warehouseInventory = inventory.inventoryByWarehouse.find(w => w.warehouseId === warehouseId);
    const availableQuantity = warehouseInventory ? warehouseInventory.quantity : 0;

    if (availableQuantity < item.quantity) {
      throw new ConflictError(
        `${fabric.category.name} không đủ số lượng trong kho ${warehouseInventory?.warehouseName || 'Unknown'}.(Cần: ${item.quantity}, Còn: ${availableQuantity})`
      );
    }
  }

  // Kiểm tra warehouse tồn tại
  const warehouse = await warehouseRepository.findById(warehouseId);
  if (!warehouse) {
    throw new NotFoundError(`Kho (ID ${warehouseId}) không tồn tại hoặc đã bị xoá.`);
  }

  // Kiểm tra store tồn tại
  const store = await storeRepository.findById(storeId);
  if (!store) {
    throw new NotFoundError(`Cửa hàng (ID ${storeId}) không tồn tại hoặc đã bị xoá.`);
  }

  // Tạo phiếu xuất (KHÔNG trừ stock ở đây - chỉ trừ khi duyệt)
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

  if (status === 'REJECTED') {
    // Hoàn trả quantityInStock cho các fabric trong phiếu (nếu đã trừ khi tạo batch)
    await exportFabricRepository.restoreQuantityForExport(exportFabricId);
  }

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

    // Trừ tồn kho trong kệ (trigger sẽ update WarehouseFabricStock)
    await fabricShelfRepository.decreaseQuantity(sel.shelfId, sel.fabricId, sel.quantity);
    // NOTE: quantityInStock đã được trừ khi tạo batch, không trừ lại ở đây
  }
  }


  // Cập nhật trạng thái phiếu xuất
  return await exportFabricRepository.updateStatus(exportFabricId, status, approvedById, itemShelfSelections);
};


