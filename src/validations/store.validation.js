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
 *  Store Name Schema
 */
export const storeNameSchema = Joi.string()
  .min(2)
  .max(100)
  .required()
  .empty('')
  .trim()
  .messages({
    'string.base': 'Tên cửa hàng phải là chuỗi',
    'string.min': 'Tên cửa hàng phải có ít nhất 2 ký tự',
    'string.max': 'Tên cửa hàng không được vượt quá 100 ký tự',
    'any.required': 'Tên cửa hàng là bắt buộc',
    'string.empty': 'Tên cửa hàng là bắt buộc'
  });

/**
 *  Store Address Schema
 */
export const storeAddressSchema = addressSchema
  .min(5)
  .trim()
  .required()
  .empty('')
  .messages({
    'string.base': 'Địa chỉ cửa hàng phải là chuỗi',
    'string.min': 'Địa chỉ cửa hàng phải có ít nhất 5 ký tự',
    'any.required': 'Địa chỉ cửa hàng là bắt buộc',
    'string.empty': 'Địa chỉ cửa hàng là bắt buộc'
  });

/**
 *  Store Location Schema
 */
export const storeLocationSchema = Joi.object({
  lat: Joi.number()
    .min(-90)
    .max(90)
    .required()
    .messages({
      'number.base': 'Vĩ độ (lat) phải là số',
      'number.min': 'Vĩ độ (lat) phải lớn hơn hoặc bằng -90',
      'number.max': 'Vĩ độ (lat) phải nhỏ hơn hoặc bằng 90',
      'any.required': 'Vĩ độ (lat) là bắt buộc'
    }),
  lng: Joi.number()
    .min(-180)
    .max(180)
    .required()
    .messages({
      'number.base': 'Kinh độ (lng) phải là số',
      'number.min': 'Kinh độ (lng) phải lớn hơn hoặc bằng -180',
      'number.max': 'Kinh độ (lng) phải nhỏ hơn hoặc bằng 180',
      'any.required': 'Kinh độ (lng) là bắt buộc'
    })
}).messages({
  'object.base': 'Location phải là một object'
});

/**
 *  Store Latitude Schema
 */
export const storeLatitudeSchema = Joi.number()
  .min(-90)
  .max(90)
  .allow(null)
  .messages({
    'number.base': 'Vĩ độ (latitude) phải là số',
    'number.min': 'Vĩ độ (latitude) phải lớn hơn hoặc bằng -90',
    'number.max': 'Vĩ độ (latitude) phải nhỏ hơn hoặc bằng 90'
  });

/**
 *  Store Longitude Schema
 */
export const storeLongitudeSchema = Joi.number()
  .min(-180)
  .max(180)
  .allow(null)
  .messages({
    'number.base': 'Kinh độ (longitude) phải là số',
    'number.min': 'Kinh độ (longitude) phải lớn hơn hoặc bằng -180',
    'number.max': 'Kinh độ (longitude) phải nhỏ hơn hoặc bằng 180'
  });

/**
 *  Create Store Schema
 */
export const createStoreSchema = Joi.object({
  name: storeNameSchema,
  address: storeAddressSchema,
  latitude: storeLatitudeSchema,
  longitude: storeLongitudeSchema
});

/**
 *  Store Status Schema
 */
export const storeStatusSchema = Joi.boolean()
  .messages({
    'boolean.base': 'Trạng thái phải là true (hoạt động) hoặc false (ngưng hoạt động)'
  });

/**
 *  Update Store Schema
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
  latitude: storeLatitudeSchema,
  longitude: storeLongitudeSchema,
  isActive: storeStatusSchema
    .disallow(null)
    .required()
}).messages({
  'any.required': 'Trạng thái hoạt động (isActive) là bắt buộc'
});

/**
 *  Store Query Schema
 */
const allowedStoreSortFields = ['name', 'address', 'isActive', 'createdAt', 'updatedAt'];

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
 *  Store ID Schema
 */
export const storeIdSchema = Joi.object({
  id: Joi.string()
    .trim()
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
