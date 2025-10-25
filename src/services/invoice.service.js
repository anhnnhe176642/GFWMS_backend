import { NotFoundError } from '../utils/errors.js';
import { invoiceRepository } from '../repositories/invoice.repository.js';

/**
 * 🔹 Lấy danh sách tất cả các Invoice (phân trang cơ bản)
 */
export const getAllInvoices = async (page, limit) => {
  return await invoiceRepository.findWithPagination(page, limit);
};

/**
 * 🔹 Lấy chi tiết Invoice theo ID
 */
export const getInvoiceById = async (id) => {
  const invoice = await invoiceRepository.findById(id);

  if (!invoice) {
    throw new NotFoundError('Hóa đơn không tồn tại');
  }

  return invoice;
};

/**
 * 🔹 Lấy danh sách Invoice nâng cao (lọc, tìm kiếm, sắp xếp)
 */
export const getAllInvoicesAdvanced = async (queryOptions) => {
  return await invoiceRepository.findWithAdvancedQuery(queryOptions);
};
