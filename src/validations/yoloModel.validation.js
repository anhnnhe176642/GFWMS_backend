import Joi from 'joi';
import { 
  createSortBySchema, 
  sortOrderSchema, 
  searchSchema,
  pageSchema,
  limitSchema,
  idSchema,
  createMultiValueFilterSchema
} from './common.validation.js';

// ===== Reusable Field Schemas =====
export const modelIdSchema = idSchema;

export const optionalModelIdSchema = Joi.number()
  .integer()
  .optional()
  .messages({
    'number.base': 'ID model phải là một số',
    'number.integer': 'ID model phải là một số nguyên'
  });

export const modelNameSchema = Joi.string()
  .min(3)
  .max(100)
  .optional()
  .messages({
    'string.min': 'Tên model phải có ít nhất 3 ký tự',
    'string.max': 'Tên model không được vượt quá 100 ký tự'
  });

export const modelDescriptionSchema = Joi.string()
  .max(500)
  .optional()
  .messages({
    'string.max': 'Mô tả không được vượt quá 500 ký tự'
  });

export const modelVersionSchema = Joi.string()
  .max(50)
  .optional()
  .messages({
    'string.max': 'Phiên bản không được vượt quá 50 ký tự'
  });

export const confidenceSchema = Joi.number()
  .min(0)
  .max(1)
  .default(0.5)
  .messages({
    'number.min': 'Độ tin cậy phải ít nhất 0',
    'number.max': 'Độ tin cậy không được vượt quá 1'
  });

export const statusSchema = Joi.string()
  .valid('ACTIVE', 'DEPRECATED', 'TESTING')
  .default('ACTIVE')
  .optional()
  .messages({
    'any.only': 'Trạng thái phải là một trong: ACTIVE, DEPRECATED, TESTING'
  });

// ===== Param Schemas =====
export const modelIdParamSchema = Joi.object({
  modelId: modelIdSchema
});

// ===== Composite Schemas =====
export const uploadYoloModelSchema = Joi.object({
  name: modelNameSchema,
  description: modelDescriptionSchema,
  version: modelVersionSchema
});

export const selectYoloModelSchema = Joi.object({
  modelId: modelIdSchema
});

export const yoloDetectionSchema = Joi.object({
  confidence: confidenceSchema,
  modelId: optionalModelIdSchema
});

export const getModelsSchema = Joi.object({
  page: pageSchema,
  limit: limitSchema,
  search: searchSchema.optional(),
  sortBy: createSortBySchema(['name', 'createdAt', 'version', 'status']).optional(),
  order: sortOrderSchema.optional(),
  status: createMultiValueFilterSchema(['ACTIVE', 'DEPRECATED', 'TESTING']).optional()
});

export const paginationSchema = Joi.object({
  page: pageSchema,
  limit: limitSchema,
  search: searchSchema.optional(),
  sortBy: createSortBySchema(['detectedAt', 'confidence']).optional(),
  order: sortOrderSchema.optional()
});

// ===== Token Upload Schema =====
export const tokenParamSchema = Joi.object({
  token: Joi.string()
    .required()
    .messages({
      'string.empty': 'Token là bắt buộc',
      'any.required': 'Token là bắt buộc'
    })
});

export const uploadModelWithTokenSchema = Joi.object({
  name: modelNameSchema,
  description: modelDescriptionSchema,
  version: modelVersionSchema
});
