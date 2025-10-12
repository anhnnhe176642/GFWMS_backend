import Joi from 'joi';
import {
  pageSchema,
  limitSchema,
  searchSchema,
  createSortBySchema,
  sortOrderSchema,
  dateFromSchema,
  dateToSchema,
  addressSchema
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
export const warehouseAddressSchema = addressSchema
  .min(5)
  .required()
  .messages({
    'string.min': 'Địa chỉ kho phải có ít nhất 5 ký tự',
    'any.required': 'Địa chỉ kho là bắt buộc'
  });

// Schema validation cho tạo warehouse
export const createWarehouseSchema = Joi.object({
  name: warehouseNameSchema,
  address: warehouseAddressSchema
});

// Schema validation cho update warehouse
export const updateWarehouseSchema = Joi.object({
  name: warehouseNameSchema.optional(),
  address: warehouseAddressSchema.optional()
});


// Allowed fields for sorting warehouses
const allowedWarehouseSortFields = ['createdAt', 'updatedAt', 'name', 'address'];

export const warehouseQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().allow('').optional(),
  status: Joi.string().valid('ACTIVE', 'INACTIVE').optional(), 
  sortBy: Joi.string().valid('createdAt', 'updatedAt', 'name', 'address').default('createdAt'),
  order: Joi.string().valid('asc', 'desc').default('desc'),
  createdFrom: Joi.date().iso().optional(),
  createdTo: Joi.date().iso().optional()
});

export const changeWarehouseStatusSchema = Joi.object({
  status: Joi.string()
    .valid('ACTIVE', 'INACTIVE')
    .required()
    .messages({
      'any.required': 'Trạng thái là bắt buộc',
      'any.only': 'Trạng thái phải là ACTIVE hoặc INACTIVE'
    })
});