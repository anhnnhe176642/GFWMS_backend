import Joi from 'joi';
import { querySchema, createSortBySchema, sortOrderSchema } from './common.validation.js';
import { idSchema } from './common.validation.js';

// ===== CÁC SCHEMA CƠ BẢN =====

// Tên nhà cung cấp
export const nameSchema = Joi.string()
  .trim()
  .min(1)
  .max(100)
  .required()
  .messages({
    'string.base': 'Tên nhà cung cấp phải là chuỗi',
    'string.empty': 'Tên nhà cung cấp không được để trống',
    'string.min': 'Tên nhà cung cấp không được để trống',
    'string.max': 'Tên nhà cung cấp không được vượt quá 100 ký tự',
    'any.required': 'Tên nhà cung cấp là bắt buộc'
  });

// Địa chỉ nhà cung cấp
export const addressSchema = Joi.string()
  .trim()
  .min(1)
  .max(255)
  .required()
  .messages({
    'string.base': 'Địa chỉ phải là chuỗi',
    'string.empty': 'Địa chỉ không được để trống',
    'string.min': 'Địa chỉ không được để trống',
    'string.max': 'Địa chỉ không được vượt quá 255 ký tự',
    'any.required': 'Địa chỉ là bắt buộc'
  });

// Số điện thoại
export const phoneSchema = Joi.string()
  .trim()
  .pattern(/^(?:\+84|0)(?:\d){9}$/)
  .required()
  .messages({
    'string.base': 'Số điện thoại phải là chuỗi',
    'string.empty': 'Số điện thoại không được để trống',
    'string.pattern.base': 'Số điện thoại không hợp lệ.',
    'any.required': 'Số điện thoại là bắt buộc'
  });

// Trạng thái hoạt động
export const isActiveSchema = Joi.boolean()
  .messages({
    'boolean.base': 'Trạng thái hoạt động phải là true hoặc false'
  });

// ===== SCHEMA CHO CRUD =====
export const createSupplierSchema = Joi.object({
  name: nameSchema,
  address: addressSchema,
  phone: phoneSchema,
  isActive: isActiveSchema.optional()
});

export const updateSupplierSchema = Joi.object({
  name: nameSchema,
  address: addressSchema,
  phone: phoneSchema,
  isActive: isActiveSchema.required().messages({
    'any.required': 'Trạng thái hoạt động là bắt buộc'
  })
});

export const supplierIdParamSchema = Joi.object({
  id: idSchema
});

// ===== SCHEMA CHO QUERY =====
const allowedSupplierSortFields = ['name', 'address', 'phone', 'isActive', 'createdAt', 'updatedAt'];

export const supplierQuerySchema = querySchema.keys({
  sortBy: createSortBySchema(allowedSupplierSortFields),
  order: sortOrderSchema.optional(),
  search: Joi.string().allow('').optional().messages({
    'string.base': 'Từ khóa tìm kiếm phải là chuỗi'
  })
});
