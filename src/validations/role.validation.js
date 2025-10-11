import Joi from 'joi';
import { 
  roleSchema, 
  querySchema,
  createSortBySchema, 
  sortOrderSchema 
} from './common.validation.js';

// Schema validation cho tạo role
export const createRoleSchema = Joi.object({
  name: roleSchema.required()
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