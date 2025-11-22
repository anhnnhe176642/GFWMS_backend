import * as orderService from '../services/order.service.js';
import { BadRequestError } from '../utils/errors.js';
import { buildQueryParams } from '../utils/filter-builder.js';

// Tạo đơn hàng online (Customer)
export const createOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await orderService.createOrder(req.body, userId);
    
    const { order, requiresPayment, excessAmount } = result;
    
    if (requiresPayment) {
      return res.status(201).json({
        message: excessAmount 
          ? `Vượt hạn mức ${excessAmount.toLocaleString('vi-VN')}đ. Vui lòng thanh toán trong 15 phút.`
          : 'Vui lòng thanh toán trong 15 phút.',
        data: {
          order,
          paymentAmount: excessAmount || order.totalAmount,
          deadline: order.paymentDeadline,
          testPayment: {
            method: 'POST',
            url: `/api/v1/orders/${order.id}/simulate-payment`,
            body: { success: true }
          }
        }
      });
    } else {
      return res.status(201).json({
        message: 'Tạo đơn hàng ghi nợ thành công. Đơn hàng đã được tự động duyệt.',
        data: { order }
      });
    }
  } catch (error) {
    next(error);
  }
};

// Giả lập thanh toán de test
export const simulatePayment = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { success = true } = req.body;
    
    if (!success) {
      return res.status(400).json({
        message: 'Giả lập thanh toán thất bại',
        data: { orderId, status: 'FAILED' }
      });
    }
    
    const order = await orderService.simulatePayment(parseInt(orderId), success);
    
    res.status(200).json({
      message: 'Giả lập thanh toán thành công',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// Tạo đơn hàng offline (Staff)
export const createOfflineOrder = async (req, res, next) => {
  try {
    const staffId = req.user.id;
    const result = await orderService.createOfflineOrder(req.body, staffId);
    
    res.status(201).json({
      message: result.message,
      data: result.order
    });
  } catch (error) {
    next(error);
  }
};

// Kiểm tra credit khách hàng (Staff)
export const checkCustomerCredit = async (req, res, next) => {
  try {
    const { phone } = req.query;
    
    if (!phone) {
      throw new BadRequestError('Số điện thoại là bắt buộc');
    }
    
    const result = await orderService.checkCustomerCredit(phone);
    
    res.json({
      message: 'Lấy thông tin khách hàng thành công',
      data: result
    });
  } catch (error) {
    next(error);
  }
};


export const getAllOrders = async (req, res, next) => {
  try {
    const queryParams = buildQueryParams(req.query, {
      filterFields: ['status', 'paymentType', 'isOffline'],
      dateRangeConfig: { 
        fromField: 'createdFrom', 
        toField: 'createdTo', 
        targetField: 'createdAt' 
      }
    });
    
    if (queryParams.filters.isOffline !== undefined) {
      if (queryParams.filters.isOffline === 'true') {
        queryParams.filters.isOffline = true;
      } else if (queryParams.filters.isOffline === 'false') {
        queryParams.filters.isOffline = false;
      } else if (Array.isArray(queryParams.filters.isOffline)) {
        queryParams.filters.isOffline = queryParams.filters.isOffline.map(val => val === 'true');
      } else {
        delete queryParams.filters.isOffline;
      }
    }
    
    const result = await orderService.getAllOrders(queryParams);
    
    res.json({
      message: 'Lấy danh sách đơn hàng thành công',
      ...result
    });
  } catch (error) {
    next(error);
  }
};


export const getMyOrders = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const queryParams = buildQueryParams(req.query, {
      filterFields: ['status', 'paymentType'],
      dateRangeConfig: { 
        fromField: 'createdFrom', 
        toField: 'createdTo', 
        targetField: 'createdAt' 
      }
    });
    
    const result = await orderService.getMyOrders(userId, queryParams);
    
    res.json({
      message: 'Lấy danh sách đơn hàng thành công',
      ...result
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;
    const role = req.user.role;

    const order = await orderService.getOrderById(
      parseInt(orderId),
      userId,
      role
    );

    res.status(200).json({
      message: 'Lấy thông tin đơn hàng thành công',
      data: order
    });
  } catch (error) {
    next(error);
  }
};