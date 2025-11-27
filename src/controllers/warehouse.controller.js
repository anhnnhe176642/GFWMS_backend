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
    
    const result = await warehouseService.getAllWarehousesAdvanced(queryParams);
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
