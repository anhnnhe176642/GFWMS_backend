import { warehouseRepository } from '../repositories/warehouse.repository.js';
import { fabricRepository } from '../repositories/fabric.repository.js';
import { checkWarehouseAccess } from './warehouseManager.service.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
class WarehouseService {
  async getAllWarehousesAdvanced(queryOptions, userId = null) {
    // Pass userId để repository tự lọc dựa trên bảng WarehouseManage
    return await warehouseRepository.findWithAdvancedQuery(queryOptions, userId);
  }
  
  async createWarehouse(warehouseData) {
    return await warehouseRepository.create(warehouseData);
  }


  async updateWarehouse(id, warehouseData) {
    const warehouse = await warehouseRepository.findById(id);
    if (!warehouse) {
      throw new NotFoundError("Không tìm thấy kho");
    }
    return await warehouseRepository.updateById(id, warehouseData);
  }
  
  async getWarehouseById(id) {
    const warehouse = await warehouseRepository.findById(id);
    if (!warehouse) {
      throw new NotFoundError('Không tìm thấy kho');
    }
    return warehouse;
  }

  /**
   * Lấy danh sách vải có sẵn trong kho (warehouseId) với filter/pagination
   */
  async getAvailableFabrics(warehouseId, queryOptions = {}) {
    // Kiểm tra kho tồn tại
    const warehouse = await warehouseRepository.findById(warehouseId);
    if (!warehouse) throw new NotFoundError('Kho không tồn tại');

    // Reuse repository method
    return await fabricRepository.findAvailableFabricsInWarehouse(warehouseId, queryOptions);
  }

  async deleteWarehouse(id) {
  const warehouse = await warehouseRepository.findById(id);
  if (!warehouse) {
    throw new NotFoundError('Không tìm thấy kho hàng');
  }
    
  return await warehouseRepository.deleteById(id);
}

  /**
   * Lấy danh sách kệ trong kho theo fabricId với chi tiết từng lô import
   * @param {number} warehouseId - ID kho
   * @param {number} fabricId - ID loại vải
   * @returns {Object} Object chứa fabric info, shelves, và các thống kê
   */
  async getShelvesByFabricId(warehouseId, fabricId) {
    // Kiểm tra kho tồn tại
    const warehouse = await warehouseRepository.findById(warehouseId);
    if (!warehouse) {
      throw new NotFoundError('Kho không tồn tại');
    }

    // Kiểm tra vải tồn tại
    const fabric = await fabricRepository.findById(fabricId);
    if (!fabric) {
      throw new NotFoundError('Vải không tồn tại');
    }

    const result = await warehouseRepository.findShelvesByFabricId(warehouseId, fabricId);
    
    // Tính tổng số lượng dựa trên totalFabricQuantity (sum của tất cả batches)
    const totalQuantity = result.shelves.reduce((sum, shelf) => sum + shelf.totalFabricQuantity, 0);
    
    // Tính tổng số lô (batches) trên tất cả các kệ
    const totalBatches = result.shelves.reduce((sum, shelf) => sum + shelf.batches.length, 0);
    
    return {
      warehouseId: parseInt(warehouseId),
      fabricId: parseInt(fabricId),
      fabric: result.fabric,
      totalShelves: result.shelves.length,
      totalBatches,
      totalQuantity,
      shelves: result.shelves
    };
  }

  /**
   * Tính toán phân bổ lấy vải tối ưu từ các kệ/lô
   * @param {number} warehouseId - ID kho
   * @param {number} fabricId - ID loại vải
   * @param {number} requiredQuantity - Số lượng cần lấy
   * @param {string} priority - Ưu tiên: 'NEWEST_FIRST', 'OLDEST_FIRST', 'LOWEST_PRICE', 'HIGHEST_PRICE', 'FEWEST_SHELVES'
   * @returns {Object} Kết quả phân bổ tối ưu
   */
  async calculateOptimalPickup(warehouseId, fabricId, requiredQuantity, priority = 'NEWEST_FIRST') {
    // Kiểm tra kho tồn tại
    const warehouse = await warehouseRepository.findById(warehouseId);
    if (!warehouse) {
      throw new NotFoundError('Kho không tồn tại');
    }

    // Kiểm tra vải tồn tại
    const fabric = await fabricRepository.findById(fabricId);
    if (!fabric) {
      throw new NotFoundError('Vải không tồn tại');
    }

    // Lấy tất cả các lô vải
    const result = await warehouseRepository.findAllBatchesByFabricId(warehouseId, fabricId);
    
    if (result.totalAvailable < requiredQuantity) {
      throw new ValidationError(
        `Số lượng yêu cầu (${requiredQuantity}) vượt quá số lượng có sẵn (${result.totalAvailable})`
      );
    }

    let remaining = requiredQuantity;
    const allocation = [];
    const usedShelves = new Set();
    let totalCost = 0;

    if (priority === 'FEWEST_SHELVES') {
      // Ưu tiên lấy ít kệ nhất: group theo shelf, sắp xếp theo tổng quantity giảm dần
      const shelfTotals = new Map();
      result.batches.forEach(batch => {
        if (!shelfTotals.has(batch.shelfId)) {
          shelfTotals.set(batch.shelfId, {
            shelfId: batch.shelfId,
            shelfCode: batch.shelfCode,
            totalQuantity: 0,
            batches: []
          });
        }
        const shelf = shelfTotals.get(batch.shelfId);
        shelf.totalQuantity += batch.availableQuantity;
        shelf.batches.push(batch);
      });

      // Sắp xếp kệ theo tổng quantity giảm dần (ưu tiên kệ có nhiều hàng nhất)
      const sortedShelves = Array.from(shelfTotals.values())
        .sort((a, b) => b.totalQuantity - a.totalQuantity);

      // Lấy từ kệ có nhiều hàng nhất trước
      for (const shelf of sortedShelves) {
        if (remaining <= 0) break;

        for (const batch of shelf.batches) {
          if (remaining <= 0) break;
          
          const pickQuantity = Math.min(batch.availableQuantity, remaining);
          if (pickQuantity > 0) {
            allocation.push({
              shelfId: batch.shelfId,
              shelfCode: batch.shelfCode,
              importId: batch.importId,
              importDate: batch.importDate,
              importPrice: batch.importPrice,
              availableQuantity: batch.availableQuantity,
              pickQuantity: pickQuantity
            });
            
            remaining -= pickQuantity;
            usedShelves.add(batch.shelfId);
            totalCost += pickQuantity * (batch.importPrice || 0);
          }
        }
      }
    } else {
      // Sắp xếp các lô theo priority
      let sortedBatches = [...result.batches];
      switch (priority) {
        case 'NEWEST_FIRST':
          // Ưu tiên nhập mới nhất trước (FIFO ngược - dùng cho hàng không hết hạn)
          sortedBatches.sort((a, b) => new Date(b.importDate) - new Date(a.importDate));
          break;
        case 'OLDEST_FIRST':
          // Ưu tiên nhập cũ nhất trước (FIFO - dùng cho hàng có hạn sử dụng)
          sortedBatches.sort((a, b) => new Date(a.importDate) - new Date(b.importDate));
          break;
        case 'LOWEST_PRICE':
          // Ưu tiên giá thấp nhất trước (tối ưu chi phí bán ra)
          sortedBatches.sort((a, b) => (a.importPrice || 0) - (b.importPrice || 0));
          break;
        case 'HIGHEST_PRICE':
          // Ưu tiên giá cao nhất trước (xử lý hàng giá cao trước)
          sortedBatches.sort((a, b) => (b.importPrice || 0) - (a.importPrice || 0));
          break;
        default:
          sortedBatches.sort((a, b) => new Date(b.importDate) - new Date(a.importDate));
      }

      // Phân bổ lấy hàng theo thứ tự priority đã sort
      for (const batch of sortedBatches) {
        if (remaining <= 0) break;
        
        const pickQuantity = Math.min(batch.availableQuantity, remaining);
        if (pickQuantity > 0) {
          allocation.push({
            shelfId: batch.shelfId,
            shelfCode: batch.shelfCode,
            importId: batch.importId,
            importDate: batch.importDate,
            importPrice: batch.importPrice,
            availableQuantity: batch.availableQuantity,
            pickQuantity: pickQuantity
          });
          
          remaining -= pickQuantity;
          usedShelves.add(batch.shelfId);
          totalCost += pickQuantity * (batch.importPrice || 0);
        }
      }
    }

    // Group kết quả theo shelf để dễ đọc
    const shelfMap = new Map();
    allocation.forEach(item => {
      if (!shelfMap.has(item.shelfId)) {
        shelfMap.set(item.shelfId, {
          shelfId: item.shelfId,
          shelfCode: item.shelfCode,
          totalPickQuantity: 0,
          batches: []
        });
      }
      const shelf = shelfMap.get(item.shelfId);
      shelf.totalPickQuantity += item.pickQuantity;
      shelf.batches.push({
        importId: item.importId,
        importDate: item.importDate,
        importPrice: item.importPrice,
        availableQuantity: item.availableQuantity,
        pickQuantity: item.pickQuantity
      });
    });

    return {
      warehouseId: parseInt(warehouseId),
      fabricId: parseInt(fabricId),
      fabric: result.fabric,
      requiredQuantity,
      totalAvailable: result.totalAvailable,
      priority,
      summary: {
        totalShelvesUsed: usedShelves.size,
        totalBatchesUsed: allocation.length,
        totalPickQuantity: requiredQuantity,
        totalCost: totalCost,
        averageCostPerUnit: requiredQuantity > 0 ? totalCost / requiredQuantity : 0
      },
      shelves: Array.from(shelfMap.values())
    };
  }

  /**
   * Điều chỉnh số lượng vải trên kệ (tăng hoặc giảm)
   * @param {Object} params - Tham số điều chỉnh
   * @param {number} params.shelfId - ID kệ
   * @param {number} params.fabricId - ID loại vải
   * @param {number} params.importId - ID lần nhập
   * @param {number} params.quantity - Số lượng điều chỉnh
   * @param {string} params.type - Loại: 'IMPORT' (tăng) hoặc 'DESTROY' (giảm)
   * @param {string} params.reason - Lý do điều chỉnh
   * @param {string} userId - ID người thực hiện
   */
  async adjustFabricQuantity(params, userId) {
    const { shelfId, fabricId, importId, quantity, type, reason } = params;

    // Validate shelf exists and get warehouse info
    const shelf = await warehouseRepository.findShelfById(shelfId);
    if (!shelf) {
      throw new NotFoundError('Không tìm thấy kệ');
    }

    const warehouseId = shelf.warehouseId;

    // Validate warehouse exists
    const warehouse = await warehouseRepository.findById(warehouseId);
    if (!warehouse) {
      throw new NotFoundError('Không tìm thấy kho');
    }

    // Check warehouse access permission with special permissions
    // User can access warehouse if they have MANAGER_ALL or MANAGER permission for this warehouse
    const hasAccess = await checkWarehouseAccess(userId, warehouseId);
    if (!hasAccess) {
      throw new ValidationError('Bạn không có quyền truy cập kho này');
    }

    // Validate fabric exists
    const fabric = await fabricRepository.findById(fabricId);
    if (!fabric) {
      throw new NotFoundError('Không tìm thấy vải');
    }

    // Validate import exists
    const importRecord = await warehouseRepository.findImportById(importId);
    if (!importRecord) {
      throw new NotFoundError('Không tìm thấy lần nhập');
    }
    if (importRecord.warehouseId !== warehouseId) {
      throw new ValidationError('Lần nhập không thuộc kho này');
    }

    // Get current fabric shelf record
    const fabricShelf = await warehouseRepository.findFabricShelf(shelfId, fabricId, importId);
    if (!fabricShelf) {
      throw new NotFoundError('Không tìm thấy vải này trên kệ với lần nhập này');
    }

    // Calculate new quantity
    let newQuantity;
    if (type === 'IMPORT') {
      newQuantity = fabricShelf.quantity + quantity;
    } else if (type === 'DESTROY') {
      newQuantity = fabricShelf.quantity - quantity;
      // Prevent negative quantity
      if (newQuantity < 0) {
        throw new ValidationError(`Số lượng vải không đủ để giảm. Số lượng hiện tại: ${fabricShelf.quantity}, yêu cầu giảm: ${quantity}`,'quantity');
      }
    } else {
      throw new ValidationError('Loại điều chỉnh không hợp lệ');
    }

    // Perform the adjustment with transaction
    const result = await warehouseRepository.adjustFabricQuantity({
      shelfId,
      fabricId,
      importId,
      newQuantity,
      type,
      reason,
      userId,
      oldQuantity: fabricShelf.quantity
    });

    return result;
  }

  /**
   * Lấy lịch sử điều chỉnh số lượng vải trên kệ với filter/sort/pagination
   */
  async getAdjustFabricHistoryAdvanced(queryOptions = {}) {
    return await warehouseRepository.findAdjustFabricWithAdvancedQuery(queryOptions);
  }
  
}
export const warehouseService = new WarehouseService();