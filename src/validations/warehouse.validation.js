import Joi from 'joi';
import { querySchema, createMultiValueFilterSchema, addressSchema,
  dateFromSchema,         
  dateToSchema 
} from './common.validation.js';

export const warehouseNameSchema = Joi.string()
  .min(2)
  .max(100)
  .required()
  .empty('')
  .messages({
    'string.min': 'Tên kho phải có ít nhất 2 ký tự',
    'string.max': 'Tên kho không được vượt quá 100 ký tự',
    'any.required': 'Tên kho là bắt buộc',
    'string.empty': 'Tên kho là bắt buộc'
  });

export const warehouseAddressSchema = addressSchema  // lấy bên cm rồi nhá
  .min(5)
  .required()
  .empty('')
  .messages({
    'string.min': 'Địa chỉ kho phải có ít nhất 5 ký tự',
    'any.required': 'Địa chỉ kho là bắt buộc',
    'string.empty': 'Địa chỉ kho là bắt buộc'
  });


export const createWarehouseSchema = Joi.object({
  name: warehouseNameSchema,
  address: warehouseAddressSchema
});

export const warehouseStatusSchema = Joi.string()
  .valid('ACTIVE', 'INACTIVE')
  .messages({
    'any.only': 'Trạng thái phải là ACTIVE hoặc INACTIVE'
  });

export const updateWarehouseSchema = Joi.object({
  name: warehouseNameSchema.optional(),
  address: warehouseAddressSchema.optional(),
  status: warehouseStatusSchema.optional()
});

export const warehouseQuerySchema = querySchema.keys({
  status: createMultiValueFilterSchema(
    warehouseStatusSchema, 
    'Trạng thái'
  ),
  sortBy: Joi.string().optional(),
  order: Joi.string().optional(),
  createdFrom: dateFromSchema,
  createdTo: dateToSchema
});

export const warehouseIdSchema = Joi.object({
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
      'any.required': 'ID kho là bắt buộc',
      'string.pattern.base': 'ID kho phải là số nguyên dương'
    })
});