import Joi from 'joi';

/**
 * Date filter schema
 */
const dateSchema = Joi.date().iso().messages({
  'date.base': 'Ngày không hợp lệ',
  'date.format': 'Định dạng ngày phải là ISO 8601 (YYYY-MM-DD)'
});

/**
 * Store ID schema
 */
const storeIdSchema = Joi.number().integer().positive().messages({
  'number.base': 'Store ID phải là số',
  'number.integer': 'Store ID phải là số nguyên',
  'number.positive': 'Store ID phải lớn hơn 0'
});

/**
 * Period schema for revenue statistics
 */
const periodSchema = Joi.string().valid('day', 'month', 'year').messages({
  'any.only': 'Kỳ thống kê phải là: day, month, year'
});

/**
 * Limit schema for pagination
 */
const limitSchema = Joi.number().integer().min(1).max(100).messages({
  'number.base': 'Limit phải là số',
  'number.integer': 'Limit phải là số nguyên',
  'number.min': 'Limit phải ít nhất là 1',
  'number.max': 'Limit tối đa là 100'
});

/**
 * Threshold schema for low stock
 */
const thresholdSchema = Joi.number().integer().min(0).messages({
  'number.base': 'Ngưỡng phải là số',
  'number.integer': 'Ngưỡng phải là số nguyên',
  'number.min': 'Ngưỡng phải >= 0'
});

/**
 * Base query schema for date range filters
 */
export const dateRangeQuerySchema = Joi.object({
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
  storeId: storeIdSchema.optional()
}).custom((value, helpers) => {
  // Validate that if one date is provided, both must be provided
  if ((value.startDate && !value.endDate) || (!value.startDate && value.endDate)) {
    return helpers.error('any.custom', { 
      message: 'Phải cung cấp cả ngày bắt đầu và ngày kết thúc' 
    });
  }
  return value;
});

/**
 * Dashboard overview query schema
 */
export const dashboardOverviewQuerySchema = dateRangeQuerySchema;

/**
 * Full dashboard query schema
 */
export const fullDashboardQuerySchema = Joi.object({
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
  storeId: storeIdSchema.optional(),
  period: periodSchema.optional().default('day')
}).custom((value, helpers) => {
  if ((value.startDate && !value.endDate) || (!value.startDate && value.endDate)) {
    return helpers.error('any.custom', { 
      message: 'Phải cung cấp cả ngày bắt đầu và ngày kết thúc' 
    });
  }
  return value;
});

/**
 * Revenue by period query schema
 */
export const revenueByPeriodQuerySchema = Joi.object({
  period: periodSchema.optional().default('day'),
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
  storeId: storeIdSchema.optional()
}).custom((value, helpers) => {
  if ((value.startDate && !value.endDate) || (!value.startDate && value.endDate)) {
    return helpers.error('any.custom', { 
      message: 'Phải cung cấp cả ngày bắt đầu và ngày kết thúc' 
    });
  }
  return value;
});

/**
 * Revenue by store query schema (no storeId filter)
 */
export const revenueByStoreQuerySchema = Joi.object({
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional()
}).custom((value, helpers) => {
  if ((value.startDate && !value.endDate) || (!value.startDate && value.endDate)) {
    return helpers.error('any.custom', { 
      message: 'Phải cung cấp cả ngày bắt đầu và ngày kết thúc' 
    });
  }
  return value;
});

/**
 * Profit by product query schema
 */
export const profitByProductQuerySchema = Joi.object({
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
  storeId: storeIdSchema.optional(),
  limit: limitSchema.optional().default(20)
}).custom((value, helpers) => {
  if ((value.startDate && !value.endDate) || (!value.startDate && value.endDate)) {
    return helpers.error('any.custom', { 
      message: 'Phải cung cấp cả ngày bắt đầu và ngày kết thúc' 
    });
  }
  return value;
});

/**
 * Top customers query schema
 */
export const topCustomersQuerySchema = Joi.object({
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
  storeId: storeIdSchema.optional(),
  limit: limitSchema.optional().default(10)
}).custom((value, helpers) => {
  if ((value.startDate && !value.endDate) || (!value.startDate && value.endDate)) {
    return helpers.error('any.custom', { 
      message: 'Phải cung cấp cả ngày bắt đầu và ngày kết thúc' 
    });
  }
  return value;
});

/**
 * Low stock query schema
 */
export const lowStockQuerySchema = Joi.object({
  storeId: storeIdSchema.optional(),
  threshold: thresholdSchema.optional().default(10)
});
