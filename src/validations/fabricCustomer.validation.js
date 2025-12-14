import Joi from 'joi';
import {
  querySchema,
  createSortBySchema,
  sortOrderSchema,
  pageSchema,
  limitSchema,
  searchSchema,
  idSchema
} from './common.validation.js';

/**
 * ============================
 * FIELD VALIDATIONS
 * ============================
 */

// Category ID schema
const categoryIdFilterSchema = Joi.number()
  .integer()
  .positive()
  .optional()
  .messages({
    'number.base': 'ID loại vải phải là số',
    'number.integer': 'ID loại vải phải là số nguyên',
    'number.positive': 'ID loại vải phải lớn hơn 0'
  });

// Color ID schema
const colorIdFilterSchema = Joi.string()
  .max(50)
  .trim()
  .optional()
  .messages({
    'string.base': 'ID màu phải là chuỗi',
    'string.max': 'ID màu không được vượt quá 50 ký tự'
  });

// Gloss ID schema
const glossIdFilterSchema = Joi.number()
  .integer()
  .positive()
  .optional()
  .messages({
    'number.base': 'ID độ bóng phải là số',
    'number.integer': 'ID độ bóng phải là số nguyên',
    'number.positive': 'ID độ bóng phải lớn hơn 0'
  });

// Thickness schema
const thicknessFilterSchema = Joi.number()
  .positive()
  .optional()
  .messages({
    'number.base': 'Độ dày phải là số',
    'number.positive': 'Độ dày phải lớn hơn 0'
  });

// Width schema
const widthFilterSchema = Joi.number()
  .positive()
  .optional()
  .messages({
    'number.base': 'Chiều rộng phải là số',
    'number.positive': 'Chiều rộng phải lớn hơn 0'
  });

// Length schema
const lengthFilterSchema = Joi.number()
  .positive()
  .optional()
  .messages({
    'number.base': 'Chiều dài phải là số',
    'number.positive': 'Chiều dài phải lớn hơn 0'
  });

// GroupBy schema - hỗ trợ gom nhóm theo nhiều cột
const allowedGroupByFields = ['categoryId', 'colorId', 'glossId', 'thickness', 'width', 'length'];
const groupBySchema = Joi.string()
  .optional()
  .trim()
  .custom((value, helpers) => {
    if (!value) return value;
    
    const fields = value.split(',').map(f => f.trim()).filter(f => f);
    const invalidFields = fields.filter(f => !allowedGroupByFields.includes(f));
    
    if (invalidFields.length > 0) {
      return helpers.error('custom.invalid', { invalid: invalidFields.join(', ') });
    }
    
    return fields.join(',');
  })
  .messages({
    'string.base': 'GroupBy phải là chuỗi',
    'custom.invalid': 'Các trường groupBy không hợp lệ: {#invalid}. Cho phép: categoryId, colorId, glossId, thickness, width, length'
  });

/**
 * ============================
 * SCHEMA CHO PARAM
 * ============================
 */

export const fabricCustomerIdParamSchema = Joi.object({
  fabricCustomerId: idSchema.required().messages({
    'any.required': 'ID vải khách hàng là bắt buộc'
  })
});

/**
 * ============================
 * SCHEMA CHO QUERY (FILTER + SORT + PAGINATION)
 * ============================
 */

const allowedSortFields = [
  'thickness',
  'width',
  'length',
  'category.name',
  'color.name',
  'gloss.description',
  'totalUncut',
  'totalCuttingMeters',
  'createdAt',
  'updatedAt'
];

export const fabricCustomerQuerySchema = querySchema.keys({
  // Filters
  categoryId: categoryIdFilterSchema,
  colorId: colorIdFilterSchema,
  glossId: glossIdFilterSchema,
  thickness: thicknessFilterSchema,
  width: widthFilterSchema,
  length: lengthFilterSchema,

  // Search
  search: searchSchema.optional(),

  // Sort
  sortBy: createSortBySchema(allowedSortFields),
  order: sortOrderSchema.optional(),

  // Pagination
  page: pageSchema,
  limit: limitSchema
});

/**
 * ============================
 * SCHEMA CHO FILTER OPTIONS
 * ============================
 */

export const filterOptionsQuerySchema = Joi.object({
  categoryId: categoryIdFilterSchema,
  colorId: colorIdFilterSchema,
  glossId: glossIdFilterSchema,
  thickness: thicknessFilterSchema,
  width: widthFilterSchema,
  length: lengthFilterSchema
});

/**
 * ============================
 * SCHEMA CHO GROUPED DATA
 * ============================
 */

export const groupedDataQuerySchema = Joi.object({
  categoryId: categoryIdFilterSchema,
  colorId: colorIdFilterSchema,
  glossId: glossIdFilterSchema,
  thickness: thicknessFilterSchema,
  width: widthFilterSchema,
  length: lengthFilterSchema,
  groupBy: groupBySchema
});
