import Joi from 'joi';
import { querySchema, createSortBySchema, sortOrderSchema } from './common.validation.js';

// ===== CÁC SCHEMA CƠ BẢN =====

// Tên nhà cung cấp
export const nameSchema = Joi.string()
  .max(100)
  .required()
  .messages({
    'string.base': 'Tên nhà cung cấp phải là chuỗi',
    'string.max': 'Tên nhà cung cấp không được vượt quá 100 ký tự',
    'any.required': 'Tên nhà cung cấp là bắt buộc'
  });

// Địa chỉ nhà cung cấp
export const addressSchema = Joi.string()
  .max(255)
  .required()
  .messages({
    'string.base': 'Địa chỉ phải là chuỗi',
    'string.max': 'Địa chỉ không được vượt quá 255 ký tự',
    'any.required': 'Địa chỉ là bắt buộc'
  });

// Số điện thoại
export const phoneSchema = Joi.string()
  .pattern(/^[0-9+\-() ]+$/)
  .max(15)
  .required()
  .messages({
    'string.pattern.base': 'Số điện thoại chỉ được chứa số, dấu +, -, hoặc khoảng trắng',
    'string.max': 'Số điện thoại không được vượt quá 15 ký tự',
    'any.required': 'Số điện thoại là bắt buộc'
  });

// Trạng thái hoạt động
export const isActiveSchema = Joi.boolean()
  .messages({
    'boolean.base': 'Trạng thái hoạt động phải là true hoặc false'
  });

// ===== SCHEMA CHO CRUD =====

// Schema tạo Supplier
export const createSupplierSchema = Joi.object({
  name: nameSchema,
  address: addressSchema,
  phone: phoneSchema,
  isActive: isActiveSchema.optional()
});

// Schema cập nhật Supplier
export const updateSupplierSchema = Joi.object({
  name: nameSchema.optional(),
  address: addressSchema.optional(),
  phone: phoneSchema.optional(),
  isActive: isActiveSchema.optional()
}).or('name', 'address', 'phone', 'isActive') // bắt buộc có ít nhất 1 field để update
.messages({
  'object.missing': 'Phải có ít nhất một trường để cập nhật'
});

// Schema cho param id (Integer)
export const supplierIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    'number.base': 'ID phải là số',
    'number.integer': 'ID phải là số nguyên',
    'number.positive': 'ID phải lớn hơn 0',
    'any.required': 'ID là bắt buộc'
  })
});

// ===== SCHEMA CHO QUERY =====

// Các field cho phép sắp xếp
const allowedSupplierSortFields = ['name', 'address', 'phone', 'createdAt', 'updatedAt'];

// Query schema nâng cao (search, sort, pagination)
export const supplierQuerySchema = querySchema.keys({
  sortBy: createSortBySchema(allowedSupplierSortFields),
  order: sortOrderSchema.optional(),
  search: Joi.string().allow('').optional().messages({
    'string.base': 'Từ khóa tìm kiếm phải là chuỗi'
  })
});
