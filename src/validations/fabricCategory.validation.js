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

// Schema cho description (không bắt buộc)
export const descriptionSchema = Joi.string()
  .trim()
  .max(255)
  .allow('', null)
  .messages({
    'string.max': 'Mô tả loại vải không được vượt quá 255 ký tự'
  });

// Schema cho giá bán theo mét
export const sellingPricePerMeterSchema = Joi.number()
  .positive()
  .precision(2)
  .required()
  .messages({
    'number.base': 'Giá bán theo mét phải là số',
    'number.positive': 'Giá bán theo mét phải lớn hơn 0',
    'any.required': 'Giá bán theo mét là bắt buộc'
  });

// Schema cho giá bán theo cuộn
export const sellingPricePerRollSchema = Joi.number()
  .positive()
  .precision(2)
  .required()
  .messages({
    'number.base': 'Giá bán theo cuộn phải là số',
    'number.positive': 'Giá bán theo cuộn phải lớn hơn 0',
    'any.required': 'Giá bán theo cuộn là bắt buộc'
  });

// Schema validation cho tạo FabricCategory
export const createFabricCategorySchema = Joi.object({
  name: nameSchema,
  description: descriptionSchema.optional(),
  sellingPricePerMeter: sellingPricePerMeterSchema,
  sellingPricePerRoll: sellingPricePerRollSchema
});

// Schema validation cho cập nhật FabricCategory
export const updateFabricCategorySchema = Joi.object({
  name: nameSchema.optional(),
  description: descriptionSchema.optional(),
  sellingPricePerMeter: sellingPricePerMeterSchema.optional(),
  sellingPricePerRoll: sellingPricePerRollSchema.optional()
}).min(1).messages({
  'object.min': 'Phải có ít nhất một trường cần cập nhật'
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
const allowedFabricCategorySortFields = [
  'name',
  'description',
  'createdAt',
  'updatedAt',
  'sellingPricePerMeter',
  'sellingPricePerRoll'
];

// Advanced query schema cho FabricCategory với search, sort, pagination
export const fabricCategoryQuerySchema = querySchema.keys({
  sortBy: createSortBySchema(allowedFabricCategorySortFields),
  order: sortOrderSchema.optional()
});
