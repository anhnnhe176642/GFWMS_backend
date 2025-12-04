// ...existing code...
import * as customerService from '../services/customer.service.js';
import { buildQueryParams } from '../utils/filter-builder.js';

/** 🔹 Lấy danh sách khách hàng */
export const getAllCustomers = async (req, res, next) => {
  try {
    const queryParams = buildQueryParams(req.query, {
      filterFields: ['status', 'gender'],
      dateRangeConfig: {
        fromField: 'createdFrom',
        toField: 'createdTo',
        targetField: 'createdAt'
      }
    });

    const result = await customerService.getAllCustomersAdvanced(queryParams);
    
    res.json({
      message: 'Lấy danh sách khách hàng thành công',
      ...result
    });
  } catch (error) {
    next(error);
  }
};

/** 🔹 Lấy chi tiết khách hàng */
export const getCustomerById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const customer = await customerService.getCustomerById(id);
    
    res.json({
      message: 'Lấy thông tin khách hàng thành công',
      customer
    });
  } catch (error) {
    next(error);
  }
};

// New: Lấy danh sách orders của customer
export const getCustomerOrders = async (req, res, next) => {
  try {
    const { id } = req.params;
    const queryParams = buildQueryParams(req.query, {
      filterFields: ['status'],
      dateRangeConfig: {
        fromField: 'createdFrom',
        toField: 'createdTo',
        targetField: 'createdAt'
      }
    });

    const result = await customerService.getCustomerOrders(id, queryParams);

    res.json({
      message: 'Lấy danh sách đơn hàng của khách hàng thành công',
      ...result
    });
  } catch (error) {
    next(error);
  }
};

// New: Lấy tổng quan trạng thái đơn hàng của customer
export const getCustomerOrderStatusSummary = async (req, res, next) => {
  try {
    const { id } = req.params;
    const summary = await customerService.getCustomerOrderStatusSummary(id);

    res.json({
      message: 'Tổng quan trạng thái đơn hàng của khách hàng',
      data: summary
    });
  } catch (error) {
    next(error);
  }
};
// ...existing code...