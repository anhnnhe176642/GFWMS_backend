import Joi from 'joi';
import { querySchema, createSortBySchema, sortOrderSchema } from './common.validation.js';

// Schema cơ bản cho name của FabricColor
export const nameSchema = Joi.string()
  .max(100)
  .required()
  .trim()
  .messages({
    'string.base': 'Tên màu phải là chuỗi',
    'string.empty': 'Tên màu không được để trống',
    'string.max': 'Tên màu không được vượt quá 100 ký tự',
    'any.required': 'Tên màu là bắt buộc'
  });
  
// Schema validation cho tạo FabricColor
export const createFabricColorSchema = Joi.object({
  id: Joi.string().trim().max(50).required().messages({
    'string.base': 'ID phải là chuỗi',
    'string.max': 'ID không được vượt quá 50 ký tự',
    'any.required': 'ID là bắt buộc'
  }),
  name: nameSchema,
  hexCode: Joi.string()
    .trim()
    .max(7)
    .pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .optional()
    .messages({
      'string.base': 'Mã hex phải là chuỗi',
      'string.max': 'Mã hex không được vượt quá 7 ký tự',
      'string.pattern.base': 'Mã hex phải có định dạng #RRGGBB hoặc #RGB',
      'string.empty': 'Mã hex không được để trống'
    })
});


// Schema validation cho cập nhật FabricColor
export const updateFabricColorSchema = Joi.object({
  name: Joi.string()
    .trim()
    .max(100)
    .required()
    .messages({
      'string.base': 'Tên màu phải là chuỗi',
      'string.max': 'Tên màu không được vượt quá 100 ký tự',
      'any.required': 'Tên màu là bắt buộc',
      'string.empty': 'Tên màu không được để trống'
    }),
  hexCode: Joi.string()
    .trim()
    .max(7)
    .pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .optional()
    .messages({
      'string.base': 'Mã hex phải là chuỗi',
      'string.max': 'Mã hex không được vượt quá 7 ký tự',
      'string.pattern.base': 'Mã hex phải có định dạng #RRGGBB hoặc #RGB',
      'string.empty': 'Mã hex không được để trống'
    })
});


// Schema validation cho param id (String)
export const fabricColorIdParamSchema = Joi.object({
  id: Joi.string().trim().max(50).required().messages({
    'string.base': 'ID phải là chuỗi',
    'string.max': 'ID không được vượt quá 50 ký tự',
    'any.required': 'ID là bắt buộc'
  })
});

// Allowed fields for sorting FabricColor
const allowedFabricColorSortFields = ['name', 'createdAt', 'updatedAt'];

// Advanced query schema cho FabricColor với search, sort, pagination
export const fabricColorQuerySchema = querySchema.keys({
  sortBy: createSortBySchema(allowedFabricColorSortFields),
  order: sortOrderSchema.optional()
});
