import * as creditInvoiceService from '../services/creditInvoice.service.js';
import { buildQueryParams } from '../utils/filter-builder.js';

/**
 * Lấy danh sách Credit Invoice của user
 */
export const getMyCreditInvoices = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const queryParams = buildQueryParams(req.query, {
      filterFields: ['status'],
      defaultSortBy: 'dueDate',
      defaultOrder: 'desc'
    });
    
    const result = await creditInvoiceService. getMyCreditInvoices(userId, queryParams);
    
    res.json({
      message: 'Lấy danh sách Credit Invoice thành công',
      ... result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * [ADMIN/STAFF] Lấy tất cả Credit Invoice
 */
export const getAllCreditInvoices = async (req, res, next) => {
  try {
    const queryParams = buildQueryParams(req.query, {
      filterFields: ['status'],
      defaultSortBy: 'createdAt',
      defaultOrder: 'desc'
    });
    
    const result = await creditInvoiceService.getAllCreditInvoices(queryParams);
    
    res.json({
      message: 'Lấy danh sách Credit Invoice thành công',
      ...result
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
    const { creditInvoiceId } = req. params;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    const creditInvoice = await creditInvoiceService.getCreditInvoiceDetail(
      creditInvoiceId, 
      userId, 
      userRole
    );
    
    res.json({
      message: 'Lấy chi tiết Credit Invoice thành công',
      data: creditInvoice
    });
  } catch (error) {
    next(error);
  }
};

