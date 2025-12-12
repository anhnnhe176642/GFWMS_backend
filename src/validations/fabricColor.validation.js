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
const allowedFabricColorSortFields = ['id','hexCode','name', 'createdAt', 'updatedAt'];

// Allowed color families
const allowedColorFamilies = [
  'Đỏ',
  'Cam',
  'Vàng',
  'Xanh lá',
  'Xanh dương',
  'Tím',
  'Hồng',
  'Đen',
  'Trắng',
  'Xám'
];

// Advanced query schema cho FabricColor với search, sort, pagination
export const fabricColorQuerySchema = querySchema.keys({
  sortBy: createSortBySchema(allowedFabricColorSortFields),
  order: sortOrderSchema.optional(),
  colorFamily: Joi.string()
    .trim()
    .valid(...allowedColorFamilies)
    .optional()
    .messages({
      'string.base': 'Color family phải là chuỗi',
      'any.only': `Color family phải là một trong: ${allowedColorFamilies.join(', ')}`
    }),
  hexSearchColor: Joi.string()
    .trim()
    .pattern(/^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .optional()
    .messages({
      'string.base': 'Hex search color phải là chuỗi',
      'string.pattern.base': 'Hex search color phải có định dạng #RRGGBB, #RGB hoặc RRGGBB'
    }),
  hexSearchRange: Joi.number()
    .integer()
    .min(0)
    .max(100)
    .optional()
    .messages({
      'number.base': 'Hex search range phải là số',
      'number.min': 'Hex search range phải >= 0',
      'number.max': 'Hex search range phải <= 100'
    })
});
