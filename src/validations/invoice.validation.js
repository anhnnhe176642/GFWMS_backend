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

export const idSchema = Joi.number().integer().positive().required().messages({
  'number.base': 'ID phải là số',
  'number.positive': 'ID phải lớn hơn 0',
  'number.integer': 'ID phải là số nguyên dương',
  'any.required': 'ID là bắt buộc'
});

export const invoiceIdParamSchema = Joi.object({
  invoiceId: idSchema
});

export const creditInvoiceIdParamSchema = Joi.object({
  creditInvoiceId: idSchema
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
  'invoiceStatus',
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

/**
 * ============================
 * CREDIT INVOICE VALIDATIONS
 * ============================
 */

const creditInvoiceStatusSchema = Joi. string()
  .valid('PENDING', 'PAID', 'OVERDUE')
  . trim()
  .messages({
    'string.base': 'Trạng thái Credit Invoice phải là chuỗi',
    'any.only': 'Trạng thái phải là PENDING, PAID, hoặc OVERDUE'
  });

const allowedCreditInvoiceSortFields = ['totalCreditAmount','creditPaidAmount','createdAt','updatedAt'];

export const creditInvoiceQuerySchema = querySchema.keys({
  sortBy: createSortBySchema(allowedCreditInvoiceSortFields),
  order: sortOrderSchema.optional(),
  
  status: createMultiValueFilterSchema(
    creditInvoiceStatusSchema, 
    'Trạng thái Credit Invoice'
  ). optional()
});

/**
 * ============================
 * MY INVOICES QUERY SCHEMA
 * ============================
 */
export const myInvoicesQuerySchema = querySchema.keys({
  sortBy: createSortBySchema(allowedInvoiceSortFields),
  order: sortOrderSchema.optional(),
  invoiceStatus: createMultiValueFilterSchema(invoiceStatusSchema, 'Trạng thái hóa đơn').optional(),
  createdFrom: dateFromSchema,
  createdTo: dateToSchema.min(Joi.ref('createdFrom')).messages({
    'date.min': 'Ngày kết thúc phải lớn hơn hoặc bằng ngày tạo'
  })
});



