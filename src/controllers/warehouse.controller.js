import * as warehouseService from '../services/warehouse.service.js';
import { buildQueryParams } from '../utils/filter-builder.js';

export const getAllWarehouses = async (req, res, next) => {
  try {
    const {
      page,
      limit,
      search,
      sortBy,
      order,
      status,        // đảm bảo truyền qua service/repo
      createdFrom,
      createdTo
    } = req.query;

    const result = await warehouseService.getAllWarehousesAdvanced({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search,
      sortBy,
      order,
      status,        // 'ACTIVE' | 'INACTIVE' | undefined
      createdFrom,
      createdTo
    });

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
    const warehouseData = req.body;
    
    const warehouse = await warehouseService.createWarehouse(warehouseData);
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
    const { id } = req.params;
    const warehouse = await warehouseService.getWarehouseById(id);
    
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
    const warehouse = await warehouseService.deleteWarehouse(id);
    
    res.status(200).json({
      success: true,
      data: warehouse,
      message: 'Xóa warehouse thành công'
    });
  } catch (error) {
    next(error);
  }
};


export const restoreWarehouse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const warehouse = await warehouseService.restoreWarehouse(id);
    
    res.status(200).json({
      success: true,
      data: warehouse,
      message: 'Khôi phục warehouse thành công'
    });
  } catch (error) {
    next(error);
  }
};

export const getDeletedWarehouses = async (req, res, next) => {
  try {
    const warehouses = await warehouseService.getDeletedWarehouses();
    
    res.status(200).json({
      success: true,
      data: warehouses,
      message: 'Lấy danh sách kho đã xóa thành công'
    });
  } catch (error) {
    next(error);
  }
};

export const searchWarehouses = async (req, res, next) => {
  try {
    const queryParams = buildQueryParams(req.query, {
      filterFields: ['name', 'address'], 
      dateRangeConfig: {
        fromField: 'createdFrom',
        toField: 'createdTo',
        targetField: 'createdAt'
      }
    });

    const result = await warehouseService.getAllWarehousesAdvanced(queryParams);
    
    res.json({
      message: 'Tìm kiếm kho thành công',
      ...result
    });
  } catch (error) {
    next(error);
  }
};