import Joi from 'joi';
import { idSchema } from './common.validation.js';
import { querySchema, createSortBySchema, sortOrderSchema } from './common.validation.js';

// Schema cơ bản cho description của FabricGloss
export const descriptionSchema = Joi.string()
  .trim()
  .min(1)
  .max(100)
  .required()
  .messages({
    'string.empty': 'Mô tả không được để trống',
    'string.min': 'Mô tả không được để trống',
    'string.max': 'Mô tả không được vượt quá 100 ký tự',
    'any.required': 'Mô tả là bắt buộc'
  });


// Schema validation cho tạo FabricGloss
export const createFabricGlossSchema = Joi.object({
  description: descriptionSchema
});

// Schema validation cho cập nhật FabricGloss
export const updateFabricGlossSchema = Joi.object({
  description: descriptionSchema
});

// Schema validation cho param id
export const fabricGlossIdParamSchema = Joi.object({
  id: idSchema
});


// Allowed fields for sorting FabricGloss
const allowedFabricGlossSortFields = ['description', 'createdAt', 'updatedAt'];

// Advanced query schema cho FabricGloss với search, sort, pagination
export const fabricGlossQuerySchema = querySchema.keys({
  sortBy: createSortBySchema(allowedFabricGlossSortFields),
  order: sortOrderSchema.optional()
});
