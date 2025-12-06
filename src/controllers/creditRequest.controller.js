import * as creditRequestService from '../services/creditRequest.service.js';
import { buildQueryParams } from '../utils/filter-builder.js';

//
// === Lấy danh sách lịch sử CreditRequest (admin hoặc user tự xem)
//
export const getAllCreditRequests = async (req, res, next) => {
  try {
    const queryParams = buildQueryParams(req.query, {
      filterFields: ['status', 'userId'],
      dateRangeConfig: {
        fromField: 'createdFrom',
        toField: 'createdTo',
        targetField: 'createdAt'
      }
    });

    const result = await creditRequestService.getAllCreditRequests(queryParams);

    res.json({
      message: 'Lấy danh sách yêu cầu hạn mức thành công',
      ...result
    });
  } catch (error) {
    next(error);
  }
};

//
// === Tạo CreditRequest mới (initial hoặc increase)
//
export const createCreditRequest = async (req, res, next) => {
  try {
    const type = req.path.includes('increase') ? 'INCREASE' : 'INITIAL';
    const requestData = {
      ...req.body,
      userId: req.user.id,
      type
    };

    const created = await creditRequestService.createCreditRequest(requestData);

    res.status(201).json({
      message: `Tạo đơn ${type === 'INITIAL' ? 'đăng ký nợ' : 'tăng hạn mức'} thành công`,
      request: created
    });
  } catch (error) {
    next(error);
  }
};

//
// === Lấy chi tiết 1 yêu cầu theo ID
//
export const getCreditRequestById = async (req, res, next) => {
  try {
    const { id } = req.params;

    let request = await creditRequestService.getCreditRequestById(id);

    res.json({
      message: 'Lấy thông tin yêu cầu thành công',
      request
    });
  } catch (error) {
    next(error);
  }
};

//
// === Duyệt đơn đăng ký nợ lần đầu (Initial)
//
export const approveInitialRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { approvedLimit, note } = req.body;

    const updated = await creditRequestService.approveInitialRequest(id, {
      approvedLimit,
      note,
      adminId: req.user.id
    });

    res.json({
      message: 'Duyệt đơn đăng ký nợ thành công',
      request: updated
    });
  } catch (error) {
    next(error);
  }
};

//
// === Duyệt đơn tăng hạn mức (Increase)
//
export const approveIncreaseRequest = async (req, res, next) => {
  try {
    const { id } = req.params;

    const updated = await creditRequestService.approveIncreaseRequest(id, {
      adminId: req.user.id
    });

    res.json({
      message: 'Duyệt đơn tăng hạn mức thành công',
      request: updated
    });
  } catch (error) {
    next(error);
  }
};

//
// === Từ chối đơn (Initial hoặc Increase)
//
export const rejectRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rejectReason } = req.body;

    const updated = await creditRequestService.rejectRequest(id, {
      rejectReason,
      adminId: req.user.id
    });

    res.json({
      message: 'Từ chối đơn thành công',
      request: updated
    });
  } catch (error) {
    next(error);
  }
};
