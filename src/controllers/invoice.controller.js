import * as invoiceService from '../services/invoice.service.js';
import { buildQueryParams } from '../utils/filter-builder.js';

/**  Lấy danh sách Invoice (hỗ trợ filter, sort, pagination) */
export const getAllInvoices = async (req, res, next) => {
  try {
    const queryParams = buildQueryParams(req.query, {
      filterFields: ['invoiceStatus'],
      dateRangeConfig: {
        fromField: 'createdFrom',
        toField: 'createdTo',
        targetField: 'createdAt'
      }
    });

    const result = await invoiceService.getAllInvoicesAdvanced(queryParams);

    res.json({
      message: 'Lấy danh sách hóa đơn thành công',
      ...result
    });
  } catch (error) {
    next(error);
  }
};


/**  Lấy Invoice theo ID */
export const getInvoiceById = async (req, res, next) => {
  try {
    const { invoiceId: id } = req.params;
    const invoice = await invoiceService.getInvoiceById(parseInt(id));

    if (!invoice) {
      return res.status(404).json({ message: 'Không tìm thấy hóa đơn' });
    }

    res.json({
      message: 'Lấy thông tin hóa đơn thành công',
      invoice
    });
  } catch (error) {
    next(error);
  }
};

/**  Lấy danh sách hóa đơn của user hiện tại */
export const getMyInvoices = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const queryParams = buildQueryParams(req.query, {
      filterFields: ['invoiceStatus'],
      dateRangeConfig: {
        fromField: 'createdFrom',
        toField: 'createdTo',
        targetField: 'createdAt'
      }
    });

    const result = await invoiceService.getMyInvoices(userId, queryParams);

    res.json({
      message: 'Lấy danh sách hóa đơn của bạn thành công',
      ...result
    });
  } catch (error) {
    next(error);
  }
};
