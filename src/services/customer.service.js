import { NotFoundError } from '../utils/errors.js';
import { userRepository } from '../repositories/user.repository.js';
import { orderRepository } from '../repositories/order.repository.js';

export const getAllCustomersAdvanced = async (queryOptions) => {
  const customerOptions = {
    ...queryOptions,
    filters: {
      ...queryOptions.filters,
      role: 'CUSTOMER'
    }
  };
  
  return await userRepository.findWithAdvancedQuery(customerOptions);
};

export const getCustomerById = async (id) => {
  const customer = await userRepository.findById(id);
  
  if (!customer || customer.role !== 'CUSTOMER') {
    throw new NotFoundError('Khách hàng không tồn tại');
  }
  
  return customer;
};

// New: Lấy danh sách orders của customer (filter/sort/pagination)
export const getCustomerOrders = async (customerId, queryOptions) => {
  // service đảm bảo chỉ lấy orders của customerId
  return await orderRepository.findByCustomer(customerId, queryOptions);
};

// New: Lấy tổng quan số lượng orders theo trạng thái cho customer
export const getCustomerOrderStatusSummary = async (customerId) => {
  return await orderRepository.getStatusSummaryByCustomer(customerId);
};


