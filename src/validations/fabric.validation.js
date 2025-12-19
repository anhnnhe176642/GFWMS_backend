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


const fabricGlossIdSchema = Joi.number()
  .integer()
  .positive()
  .required()
  .messages({
    'number.base': 'ID độ bóng phải là số',
    'number.positive': 'ID độ bóng phải lớn hơn 0',
    'any.required': 'ID độ bóng là bắt buộc'
  });

const fabricCategoryIdSchema = Joi.number()
  .integer()
  .positive()
  .required()
  .messages({
    'number.base': 'ID loại vải phải là số',
    'number.positive': 'ID loại vải phải lớn hơn 0',
    'any.required': 'ID loại vải là bắt buộc'
  });

const fabricColorIdSchema = Joi.string()
  .max(50)
  .required()
  .trim()
  .messages({
    'string.base': 'ID màu vải phải là chuỗi',
    'string.empty': 'ID màu vải không được để trống',
    'string.min': 'ID màu vải không được để trống',
    'string.max': 'ID màu vải không được vượt quá 50 ký tự',
    'any.required': 'ID màu vải là bắt buộc'
  });

const fabricSupplierIdSchema = Joi.number()
  .integer()
  .positive()
  .required()
  .messages({
    'number.base': 'ID nhà cung cấp phải là số',
    'number.positive': 'ID nhà cung cấp phải lớn hơn 0',
    'any.required': 'ID nhà cung cấp là bắt buộc'
  });


/**
 * ============================
 * PARAM + PAGINATION
 * ============================
 */
export const fabricIdParamSchema = Joi.object({
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
const allowedFabricSortFields = [
  'category.name',
  'color.name',
  'gloss.description',
  'supplier.name',
  'createdAt',
  'updatedAt',
  'sellingPrice',
  'quantityInStock',
  'weight',
  'length',
  'width',
  'thickness'
];

export const fabricQuerySchema = querySchema.keys({
  sortBy: createSortBySchema(allowedFabricSortFields),
  order: sortOrderSchema.optional(),

  glossId: createMultiValueFilterSchema(fabricGlossIdSchema, 'ID độ bóng'),
  categoryId: createMultiValueFilterSchema(fabricCategoryIdSchema, 'ID loại vải'),
  colorId: createMultiValueFilterSchema(fabricColorIdSchema, 'ID màu vải'),
  supplierId: createMultiValueFilterSchema(fabricSupplierIdSchema, 'ID nhà cung cấp'),

  createdFrom: dateFromSchema,
  createdTo: dateToSchema.min(Joi.ref('createdFrom')).messages({
    'date.min': 'Ngày kết thúc phải lớn hơn hoặc bằng ngày tạo'
  })
});
