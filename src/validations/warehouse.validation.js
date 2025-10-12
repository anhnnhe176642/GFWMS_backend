import Joi from 'joi';
import {
  pageSchema,
  limitSchema,
  querySchema,
  createSortBySchema,
  sortOrderSchema,
  dateFromSchema,
  dateToSchema
} from './common.validation.js';

// Warehouse name validation
export const warehouseNameSchema = Joi.string()
  .min(2)
  .max(100)
  .required()
  .messages({
    'string.min': 'Tên kho phải có ít nhất 2 ký tự',
    'string.max': 'Tên kho không được vượt quá 100 ký tự',
    'any.required': 'Tên kho là bắt buộc'
  });

// Address validation
export const addressSchema = Joi.string()
  .min(5)
  .max(255)
  .required()
  .messages({
    'string.min': 'Địa chỉ phải có ít nhất 5 ký tự',
    'string.max': 'Địa chỉ không được vượt quá 255 ký tự',
    'any.required': 'Địa chỉ là bắt buộc'
  });

// Schema validation cho tạo warehouse
export const createWarehouseSchema = Joi.object({
  name: warehouseNameSchema,
  address: addressSchema
});

// Schema validation cho update warehouse
export const updateWarehouseSchema = Joi.object({
  name: warehouseNameSchema.optional(),
  address: addressSchema.optional()
});

// Schema validation cho ID params (Integer) - ĐÂY LÀ EXPORT BỊ THIẾU
export const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    'number.base': 'ID phải là số',
    'number.integer': 'ID phải là số nguyên',
    'number.positive': 'ID phải là số dương',
    'any.required': 'ID là bắt buộc'
  })
});

// Allowed fields for sorting warehouses
const allowedWarehouseSortFields = ['createdAt', 'updatedAt', 'name', 'address'];

// Advanced query schema cho warehouse
export const warehouseQuerySchema = querySchema.keys({
  sortBy: createSortBySchema(allowedWarehouseSortFields),
  order: sortOrderSchema.optional(),
  createdFrom: dateFromSchema.optional(),
  createdTo: dateToSchema.optional()
});