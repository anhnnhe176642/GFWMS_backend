import Joi from 'joi';
import {
  pageSchema,
  limitSchema,
  querySchema,
  createSortBySchema,
  sortOrderSchema,
  dateFromSchema,
  dateToSchema,
  createMultiValueFilterSchema
} from './common.validation.js';

/**
 * ============================
 * FIELD VALIDATIONS
 * ============================
 */

const invoiceStatusSchema = Joi.string()
  .valid('UNPAID','PAID','OVERDUE','CREDIT','REFUNDED','CANCELED')
  .trim()
  .messages({
    'string.base': 'Trạng thái hóa đơn phải là chuỗi',
    'any.only': 'Chỉ có thể là PAID, UNPAID, OVERDUE, CREDIT,REFUNDED hoặc CANCELED'
  });



/**
 * ============================
 * PARAM + PAGINATION
 * ============================
 */

export const invoiceIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    'number.base': 'ID phải là số',
    'number.positive': 'ID phải lớn hơn 0',
    'number.integer': 'ID phải là số nguyên dương',
    'any.required': 'ID là bắt buộc'
  })
});

export const paginationQuerySchema = Joi.object({
  page: pageSchema,
  limit: limitSchema
});

/**
 * ============================
 * QUERY (FILTER + SORT)
 * ============================
 */

const allowedInvoiceSortFields = [
  'id',
  'invoiceDate',
  'dueDate',
  'totalAmount',
  'createdAt',
  'updatedAt'
];

export const invoiceQuerySchema = querySchema.keys({
  sortBy: createSortBySchema(allowedInvoiceSortFields),
  order: sortOrderSchema.optional(),

  invoiceStatus: createMultiValueFilterSchema(invoiceStatusSchema, 'Trạng thái hóa đơn').optional(),

  createdFrom: dateFromSchema,
  createdTo: dateToSchema.min(Joi.ref('createdFrom')).messages({
    'date.min': 'Ngày kết thúc phải lớn hơn hoặc bằng ngày tạo'
  })
});

