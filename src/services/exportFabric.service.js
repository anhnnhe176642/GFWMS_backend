// src/services/exportFabric.service.js
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors.js';
import { PrismaClient } from '@prisma/client';
import { exportFabricRepository } from '../repositories/exportFabric.repository.js';
import { fabricRepository } from '../repositories/fabric.repository.js';
import { warehouseRepository } from '../repositories/warehouse.repository.js';
import { storeRepository } from '../repositories/store.repository.js';
import { fabricShelfRepository } from '../repositories/fabricShelf.repository.js';
import fabricStoreRepository from '../repositories/fabricStore.repository.js';
import { userActivityService } from './userActivity.service.js';
import { calculateHaversineDistance } from '../utils/distance-calculator.js';

const prisma = new PrismaClient();

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
export const getAllExportFabricsAdvanced = async (queryOptions, userId = null) => {
  return await exportFabricRepository.findWithAdvancedQuery(queryOptions, userId);
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
export const suggestOptimalAllocation = async (fabricItems, priority = 'MIN_WAREHOUSES', destinationLocation = null) => {
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

  // Build warehouse data with location info
  const warehouseData = new Map();
  for (const fabric of fabrics) {
    for (const stock of fabric.availableStocks) {
      if (!warehouseData.has(stock.warehouseId)) {
        // Fetch warehouse details with location info
        const warehouse = await warehouseRepository.findById(stock.warehouseId);
        warehouseData.set(stock.warehouseId, {
          name: stock.warehouseName,
          latitude: warehouse?.latitude || null,
          longitude: warehouse?.longitude || null,
          stocks: new Map()
        });
      }
      warehouseData.get(stock.warehouseId).stocks.set(fabric.fabricId, stock.currentStock);
    }
  }

  // Validate location data if using distance-based priority
  if (priority === 'MIN_DISTANCE') {
    if (!destinationLocation || destinationLocation.latitude === undefined || destinationLocation.longitude === undefined) {
      throw new ValidationError('destinationLocation với latitude và longitude là bắt buộc khi priority = MIN_DISTANCE');
    }

    // Check if all warehouses have location
    for (const [whId, data] of warehouseData) {
      if (data.latitude === null || data.longitude === null) {
        throw new ValidationError(
          `Kho "${data.name}" (ID: ${whId}) không có thông tin tọa độ. Vui lòng cập nhật tọa độ kho trước khi sử dụng chế độ MIN_DISTANCE`
        );
      }
    }
  }

  // Remaining needs
  const remainingNeeds = new Map(fabricItems.map(item => [item.fabricId, item.quantity]));

  // Track allocation
  const allocationMap = new Map();
  for (const fabricId of remainingNeeds.keys()) {
    allocationMap.set(fabricId, new Map());
  }

  // Mutable warehouse stocks copy
  const warehouseStocks = new Map();
  for (const [whId, data] of warehouseData) {
    warehouseStocks.set(whId, new Map(data.stocks));
  }

  if (priority === 'MIN_DISTANCE') {
    // Use distance-based algorithm
    await suggestByMinDistance(
      warehouseData,
      warehouseStocks,
      remainingNeeds,
      allocationMap,
      destinationLocation
    );
  } else {
    // Use default min-warehouse greedy algorithm
    suggestByMinWarehouses(
      warehouseData,
      warehouseStocks,
      remainingNeeds,
      allocationMap
    );
  }

  // Build result with distance info
  const result = fabrics.map(fabric => {
    const fabricAllocations = allocationMap.get(fabric.fabricId) || new Map();
    const availableStocksWithSelection = fabric.availableStocks.map(stock => {
      const selected = fabricAllocations.has(stock.warehouseId);
      const warehouseInfo = warehouseData.get(stock.warehouseId);
      
      let distance = null;
      if (priority === 'MIN_DISTANCE' && destinationLocation && warehouseInfo) {
        distance = calculateHaversineDistance(
          warehouseInfo.latitude,
          warehouseInfo.longitude,
          destinationLocation.latitude,
          destinationLocation.longitude
        );
      }

      return {
        warehouseId: stock.warehouseId,
        warehouseName: stock.warehouseName,
        currentStock: stock.currentStock,
        distance, // Null if not using distance-based priority
        selected,
        takeQuantity: fabricAllocations.get(stock.warehouseId) || 0
      };
    });

    // sắp xếp kho đã chọn lên trước
    if (priority === 'MIN_DISTANCE') {
      availableStocksWithSelection.sort((a, b) => {
        if (a.selected !== b.selected) return b.selected ? 1 : -1;
        if (a.selected && b.selected) {
          return (a.distance || 0) - (b.distance || 0); // Sort selected by distance
        }
        return (a.distance || 0) - (b.distance || 0);
      });
    } else {
      availableStocksWithSelection.sort((a, b) => {
        if (a.selected !== b.selected) return b.selected ? 1 : -1;
        return b.takeQuantity - a.takeQuantity;
      });
    }

    return {
      fabricId: fabric.fabricId,
      fabric: fabric.fabric,
      requestedQuantity: fabric.requestedQuantity,
      availableStocks: availableStocksWithSelection,
      totalAvailable: fabric.totalAvailable,
      isSufficient: fabric.isSufficient
    };
  });

  // Calculate summary distances if using distance-based priority
  let allocationSummary = null;
  if (priority === 'MIN_DISTANCE') {
    allocationSummary = {
      destinationLocation,
      totalWarehouses: 0,
      totalDistance: 0,
      warehouseDetails: []
    };

    for (const [whId, data] of warehouseData) {
      const hasAllocation = Array.from(allocationMap.values()).some(allocMap => allocMap.has(whId));
      if (hasAllocation) {
        const distance = calculateHaversineDistance(
          data.latitude,
          data.longitude,
          destinationLocation.latitude,
          destinationLocation.longitude
        );
        allocationSummary.totalWarehouses++;
        allocationSummary.warehouseDetails.push({
          warehouseId: whId,
          warehouseName: data.name,
          distance
        });
      }
    }

    // Sort by distance for cumulative calculation
    allocationSummary.warehouseDetails.sort((a, b) => a.distance - b.distance);
    
    // Calculate cumulative/total distance
    let cumulativeDistance = 0;
    let prevLat = destinationLocation.latitude;
    let prevLng = destinationLocation.longitude;

    for (const detail of allocationSummary.warehouseDetails) {
      const warehouse = warehouseData.get(detail.warehouseId);
      const segmentDistance = calculateHaversineDistance(prevLat, prevLng, warehouse.latitude, warehouse.longitude);
      detail.cumulativeDistance = parseFloat((cumulativeDistance + segmentDistance).toFixed(2));
      cumulativeDistance = detail.cumulativeDistance;
      prevLat = warehouse.latitude;
      prevLng = warehouse.longitude;
    }

    allocationSummary.totalDistance = cumulativeDistance;
  }

  return { fabrics: result, ...(allocationSummary && { allocationSummary }) };
};

/**
 * Suggest allocation using MIN_WAREHOUSES strategy (Greedy Set Cover)
 * Ưu tiên chọn ít kho nhất
 */
const suggestByMinWarehouses = (warehouseData, warehouseStocks, remainingNeeds, allocationMap) => {
  const calculateWarehouseScore = (warehouseId) => {
    const stocks = warehouseStocks.get(warehouseId);
    if (!stocks) return 0;

    let score = 0;
    let itemsCovered = 0;

    for (const [fabricId, needed] of remainingNeeds) {
      if (needed <= 0) continue;
      
      const available = stocks.get(fabricId) || 0;
      if (available > 0) {
        score += Math.min(available, needed);
        itemsCovered++;
      }
    }

    return score + (itemsCovered * 0.001);
  };

  while (true) {
    let allSatisfied = true;
    for (const [, needed] of remainingNeeds) {
      if (needed > 0) {
        allSatisfied = false;
        break;
      }
    }
    if (allSatisfied) break;

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
      throw new ValidationError('Không thể phân bổ đủ số lượng từ các kho có sẵn');
    }

    const stocks = warehouseStocks.get(bestWarehouseId);
    for (const [fabricId, needed] of remainingNeeds) {
      if (needed <= 0) continue;

      const available = stocks.get(fabricId) || 0;
      if (available > 0) {
        const take = Math.min(available, needed);
        allocationMap.get(fabricId).set(bestWarehouseId, take);
        remainingNeeds.set(fabricId, needed - take);
        stocks.set(fabricId, available - take);
      }
    }
  }
};

/**
 * Suggest allocation using MIN_DISTANCE strategy - OPTIMIZED VERSION
 * Tối ưu hóa tổng khoảng cách bằng cách tìm tập hợp kho có tổng khoảng cách nhỏ nhất
 * 
 * Thuật toán:
 * 1. Sử dụng bit manipulation + BFS để duyệt tất cả tập hợp kho khả thi
 * 2. Với mỗi tập hợp, kiểm tra xem có thể phục vụ hết nhu cầu không
 * 3. Chọn tập hợp có tổng khoảng cách nhỏ nhất
 * 4. Phân bổ vải từ tập hợp này sử dụng greedy (ưu tiên kho gần nhất)
 */
const suggestByMinDistance = async (warehouseData, warehouseStocks, remainingNeeds, allocationMap, destinationLocation) => {
  const warehouseList = Array.from(warehouseData.entries());
  const warehouseCount = warehouseList.length;

  // Calculate distance for each warehouse
  const warehouseDistances = new Map();
  const distanceArray = [];
  
  warehouseList.forEach(([whId, data], index) => {
    const distance = calculateHaversineDistance(
      data.latitude,
      data.longitude,
      destinationLocation.latitude,
      destinationLocation.longitude
    );
    warehouseDistances.set(whId, distance);
    distanceArray.push({ index, whId, distance });
  });

  // Sort by distance for priority in allocation
  distanceArray.sort((a, b) => a.distance - b.distance);

  // Find optimal warehouse set using bit enumeration with branch pruning
  // For small warehouse counts, enumerate all subsets
  let optimalSet = null;
  let minTotalDistance = Infinity;

  // Only enumerate if warehouse count is reasonable (< 20)
  if (warehouseCount <= 15) {
    // Try all possible subsets of warehouses with branch pruning
    for (let mask = 1; mask < (1 << warehouseCount); mask++) {
      const selectedWarehouses = [];
      let totalDistance = 0;

      for (let i = 0; i < warehouseCount; i++) {
        if (mask & (1 << i)) {
          const whId = warehouseList[i][0];
          selectedWarehouses.push(whId);
          totalDistance += warehouseDistances.get(whId);
          
          // Branch pruning: nếu khoảng cách hiện tại đã lớn hơn tối ưu, bỏ qua
          if (totalDistance >= minTotalDistance) {
            break;
          }
        }
      }

      // Skip if already exceeded minimum distance (pruned)
      if (totalDistance >= minTotalDistance) {
        continue;
      }

      // Check if this set can fulfill all needs
      const canFulfill = canFulfillAllNeeds(
        selectedWarehouses,
        warehouseData,
        warehouseStocks,
        remainingNeeds
      );

      if (canFulfill && totalDistance < minTotalDistance) {
        minTotalDistance = totalDistance;
        optimalSet = selectedWarehouses;
      }
    }

    if (optimalSet === null) {
      throw new ValidationError('Không thể phân bổ đủ số lượng từ các kho có sẵn');
    }

    // Allocate from optimal set (prefer closer warehouses first)
    optimalSet.sort((whId1, whId2) => 
      (warehouseDistances.get(whId1) || 0) - (warehouseDistances.get(whId2) || 0)
    );

    for (const warehouseId of optimalSet) {
      const stocks = warehouseStocks.get(warehouseId);
      
      for (const [fabricId, needed] of remainingNeeds) {
        if (needed <= 0) continue;

        const available = stocks.get(fabricId) || 0;
        if (available > 0) {
          const take = Math.min(available, needed);
          const current = allocationMap.get(fabricId).get(warehouseId) || 0;
          allocationMap.get(fabricId).set(warehouseId, current + take);
          remainingNeeds.set(fabricId, needed - take);
          stocks.set(fabricId, available - take);
        }
      }
    }
  } else {
    // For larger warehouse counts, use greedy: keep adding nearest warehouse until satisfied
    const selectedWarehouses = [];
    const tempNeeds = new Map(remainingNeeds);

    for (const { whId } of distanceArray) {
      // Check if this warehouse helps fulfill any remaining need
      const stocks = warehouseStocks.get(whId);
      let canHelp = false;

      for (const [fabricId, needed] of tempNeeds) {
        if (needed > 0) {
          const available = stocks.get(fabricId) || 0;
          if (available > 0) {
            canHelp = true;
            // Simulate allocation
            tempNeeds.set(fabricId, needed - Math.min(available, needed));
          }
        }
      }

      if (canHelp) {
        selectedWarehouses.push(whId);

        // Check if all needs are satisfied
        let allSatisfied = true;
        for (const [, needed] of tempNeeds) {
          if (needed > 0) {
            allSatisfied = false;
            break;
          }
        }

        if (allSatisfied) break;
      }
    }

    // Verify solution and allocate
    if (!canFulfillAllNeeds(selectedWarehouses, warehouseData, warehouseStocks, remainingNeeds)) {
      throw new ValidationError('Không thể phân bổ đủ số lượng từ các kho có sẵn');
    }

    // Allocate from selected warehouses (sorted by distance)
    for (const warehouseId of selectedWarehouses) {
      const stocks = warehouseStocks.get(warehouseId);
      
      for (const [fabricId, needed] of remainingNeeds) {
        if (needed <= 0) continue;

        const available = stocks.get(fabricId) || 0;
        if (available > 0) {
          const take = Math.min(available, needed);
          const current = allocationMap.get(fabricId).get(warehouseId) || 0;
          allocationMap.get(fabricId).set(warehouseId, current + take);
          remainingNeeds.set(fabricId, needed - take);
          stocks.set(fabricId, available - take);
        }
      }
    }
  }
};

/**
 * Check if a set of warehouses can fulfill all fabric needs
 */
const canFulfillAllNeeds = (warehouseIds, warehouseData, warehouseStocks, remainingNeeds) => {
  const tempStocks = new Map();
  
  // Copy stocks from selected warehouses
  for (const whId of warehouseIds) {
    const stocks = warehouseStocks.get(whId);
    tempStocks.set(whId, new Map(stocks));
  }

  // Try to fulfill all needs
  for (const [fabricId, needed] of remainingNeeds) {
    let available = 0;
    
    for (const whId of warehouseIds) {
      const stocks = tempStocks.get(whId);
      available += stocks.get(fabricId) || 0;
    }

    if (available < needed) {
      return false;
    }
  }

  return true;
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
  const createdExport = await exportFabricRepository.create(exportData);
  
  // Log activity
  await userActivityService.logActivity(
    exportData.createdById,
    'EXPORT_CREATED',
    'ExportFabric',
    createdExport.id,
    `Tạo phiếu xuất vải #${createdExport.id}`
  );
  
  return createdExport;
};






export const approveExportFabric = async ({
  exportFabricId,
  status,
  batchPickupDetails = [],
  note,
  approvedById
}) => {
  const exportFabric = await exportFabricRepository.findById(exportFabricId);

  if (!exportFabric) throw new NotFoundError('Phiếu xuất vải không tồn tại');
  if (exportFabric.status !== 'PENDING')
    throw new ConflictError('Phiếu xuất này đã được xử lý trước đó và không thể duyệt lại.');

  if (status === 'REJECTED') {
    // Hoàn trả quantityInStock cho các fabric trong phiếu
    await exportFabricRepository.restoreQuantityForExport(exportFabricId);
  }

  if (status === 'APPROVED') {
    if (!batchPickupDetails || batchPickupDetails.length === 0) {
      throw new ConflictError('Vui lòng cung cấp chi tiết batch lấy (importId, shelfId, pickQuantity) để duyệt phiếu.');
    }

    // Group batchPickupDetails theo fabricId
    const batchesByFabric = {};
    for (const fabricBatch of batchPickupDetails) {
      batchesByFabric[fabricBatch.fabricId] = fabricBatch.batches;
    }

    // Validate: mỗi loại vải trong exportFabric phải có batch
    for (const item of exportFabric.exportItems) {
      if (!batchesByFabric[item.fabricId]) {
        throw new ConflictError(`Loại vải (ID: ${item.fabricId}) không có chi tiết batch được cung cấp.`);
      }

      const batches = batchesByFabric[item.fabricId];
      const totalPickQuantity = batches.reduce((sum, b) => sum + b.pickQuantity, 0);

      if (totalPickQuantity !== item.quantity) {
        throw new ConflictError(
          `Tổng số lượng lấy cho vải (ID: ${item.fabricId}) phải đúng bằng ${item.quantity}, nhưng nhận được ${totalPickQuantity}.`
        );
      }
    }

    // Validate và trừ tồn kho kệ
    for (const fabricBatch of batchPickupDetails) {
      const fabricId = fabricBatch.fabricId;
      const batches = fabricBatch.batches;

      for (const batch of batches) {
        // Validate FabricShelf tồn tại
        const fabricShelf = await prisma.fabricShelf.findUnique({
          where: {
            shelfId_fabricId_importId: {
              shelfId: batch.shelfId,
              fabricId: fabricId,
              importId: batch.importId
            }
          }
        });

        if (!fabricShelf) {
          throw new ConflictError(
            `Kệ ${batch.shelfId} - Lô ${batch.importId} - Vải ${fabricId} không tồn tại.`
          );
        }

        if (fabricShelf.quantity < batch.pickQuantity) {
          throw new ConflictError(
            `Kệ ${batch.shelfId} - Lô ${batch.importId} không đủ số lượng. Cần: ${batch.pickQuantity}, Còn: ${fabricShelf.quantity}.`
          );
        }

        // Trừ tồn kho
        await prisma.fabricShelf.update({
          where: {
            shelfId_fabricId_importId: {
              shelfId: batch.shelfId,
              fabricId: fabricId,
              importId: batch.importId
            }
          },
          data: { quantity: { decrement: batch.pickQuantity } }
        });
      }
    }

    // Xóa hết ExportFabricItem cũ (từ khi tạo phiếu xuất)
    await exportFabricRepository.deleteAllItems(exportFabricId);

    // Tạo lại ExportFabricItem - MỖI BATCH = 1 ITEM (cho phép cùng fabricId nhưng khác giá)
    const newItems = [];
    for (const fabricBatch of batchPickupDetails) {
      const fabricId = fabricBatch.fabricId;
      const batches = fabricBatch.batches;

      for (const batch of batches) {
        // Query importPrice từ ImportFabricItem
        const importFabricItem = await prisma.importFabricItem.findFirst({
          where: {
            importFabricId: batch.importId,
            fabricId: fabricId
          }
        });

        const importPrice = importFabricItem?.price || 0;

        newItems.push({
          fabricId: fabricId,
          quantity: batch.pickQuantity,
          price: importPrice
        });
      }
    }

    // Tạo tất cả items mới
    await exportFabricRepository.createManyItems(exportFabricId, newItems);
  }

  // Cập nhật trạng thái phiếu xuất
  return await exportFabricRepository.updateStatus(exportFabricId, status, approvedById, [], status === 'REJECTED' ? note : null);
};

/**
 * Xác nhận nhận hàng từ cửa hàng - Chuyển status APPROVED -> COMPLETED
 * Cộng vải vào FabricStore dùng giá nhập (từ ExportFabricItem.price)
 */
export const completeExportFabric = async ({ exportFabricId, receivedById }) => {
  const exportFabric = await exportFabricRepository.findById(exportFabricId);

  if (!exportFabric) throw new NotFoundError('Phiếu xuất vải không tồn tại');
  
  if (exportFabric.status !== 'APPROVED') {
    throw new ConflictError('Chỉ có thể xác nhận nhận hàng cho phiếu xuất đã được duyệt (APPROVED)');
  }

  const storeId = exportFabric.storeId;

  // Cộng vải vào FabricStore cho từng fabric trong exportItems
  for (const item of exportFabric.exportItems) {
    const { fabricId, quantity, price, fabric } = item;
    
    // Lấy thông tin fabric để tính toán
    const fabricInfo = fabric || await fabricRepository.findById(fabricId);
    if (!fabricInfo) {
      throw new NotFoundError(`Loại vải (ID: ${fabricId}) không tồn tại`);
    }

    const fabricLength = fabricInfo.length || 0;
    // Dùng giá nhập (đã lưu trong ExportFabricItem.price khi APPROVED)
    const importPrice = price || fabricInfo.sellingPrice || 0;

    // Tính toán các giá trị
    const totalMeters = quantity * fabricLength;
    const totalValue = quantity * importPrice;

    // Import vải vào cửa hàng
    await fabricStoreRepository.importFabricRolls({
      fabricId,
      storeId,
      totalValue,
      totalMeters,
      uncutRolls: quantity,
      cuttingRollMeters: 0
    });
  }

  // Cập nhật trạng thái phiếu xuất sang COMPLETED
  const updatedExport = await exportFabricRepository.updateStatus(exportFabricId, 'COMPLETED', receivedById, []);
  
  // Log activity
  await userActivityService.logActivity(
    receivedById,
    'EXPORT_COMPLETED',
    'ExportFabric',
    exportFabricId,
    `Xác nhận nhận phiếu xuất vải`
  );
  
  return updatedExport;
};


