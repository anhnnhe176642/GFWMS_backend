import Joi from 'joi';
import {
  querySchema,
  createSortBySchema,
  sortOrderSchema,
  createMultiValueFilterSchema,
  pageSchema,
  limitSchema,
  searchSchema,
  dateFromSchema,
  dateToSchema
} from './common.validation.js';

/**
 * ============================
 * FIELD VALIDATIONS
 * ============================
 */

const fabricGlossIdSchema = Joi.number()
  .integer()
  .positive()
  .messages({
    'number.base': 'ID độ bóng phải là số',
    'number.positive': 'ID độ bóng phải lớn hơn 0'
  });

const fabricCategoryIdSchema = Joi.number()
  .integer()
  .positive()
  .messages({
    'number.base': 'ID loại vải phải là số',
    'number.positive': 'ID loại vải phải lớn hơn 0'
  });

const fabricColorIdSchema = Joi.string()
  .max(50)
  .trim()
  .messages({
    'string.base': 'ID màu vải phải là chuỗi',
    'string.max': 'ID màu vải không được vượt quá 50 ký tự'
  });

const fabricSupplierIdSchema = Joi.number()
  .integer()
  .positive()
  .messages({
    'number.base': 'ID nhà cung cấp phải là số',
    'number.positive': 'ID nhà cung cấp phải lớn hơn 0'
  });

/**
 * ============================
 * FIELD VALIDATIONS
 * ============================
 */

const fabricIdSchema = Joi.number()
  .integer()
  .positive()
  .required()
  .messages({
    'number.base': 'ID vải phải là số',
    'number.integer': 'ID vải phải là số nguyên',
    'number.positive': 'ID vải phải lớn hơn 0',
    'any.required': 'ID vải là bắt buộc'
  });

const rollsSchema = Joi.number()
  .integer()
  .positive()
  .required()
  .messages({
    'number.base': 'Số cuộn phải là số',
    'number.integer': 'Số cuộn phải là số nguyên',
    'number.positive': 'Số cuộn phải lớn hơn 0',
    'any.required': 'Số cuộn là bắt buộc'
  });

const importPriceSchema = Joi.number()
  .positive()
  .required()
  .messages({
    'number.base': 'Giá nhập phải là số',
    'number.positive': 'Giá nhập phải lớn hơn 0',
    'any.required': 'Giá nhập là bắt buộc'
  });

const metersSchema = Joi.number()
  .positive()
  .required()
  .messages({
    'number.base': 'Số mét phải là số',
    'number.positive': 'Số mét phải lớn hơn 0',
    'any.required': 'Số mét là bắt buộc'
  });

const storeIdParamSchema = Joi.number()
  .integer()
  .positive()
  .required()
  .messages({
    'number.base': 'ID cửa hàng phải là số',
    'number.integer': 'ID cửa hàng phải là số nguyên',
    'number.positive': 'ID cửa hàng phải lớn hơn 0',
    'any.required': 'ID cửa hàng là bắt buộc'
  });

const fabricIdParamSchema = Joi.number()
  .integer()
  .positive()
  .required()
  .messages({
    'number.base': 'ID vải phải là số',
    'number.integer': 'ID vải phải là số nguyên',
    'number.positive': 'ID vải phải lớn hơn 0',
    'any.required': 'ID vải là bắt buộc'
  });

/**
 * ============================
 * SCHEMAS
 * ============================
 */

/**
 * Validation cho nhập vải vào cửa hàng
 */
export const importFabricSchema = Joi.object({
  fabricId: fabricIdSchema,
  rolls: rollsSchema,
  importPrice: importPriceSchema
});

/**
 * Validation cho cắt vải
 */
export const cutFabricSchema = Joi.object({
  fabricId: fabricIdSchema,
  meters: metersSchema
});

/**
 * Validation cho params
 */
export const storeIdSchema = Joi.object({
  storeId: storeIdParamSchema
});

export const fabricStoreParamsSchema = Joi.object({
  storeId: storeIdParamSchema,
  fabricId: fabricIdParamSchema
});

/**
 * Allowed fields for sorting fabric store
 * Support nested fields for related data (fabric category, color, gloss, supplier, store, prices)
 */
const allowedFabricStoreSortFields = [
  'updatedAt', 
  'createdAt', 
  'totalValue', 
  'totalMeters', 
  'uncutRolls',
  'cuttingRollMeters',
  'fabric.category.name',
  'fabric.color.name',
  'fabric.gloss.description',
  'fabric.supplier.name',
  'store.name',
  'fabric.sellingPrice',
  'fabric.category.sellingPricePerMeter',
  'fabric.category.sellingPricePerRoll'
];

/**
 * Advanced query schema cho fabric store với search, filter, sort
 */
export const fabricStoreQuerySchema = querySchema.keys({
  page: pageSchema,
  limit: limitSchema,
  search: searchSchema.optional(),
  
  sortBy: createSortBySchema(allowedFabricStoreSortFields),
  order: sortOrderSchema.optional(),

  glossId: createMultiValueFilterSchema(fabricGlossIdSchema, 'ID độ bóng'),
  categoryId: createMultiValueFilterSchema(fabricCategoryIdSchema, 'ID loại vải'),
  colorId: createMultiValueFilterSchema(fabricColorIdSchema, 'ID màu vải'),
  supplierId: createMultiValueFilterSchema(fabricSupplierIdSchema, 'ID nhà cung cấp'),

  createdFrom: dateFromSchema,
  createdTo: dateToSchema.min(Joi.ref('createdFrom')).messages({
    'date.min': 'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu'
  })
});
