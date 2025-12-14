import Joi from 'joi';
import { 
  roleSchema, 
  querySchema,
  createSortBySchema, 
  sortOrderSchema 
} from './common.validation.js';
// cân nhắc sửa message
const roleFullNameSchema = Joi.string().max(15).optional().messages({
  'string.max': 'Full Name không được vượt quá 15 ký tự'
});
// cân nhắc sửa message
const roleDescriptionSchema = Joi.string().max(500).optional().messages({
  'string.max': 'Mô tả quyền không được vượt quá 500 ký tự'
});
// cân nhắc sửa message
const rolePermissionsSchema = Joi.array().items(Joi.string().trim()).optional().messages({
  'array.base': 'Permissions phải là một mảng',
  'string.base': 'Permission key phải là chuỗi ký tự'
});

// Schema validation cho tạo role
export const createRoleSchema = Joi.object({
  name: roleSchema.required(),
  fullName: roleFullNameSchema,
  description: roleDescriptionSchema,
  permissions: rolePermissionsSchema
});

// Schema validation cho update role
export const updateRoleSchema = Joi.object({
  fullName: roleFullNameSchema,
  description: roleDescriptionSchema,
  permissions: rolePermissionsSchema
});

// Schema validation cho role name parameter
export const roleNameParamSchema = Joi.object({
  name: roleSchema.required()
});

// Allowed fields for sorting roles
const allowedRoleSortFields = ['name' ,'fullName','description','createdAt','updatedAt'];

// Advanced query schema cho role với search, sort
export const roleQuerySchema = querySchema.keys({
  sortBy: createSortBySchema(allowedRoleSortFields),
  order: sortOrderSchema.optional()
});