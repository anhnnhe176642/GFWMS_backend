import Joi from 'joi';
import { 
  querySchema, 
  createMultiValueFilterSchema, 
  addressSchema,
  dateFromSchema,         
  dateToSchema,
  createSortBySchema,
  sortOrderSchema
} from './common.validation.js';

/**
 * 🔹 Store Name Schema
 */
export const storeNameSchema = Joi.string()
  .min(2)
  .max(100)
  .required()
  .empty('')
  .messages({
    'string.base': 'Tên cửa hàng phải là chuỗi',
    'string.min': 'Tên cửa hàng phải có ít nhất 2 ký tự',
    'string.max': 'Tên cửa hàng không được vượt quá 100 ký tự',
    'any.required': 'Tên cửa hàng là bắt buộc',
    'string.empty': 'Tên cửa hàng là bắt buộc'
  });

/**
 * 🔹 Store Address Schema
 */
export const storeAddressSchema = addressSchema
  .min(5)
  .required()
  .empty('')
  .messages({
    'string.base': 'Địa chỉ cửa hàng phải là chuỗi',
    'string.min': 'Địa chỉ cửa hàng phải có ít nhất 5 ký tự',
    'any.required': 'Địa chỉ cửa hàng là bắt buộc',
    'string.empty': 'Địa chỉ cửa hàng là bắt buộc'
  });

/**
 * 🔹 Create Store Schema
 */
export const createStoreSchema = Joi.object({
  name: storeNameSchema,
  address: storeAddressSchema
});

/**
 * 🔹 Store Status Schema
 */
export const storeStatusSchema = Joi.boolean()
  .messages({
    'boolean.base': 'Trạng thái phải là true (hoạt động) hoặc false (ngưng hoạt động)'
  });

/**
 * 🔹 Update Store Schema
 */
export const updateStoreSchema = Joi.object({
  name: storeNameSchema
    .trim()
    .disallow(null)
    .required(),
  address: storeAddressSchema
    .trim()
    .disallow(null)
    .required(),
  isActive: storeStatusSchema
    .disallow(null)
    .required()
}).messages({
  'any.required': 'Trạng thái hoạt động (isActive) là bắt buộc'
});

/**
 * 🔹 Store Query Schema
 */
const allowedStoreSortFields = ['id', 'name', 'address', 'isActive', 'createdAt', 'updatedAt'];

export const storeQuerySchema = querySchema.keys({
isActive: createMultiValueFilterSchema(
  Joi.boolean()
    .truthy('true')
    .falsy('false')
    .messages({
      'boolean.base': 'Chỉ chấp nhận true hoặc false',
    }),
  'Trạng thái hoạt động'
),

  sortBy: createSortBySchema(allowedStoreSortFields),
  order: sortOrderSchema,
  createdFrom: dateFromSchema,
  createdTo: dateToSchema
});

/**
 * 🔹 Store ID Schema
 */
export const storeIdSchema = Joi.object({
  id: Joi.string()
    .required()
    .custom((value, helpers) => {
      if (value === '{id}' || value === '' || !value) {
        return helpers.error('any.required');
      }
      if (!/^\d+$/.test(value)) {
        return helpers.error('string.pattern.base');
      }
      return value;
    })
    .messages({
      'any.required': 'ID cửa hàng là bắt buộc',
      'string.pattern.base': 'ID cửa hàng phải là số nguyên dương'
    })
});
