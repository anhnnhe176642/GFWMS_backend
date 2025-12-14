import { warehouseService } from '../services/warehouse.service.js';
import { shelfService } from '../services/shelf.service.js';
import { buildQueryParams } from '../utils/filter-builder.js';

export const getAllWarehouses = async (req, res, next) => {
  try {
    const queryParams = buildQueryParams(req.query, {
      filterFields: ['status'],
      dateRangeConfig: { 
        fromField: 'createdFrom', 
        toField: 'createdTo', 
        targetField: 'createdAt' 
      }
    });

    // Pass userId để service tự lọc dựa trên quyền
    const result = await warehouseService.getAllWarehousesAdvanced(queryParams, req.user.id);
    res.json({
      message: 'Lấy danh sách kho thành công',
      ...result
    });
  } catch (error) {
    next(error);
  }
};

export const createWarehouse = async (req, res, next) => {
  try {
    const warehouse = await warehouseService.createWarehouse(req.body);
    res.status(201).json({
      message: 'Tạo kho thành công',
      warehouse
    });
  } catch (error) {
    next(error);
  }
};



export const getWarehouseById = async (req, res, next) => {
  try {
    const warehouse = await warehouseService.getWarehouseById(req.params.id);
    res.json({
      message: 'Lấy thông tin kho thành công',
      warehouse
    });
  } catch (error) {
    next(error);
  }
};

export const updateWarehouse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const warehouse = await warehouseService.updateWarehouse(id, updateData);
    res.json({
      message: 'Cập nhật kho thành công',
      warehouse
    });
  } catch (error) {
    next(error);
  }
};

export const deleteWarehouse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await warehouseService.deleteWarehouse(id);
    
    res.status(200).json({
      success: true,
      message: 'Xóa kho hàng thành công',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const getWarehouseFabrics = async (req, res, next) => {
  try {
    const warehouseId = req.params.id;

    const queryParams = buildQueryParams(req.query, {
      filterFields: ['glossId', 'categoryId', 'colorId', 'supplierId'],
      dateRangeConfig: { 
        fromField: 'createdFrom', 
        toField: 'createdTo', 
        targetField: 'createdAt' 
      }
    });

    const result = await warehouseService.getAvailableFabrics(warehouseId, queryParams);
    res.json({
      message: 'Lấy danh sách vải có sẵn trong kho thành công',
      ...result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get shelves in a warehouse with optional grouping by fabric attributes
 */
export const getWarehouseShelves = async (req, res, next) => {
  try {
    const warehouseId = req.params.id;
    const { groupBy, page, limit, search, sortBy, order } = req.query;
    
    const options = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      search: search || '',
      sortBy: sortBy || 'createdAt',
      order: order || 'desc'
    };

    let result;
    if (groupBy) {
      const groupByFields = groupBy.split(',').map(f => f.trim());
      result = await shelfService.getShelvesInWarehouseGroupedByFabric(warehouseId, groupByFields, options);
    } else {
      // Get simple shelf list for warehouse
      result = await shelfService.getAllShelvesAdvanced(
        buildQueryParams(req.query, {
          filterFields: ['warehouseId'],
          dateRangeConfig: {
            fromField: 'createdFrom',
            toField: 'createdTo',
            targetField: 'createdAt'
          }
        }),
        null
      );
    }

    res.json({
      message: groupBy ? 'Lấy danh sách kệ trong kho gom nhóm thành công' : 'Lấy danh sách kệ trong kho thành công',
      ...result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get shelves in a warehouse by fabricId - returns shelves containing that fabric with quantities
 */
export const getWarehouseShelvesByFabric = async (req, res, next) => {
  try {
    const { id: warehouseId, fabricId } = req.params;
    
    const result = await warehouseService.getShelvesByFabricId(warehouseId, fabricId);
    
    res.json({
      message: 'Lấy danh sách kệ theo loại vải thành công',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Calculate optimal pickup allocation for fabric from warehouse
 * Returns optimal distribution of picking from shelves/batches based on priority
 */
export const calculateFabricPickup = async (req, res, next) => {
  try {
    const { id: warehouseId, fabricId } = req.params;
    const { quantity, priority } = req.query;
    
    const result = await warehouseService.calculateOptimalPickup(
      warehouseId, 
      fabricId, 
      parseInt(quantity),
      priority || 'NEWEST_FIRST'
    );
    
    res.json({
      message: 'Tính toán phân bổ lấy hàng thành công',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Điều chỉnh số lượng vải trên kệ (tăng hoặc giảm)
 */
export const adjustFabricQuantity = async (req, res, next) => {
  try {
    const { shelfId } = req.params;
    const { fabricId, importId, quantity, type, reason } = req.body;

    const result = await warehouseService.adjustFabricQuantity({
      shelfId: parseInt(shelfId),
      fabricId: parseInt(fabricId),
      importId: parseInt(importId),
      quantity: parseInt(quantity),
      type,
      reason
    }, req.user.id);

    res.json({
      message: 'Điều chỉnh số lượng vải thành công',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Lấy lịch sử điều chỉnh số lượng vải trên kệ
 */
export const getAdjustFabricHistory = async (req, res, next) => {
  try {
    const queryParams = buildQueryParams(req.query, {
      filterFields: ['warehouseId', 'fabricId', 'shelfId', 'categoryId', 'colorId', 'supplierId', 'type', 'userId'],
      dateRangeConfig: { 
        fromField: 'createdFrom', 
        toField: 'createdTo', 
        targetField: 'createdAt' 
      }
    });

    const result = await warehouseService.getAdjustFabricHistoryAdvanced(queryParams);
    res.json({
      message: 'Lấy lịch sử điều chỉnh vải thành công',
      ...result
    });
  } catch (error) {
    next(error);
  }
};
