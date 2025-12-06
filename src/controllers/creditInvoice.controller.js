import * as creditInvoiceRepository from '../repositories/creditInvoice.repository.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';

/**
 * Lấy danh sách Credit Invoice của user
 */
export const getMyCreditInvoices = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;
    
    const result = await creditInvoiceRepository. findByUserId(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      status
    });
    
    res.json({
      message: 'Lấy danh sách Credit Invoice thành công',
      data: result. creditInvoices,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Xem chi tiết Credit Invoice
 */
export const getCreditInvoiceDetail = async (req, res, next) => {
  try {
    const { creditInvoiceId } = req.params;
    const userId = req.user.id;
    
    const creditInvoice = await creditInvoiceRepository.findById(creditInvoiceId);
    
    if (!creditInvoice) {
      throw new NotFoundError('Không tìm thấy Credit Invoice');
    }
    
    // Check quyền
    if (creditInvoice.credit.userId !== userId && ! ['STAFF', 'ADMIN'].includes(req.user.role)) {
      throw new BadRequestError('Bạn không có quyền xem Credit Invoice này');
    }
    
    res.json({
      message: 'Lấy chi tiết Credit Invoice thành công',
      data: creditInvoice
    });
  } catch (error) {
    next(error);
  }
};