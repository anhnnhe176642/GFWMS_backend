import Joi from 'joi';
import { querySchema, createMultiValueFilterSchema, addressSchema,
  dateFromSchema,         
  dateToSchema,
  createSortBySchema,
  sortOrderSchema
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

export const warehouseAddressSchema = addressSchema  
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
    'any.only': 'Trạng thái phải là ACTIVE hoặc INACTIVE',
    'string.empty': 'Trạng thái không được để trống',
  });

export const updateWarehouseSchema = Joi.object({
  name: warehouseNameSchema
    .trim()                    
    .disallow(null)          
    .required(),
  address: warehouseAddressSchema
    .trim()                    
    .disallow(null)          
    .required(),
  status: warehouseStatusSchema
    .disallow(null)
    .required()
}).messages({
  'any.required': 'Status là bắt buộc',
});

const allowedWarehouseSortFields = ['id', 'name', 'address', 'status', 'createdAt', 'updatedAt'];

export const warehouseQuerySchema = querySchema.keys({
  status: createMultiValueFilterSchema(
    warehouseStatusSchema, 
    'Trạng thái'
  ),
  sortBy: createSortBySchema(allowedWarehouseSortFields),
  order: sortOrderSchema,
  createdFrom: dateFromSchema,
  createdTo: dateToSchema
});

export const warehouseIdSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    'number.base': 'ID kho phải là một số',
    'number.integer': 'ID kho phải là một số nguyên',
    'number.positive': 'ID kho phải là một số dương',
    'any.required': 'ID kho là bắt buộc'
  })
});