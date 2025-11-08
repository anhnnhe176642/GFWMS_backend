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

// Warehouse ID
const exportWarehouseIdSchema = Joi.number()
  .integer()
  .positive()
  .required()
  .messages({
    'number.base': 'ID kho phải là số',
    'number.integer': 'ID kho phải là số nguyên',
    'number.positive': 'ID kho phải lớn hơn 0',
    'any.required': 'ID kho là bắt buộc'
  });

// Store ID
const exportStoreIdSchema = Joi.number()
  .integer()
  .positive()
  .required()
  .messages({
    'number.base': 'ID cửa hàng phải là số',
    'number.integer': 'ID cửa hàng phải là số nguyên',
    'number.positive': 'ID cửa hàng phải lớn hơn 0',
    'any.required': 'ID cửa hàng là bắt buộc'
  });


// Status
const exportStatusSchema = Joi.string()
  .uppercase()
  .valid('PENDING', 'APPROVED', 'REJECTED')
  .default('PENDING')
  .trim()
  .messages({
    'any.only': 'Chỉ chấp nhận: PENDING, APPROVED, REJECTED'
  });



/**
 * ============================
 * PARAM + PAGINATION
 * ============================
 */
export const exportFabricIdParamSchema = Joi.object({
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

const allowedExportFabricSortFields = [
  'id',
  'createdAt',
  'updatedAt',
  'status'
];

export const exportFabricQuerySchema = querySchema.keys({
  sortBy: createSortBySchema(allowedExportFabricSortFields),
  order: sortOrderSchema.optional(),

  warehouseId: createMultiValueFilterSchema(exportWarehouseIdSchema, 'ID kho'),
  storeId: createMultiValueFilterSchema(exportStoreIdSchema, 'ID của hàng'),
  status: createMultiValueFilterSchema(exportStatusSchema, 'Trạng thái đơn'),

  createdFrom: dateFromSchema,
  createdTo: dateToSchema.min(Joi.ref('createdFrom')).messages({
    'date.min': 'Ngày kết thúc phải lớn hơn hoặc bằng ngày tạo'
  })
});


