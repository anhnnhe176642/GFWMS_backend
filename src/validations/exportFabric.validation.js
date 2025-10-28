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
    'number.base': 'warehouseId phải là số',
    'number.integer': 'warehouseId phải là số nguyên',
    'number.positive': 'warehouseId phải lớn hơn 0',
    'any.required': 'warehouseId là bắt buộc'
  });

// Store ID
const exportStoreIdSchema = Joi.number()
  .integer()
  .positive()
  .required()
  .messages({
    'number.base': 'storeId phải là số',
    'number.integer': 'storeId phải là số nguyên',
    'number.positive': 'storeId phải lớn hơn 0',
    'any.required': 'storeId là bắt buộc'
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

  warehouseId: createMultiValueFilterSchema(exportWarehouseIdSchema, 'WarehouseId'),
  storeId: createMultiValueFilterSchema(exportStoreIdSchema, 'StoreId'),
  status: createMultiValueFilterSchema(exportStatusSchema, 'Status'),

  createdFrom: dateFromSchema,
  createdTo: dateToSchema.min(Joi.ref('createdFrom')).messages({
    'date.min': 'createdTo phải lớn hơn hoặc bằng createdFrom'
  })
});


