import { NotFoundError } from '../utils/errors.js';
import { invoiceRepository } from '../repositories/invoice.repository.js';

/**
 *  Lấy chi tiết Invoice theo ID
 */
export const getInvoiceById = async (id) => {
  const invoice = await invoiceRepository.findById(id);

  if (!invoice) {
    throw new NotFoundError('Hóa đơn không tồn tại');
  }

  return invoice;
};

/**
 *  Lấy danh sách Invoice nâng cao (lọc, tìm kiếm, sắp xếp)
 */
export const getAllInvoicesAdvanced = async (queryOptions) => {
  return await invoiceRepository.findWithAdvancedQuery(queryOptions);
};

/**
 *  Lấy danh sách Invoice của user hiện tại (phân trang, lọc, sắp xếp)
 */
export const getMyInvoices = async (userId, queryOptions) => {
  if (!userId) {
    throw new Error('User ID không tồn tại');
  }
  return await invoiceRepository.findByUserIdAdvanced(userId, queryOptions);
};
