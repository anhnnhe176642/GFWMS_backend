import Joi from 'joi';
import { roleSchema } from './common.validation.js';

// Schema validation cho tạo role
export const createRoleSchema = Joi.object({
  name: roleSchema.required()
});

// Schema validation cho cập nhật role
export const updateRoleSchema = Joi.object({
  name: roleSchema.required()
});

// Schema validation cho role name parameter
export const roleNameParamSchema = Joi.object({
  name: roleSchema.required()
});