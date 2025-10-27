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

const invoiceOrderIdSchema = Joi.number()
  .integer()
  .positive()
  .required()
  .messages({
    'number.base': 'orderId phải là số',
    'number.integer': 'orderId phải là số nguyên',
    'number.positive': 'orderId phải lớn hơn 0',
    'any.required': 'orderId là bắt buộc'
  });

const invoiceTotalAmountSchema = Joi.number()
  .positive()
  .precision(2)
  .messages({
    'number.base': 'Tổng tiền phải là số',
    'number.positive': 'Tổng tiền phải lớn hơn 0'
  });
const invoiceStatusSchema = Joi.string()
  .valid('UNPAID','PAID','OVERDUE','CREDIT','REFUNDED','CANCELED')
  .insensitive() 
  .messages({
    'string.base': 'Trạng thái hóa đơn phải là chuỗi',
    'any.only': 'Trạng thái hóa đơn chỉ có thể là PAID, UNPAID, OVERDUE, CREDIT,REFUNDED hoặc CANCELED'
  });


const invoiceNotesSchema = Joi.string()
  .max(255)
  .allow(null, '')
  .trim()
  .messages({
    'string.base': 'Ghi chú phải là chuỗi',
    'string.max': 'Ghi chú không được vượt quá 255 ký tự'
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

  invoiceStatus: createMultiValueFilterSchema(invoiceStatusSchema, 'invoiceStatus').optional(),

  createdFrom: dateFromSchema,
  createdTo: dateToSchema.min(Joi.ref('createdFrom')).messages({
    'date.min': 'createdTo phải lớn hơn hoặc bằng createdFrom'
  })
});

