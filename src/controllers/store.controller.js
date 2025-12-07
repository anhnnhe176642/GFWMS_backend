import { storeService } from '../services/store.service.js';
import { buildQueryParams } from '../utils/filter-builder.js';

//  Lấy danh sách store (có filter, search, date range)
export const getAllStores = async (req, res, next) => {
  try {
    const queryParams = buildQueryParams(req.query, {
      filterFields: ['isActive'],
      searchFields: ['name', 'address'],
      dateRangeConfig: { 
        fromField: 'createdFrom', 
        toField: 'createdTo', 
        targetField: 'createdAt' 
      }
    });

    const result = await storeService.getAllStoresAdvanced(queryParams);
    res.json({
      message: 'Lấy danh sách cửa hàng thành công',
      ...result
    });
  } catch (error) {
    next(error);
  }
};

//  Tạo mới store
export const createStore = async (req, res, next) => {
  try {
    const store = await storeService.createStore(req.body);
    res.status(201).json({
      message: 'Tạo cửa hàng thành công',
      store
    });
  } catch (error) {
    next(error);
  }
};

//  Lấy chi tiết store theo ID
export const getStoreById = async (req, res, next) => {
  try {
    const store = await storeService.getStoreById(req.params.id);
    res.json({
      message: 'Lấy thông tin cửa hàng thành công',
      store
    });
  } catch (error) {
    next(error);
  }
};

//  Cập nhật store
export const updateStore = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const store = await storeService.updateStore(id, updateData);
    res.json({
      message: 'Cập nhật cửa hàng thành công',
      store
    });
  } catch (error) {
    next(error);
  }
};

//  Xóa (hoặc ngưng hoạt động) store
export const deleteStore = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await storeService.deleteStore(id);
    
    res.status(200).json({
      success: true,
      message: 'Xóa cửa hàng thành công',
      data: result
    });
  } catch (error) {
    next(error);
  }
};


/**
 * Phân công staff cho store
 */
export const assignStaffToStore = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { staffIds } = req.body;
    
    const result = await storeService.assignStaffToStore(id, staffIds);
    res.json({
      message: 'Phân công nhân viên thành công',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Hủy phân công staff khỏi store
 */
export const unassignStaffFromStore = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { staffId } = req.body;
    
    const result = await storeService.unassignStaffFromStore(id, staffId);
    res. json({
      message: 'Hủy phân công nhân viên thành công',
      staff: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Lấy danh sách staff của store
 */
export const getStaffsByStore = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const queryParams = buildQueryParams(req.query, {
      filterFields: ['gender'],
      searchFields: ['fullname', 'email', 'phone']
    });
    
    const result = await storeService.getStaffsByStoreId(id, queryParams);
    
    res.json({
      message: 'Lấy danh sách nhân viên thành công',
      ... result
    });
  } catch (error) {
    next(error);
  }
};
