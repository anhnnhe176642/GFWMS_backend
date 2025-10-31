import Joi from 'joi';
import { 
  roleSchema, 
  querySchema,
  createSortBySchema, 
  sortOrderSchema 
} from './common.validation.js';

const roleDescriptionSchema = Joi.string().max(15).optional().messages({
  'string.max': 'Description không được vượt quá 15 ký tự'
});

const rolePermissionsSchema = Joi.array().items(Joi.number().integer().positive()).optional().messages({
  'array.base': 'Permissions phải là một mảng',
  'number.base': 'Permission ID phải là số nguyên',
  'number.positive': 'Permission ID phải là số dương'
});

// Schema validation cho tạo role
export const createRoleSchema = Joi.object({
  name: roleSchema.required(),
  description: roleDescriptionSchema,
  permissions: rolePermissionsSchema
});

// Schema validation cho update role
export const updateRoleSchema = Joi.object({
  description: roleDescriptionSchema,
  permissions: rolePermissionsSchema
});

// Schema validation cho role name parameter
export const roleNameParamSchema = Joi.object({
  name: roleSchema.required()
});

// Allowed fields for sorting roles
const allowedRoleSortFields = ['name'];

// Advanced query schema cho role với search, sort
export const roleQuerySchema = querySchema.keys({
  sortBy: createSortBySchema(allowedRoleSortFields),
  order: sortOrderSchema.optional()
});