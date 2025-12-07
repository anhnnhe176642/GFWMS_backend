import { NotFoundError } from '../utils/errors.js';
import { creditRegistrationRepository } from '../repositories/creditRegistration.repository.js';
import { invoiceRepository } from '../repositories/invoice.repository.js';

/**
 * Lấy chi tiết Credit Registration theo ID
 */
export const getCreditRegistrationById = async (id) => {
  const record = await creditRegistrationRepository.findById(id);
  if (!record) throw new NotFoundError('Đơn đăng ký không tồn tại');
  return record;
};

/**
 * Lấy danh sách Credit Registration với filter, pagination, sort
 */
export const getAllCreditRegistrations = async (queryOptions) => {
  return await creditRegistrationRepository.findWithAdvancedQuery(queryOptions);
};

/**
 * Lấy tổng quan / điểm uy tín khách hàng
 */
export const getCreditSummary = async (userId) => {
  const invoices = await invoiceRepository.findByUserId(userId);

  if (!invoices.length) {
    return {
      totalOrders: 0,
      totalAmount: 0,
      averageOrderValue: 0,
      lastOrderDate: null,
      recommendedCreditLimit: 0
    };
  }

  const totalOrders = invoices.length;
  const totalAmount = invoices.reduce(
    (sum, inv) => sum + (inv.order?.totalAmount || 0),
    0
  );

  const averageOrderValue = totalAmount / totalOrders;
  const lastOrderDate = new Date(
    Math.max(...invoices.map(inv => new Date(inv.order?.orderDate).getTime()))
  );

  const recommendedCreditLimit = Math.round(totalAmount * 0.3); 
  return {
    totalOrders,
    totalAmount,
    averageOrderValue,
    lastOrderDate,
    recommendedCreditLimit
  };
};

