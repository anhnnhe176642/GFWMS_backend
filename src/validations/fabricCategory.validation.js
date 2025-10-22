import Joi from 'joi';
import { querySchema, createSortBySchema, sortOrderSchema } from './common.validation.js';

// Schema cơ bản cho name của FabricCategory
export const nameSchema = Joi.string()
  .trim()
  .min(1) 
  .max(100)
  .required()
  .messages({
    'string.empty': 'Tên loại vải không được để trống',
    'string.min': 'Tên loại vải không được để trống',
    'string.max': 'Tên loại vải không được vượt quá 100 ký tự',
    'any.required': 'Tên loại vải là bắt buộc'
  });


// Schema cơ bản cho description của FabricCategory (không bắt buộc)
export const descriptionSchema = Joi.string()
  .trim()
  .min(1)
  .max(255)
  .required()
  .messages({
    'string.empty': 'Mô tả loại vải không được để trống',
    'string.min': 'Mô tả loại vải không được để trống',
    'string.max': 'Mô tả loại vải không được vượt quá 255 ký tự',
    'any.required': 'Mô tả loại vải là bắt buộc'
  });


// Schema validation cho tạo FabricCategory
export const createFabricCategorySchema = Joi.object({
  name: nameSchema,
  description: descriptionSchema.optional()
});

// Schema validation cho cập nhật FabricCategory
export const updateFabricCategorySchema = Joi.object({
  name: nameSchema,
  description: descriptionSchema
});

// Schema validation cho param id (Int)
export const fabricCategoryIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    'number.base': 'ID loại vải phải là số',
    'number.integer': 'ID loại vải phải là số nguyên',
    'number.positive': 'ID loại vải phải là số dương',
    'any.required': 'ID loại vải là bắt buộc'
  })
});

// Allowed fields for sorting FabricCategory
const allowedFabricCategorySortFields = ['name', 'createdAt', 'updatedAt'];

// Advanced query schema cho FabricCategory với search, sort, pagination
export const fabricCategoryQuerySchema = querySchema.keys({
  sortBy: createSortBySchema(allowedFabricCategorySortFields),
  order: sortOrderSchema.optional()
});
