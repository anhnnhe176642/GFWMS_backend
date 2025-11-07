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

const fabricThicknessSchema = Joi.number()
  .positive()
  .precision(2)
  .messages({
    'number.base': 'Độ dày phải là số',
    'number.positive': 'Độ dày phải lớn hơn 0'
  });

const fabricLengthSchema = Joi.number()
  .positive()
  .precision(2)
  .messages({
    'number.base': 'Chiều dài phải là số',
    'number.positive': 'Chiều dài phải lớn hơn 0'
  });

const fabricWidthSchema = Joi.number()
  .positive()
  .precision(2)
  .messages({
    'number.base': 'Chiều rộng phải là số',
    'number.positive': 'Chiều rộng phải lớn hơn 0'
  });

const fabricWeightSchema = Joi.number()
  .positive()
  .precision(2)
  .messages({
    'number.base': 'Trọng lượng phải là số',
    'number.positive': 'Trọng lượng phải lớn hơn 0'
  });

const fabricSellingPriceSchema = Joi.number()
  .positive()
  .precision(2)
  .messages({
    'number.base': 'Giá bán phải là số',
    'number.positive': 'Giá bán phải lớn hơn 0'
  });

const fabricQuantitySchema = Joi.number()
  .integer()
  .min(0)
  .messages({
    'number.base': 'Số lượng phải là số nguyên',
    'number.min': 'Số lượng không được âm'
  });

const fabricGlossIdSchema = Joi.number()
  .integer()
  .positive()
  .required()
  .messages({
    'number.base': 'glossId phải là số',
    'number.positive': 'glossId phải lớn hơn 0',
    'any.required': 'glossId là bắt buộc'
  });

const fabricCategoryIdSchema = Joi.number()
  .integer()
  .positive()
  .required()
  .messages({
    'number.base': 'categoryId phải là số',
    'number.positive': 'categoryId phải lớn hơn 0',
    'any.required': 'categoryId là bắt buộc'
  });

const fabricColorIdSchema = Joi.string()
  .max(50)
  .required()
  .trim()
  .messages({
    'string.base': 'colorId phải là chuỗi',
    'string.empty': 'colorId không được để trống',
    'string.min': 'colorId không được để trống',
    'string.max': 'colorId không được vượt quá 50 ký tự',
    'any.required': 'colorId là bắt buộc'
  });

const fabricSupplierIdSchema = Joi.number()
  .integer()
  .positive()
  .required()
  .messages({
    'number.base': 'supplierId phải là số',
    'number.positive': 'supplierId phải lớn hơn 0',
    'any.required': 'supplierId là bắt buộc'
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
  'id',
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
  'width'
];

export const fabricQuerySchema = querySchema.keys({
  sortBy: createSortBySchema(allowedFabricSortFields),
  order: sortOrderSchema.optional(),

  glossId: createMultiValueFilterSchema(fabricGlossIdSchema, 'GlossId'),
  categoryId: createMultiValueFilterSchema(fabricCategoryIdSchema, 'CategoryId'),
  colorId: createMultiValueFilterSchema(fabricColorIdSchema, 'ColorId'),
  supplierId: createMultiValueFilterSchema(fabricSupplierIdSchema, 'SupplierId'),

  createdFrom: dateFromSchema,
  createdTo: dateToSchema.min(Joi.ref('createdFrom')).messages({
    'date.min': 'createdTo phải lớn hơn hoặc bằng createdFrom'
  })
});
