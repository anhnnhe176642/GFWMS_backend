import { NotFoundError } from '../utils/errors.js';
import { userRepository } from '../repositories/user.repository.js';

export const getAllCustomersAdvanced = async (queryOptions) => {
  // Thêm filter để chỉ lấy users có role là CUSTOMER
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