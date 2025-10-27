import * as customerService from '../services/customer.service.js';
import { buildQueryParams } from '../utils/filter-builder.js';

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