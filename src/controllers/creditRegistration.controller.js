import * as creditRegistrationService from '../services/creditRegistration.service.js';
import { buildQueryParams } from '../utils/filter-builder.js';

/**
 * GET: Lấy danh sách Credit Registration
 */
export const getAllCreditRegistrations = async (req, res, next) => {
  try {
    const queryParams = buildQueryParams(req.query, {
      filterFields: ['status'],
      dateRangeConfig: {
        fromField: 'createdFrom',
        toField: 'createdTo',
        targetField: 'createdAt'
      }
    });

    const result = await creditRegistrationService.getAllCreditRegistrations(queryParams);

    res.json({
      message: 'Lấy danh sách Credit Registration thành công',
      ...result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET: Lấy chi tiết Credit Registration theo ID
 */
export const getCreditRegistrationById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const creditRegistration = await creditRegistrationService.getCreditRegistrationById(id);

    res.json({
      message: 'Lấy thông tin Credit Registration thành công',
      creditRegistration
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET: Lấy tổng quan / điểm uy tín của khách hàng
 */
export const getCreditSummary = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const summary = await creditRegistrationService.getCreditSummary(userId);

    res.json({
      message: 'Lấy tổng quan khách hàng thành công',
      userId,
      ...summary
    });
  } catch (error) {
    next(error);
  }
};

