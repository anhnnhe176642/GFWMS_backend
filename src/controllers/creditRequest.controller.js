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

export const createInitialCreditRequest = async (req, res, next) => {
  try {
    const requestData = {
      ...req.body,
      userId: req.user.id,
      type: 'INITIAL'
    };

    const created = await creditRequestService.createInitialCreditRequest(requestData);

    res.status(201).json({
      message: 'Tạo đơn đăng ký nợ thành công',
      request: created
    });
  } catch (error) {
    next(error);
  }
};

export const createIncreaseCreditRequest = async (req, res, next) => {
  try {
    const requestData = {
      ...req.body,
      userId: req.user.id,
      type: 'INCREASE'
    };

    const created = await creditRequestService.createIncreaseCreditRequest(requestData);

    res.status(201).json({
      message: 'Tạo đơn tăng hạn mức thành công',
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

export const approveRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, requestLimit, note } = req.body;

    const updated = await creditRequestService.approveCreditRequest(id, {
      status,
      requestLimit,
      note,
      adminId: req.user.id
    });

    res.json({
      message: 'Duyệt đơn thành công',
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
