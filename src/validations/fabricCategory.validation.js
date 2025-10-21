import Joi from 'joi';
import { querySchema, createSortBySchema, sortOrderSchema } from './common.validation.js';

// Schema cơ bản cho name của FabricCategory
export const nameSchema = Joi.string()
  .max(100)
  .required()
  .messages({
    'string.max': 'Tên không được vượt quá 100 ký tự',
    'any.required': 'Tên là bắt buộc'
  });

// Schema cơ bản cho description của FabricCategory (không bắt buộc)
export const descriptionSchema = Joi.string()
  .max(255)
  .allow('', null)
  .messages({
    'string.max': 'Mô tả không được vượt quá 255 ký tự'
  });

// Schema validation cho tạo FabricCategory
export const createFabricCategorySchema = Joi.object({
  name: nameSchema,
  description: descriptionSchema.optional()
});

// Schema validation cho cập nhật FabricCategory
export const updateFabricCategorySchema = Joi.object({
  name: nameSchema.optional(),
  description: descriptionSchema.optional()
});

// Schema validation cho param id (Int)
export const fabricCategoryIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    'number.base': 'ID phải là số',
    'number.integer': 'ID phải là số nguyên',
    'number.positive': 'ID phải là số dương',
    'any.required': 'ID là bắt buộc'
  })
});

// Allowed fields for sorting FabricCategory
const allowedFabricCategorySortFields = ['name', 'createdAt', 'updatedAt'];

// Advanced query schema cho FabricCategory với search, sort, pagination
export const fabricCategoryQuerySchema = querySchema.keys({
  sortBy: createSortBySchema(allowedFabricCategorySortFields),
  order: sortOrderSchema.optional()
});
