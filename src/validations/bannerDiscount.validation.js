import Joi from 'joi';
import {
  pageSchema,
  limitSchema,
  querySchema,
  createSortBySchema,
  sortOrderSchema,
  createMultiValueFilterSchema
} from './common.validation.js';



// Code giảm giá
const codeSchema = Joi.string()
  .trim()
  .min(1)
  .max(50)
  .required()
  .messages({
    'string.empty': 'Mã Code giảm giá không được để trống',
    'string.min': 'Mã Code giảm giá không được để trống',
    'string.max': 'Mã Code giảm giá không được vượt quá 50 ký tự',
    'any.required': 'Mã Code giảm giá là bắt buộc'
  });

// Loại giảm giá
const discountTypeSchema = Joi.string()
  .valid('PERCENTAGE', 'FIXED')
  .required()
  .messages({
    'any.only': 'Loại giảm giá phải là PERCENTAGE hoặc FIXED',
    'any.required': 'Loại giảm giá là bắt buộc'
  });

// Giá trị giảm giá
const discountValueSchema = Joi.number()
  .positive()
  .required()
  .messages({
    'number.base': 'Giá trị giảm giá phải là số',
    'number.positive': 'Giá trị giảm giá phải lớn hơn 0',
    'any.required': 'Giá trị giảm giá là bắt buộc'
  });

// Số lượng tối thiểu (optional)
const minQuantitySchema = Joi.number()
  .integer()
  .positive()
  .optional()
  .messages({
    'number.base': 'Số lượng tối thiểu phải là số',
    'number.integer': 'Số lượng tối thiểu phải là số nguyên',
    'number.positive': 'Số lượng tối thiểu phải lớn hơn 0'
  });

// Banner ID và Fabric ID
const bannerIdSchema = Joi.number()
  .integer()
  .positive()
  .required()
  .messages({
    'number.base': 'Banner ID phải là số',
    'number.integer': 'Banner ID phải là số nguyên',
    'number.positive': 'Banner ID phải là số dương',
    'any.required': 'Banner ID là bắt buộc'
  });

const fabricIdSchema = Joi.number()
  .integer()
  .positive()
  .required()
  .messages({
    'number.base': 'Fabric ID phải là số',
    'number.integer': 'Fabric ID phải là số nguyên',
    'number.positive': 'Fabric ID phải là số dương',
    'any.required': 'Fabric ID là bắt buộc'
  });


export const bannerDiscountIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    'number.base': 'ID BannerDiscount phải là số',
    'number.integer': 'ID BannerDiscount phải là số nguyên',
    'number.positive': 'ID BannerDiscount phải là số dương',
    'any.required': 'ID BannerDiscount là bắt buộc'
  })
});

export const paginationQuerySchema = Joi.object({
  page: pageSchema,
  limit: limitSchema
});


export const createBannerDiscountSchema = Joi.object({
  code: codeSchema,
  bannerId: bannerIdSchema,
  fabricId: fabricIdSchema,
  discountType: discountTypeSchema,
  discountValue: discountValueSchema,
  minQuantity: minQuantitySchema.optional()
});

export const updateBannerDiscountSchema = Joi.object({
  code: codeSchema.optional(),
  bannerId: bannerIdSchema.optional(),
  fabricId: fabricIdSchema.optional(),
  discountType: discountTypeSchema.optional(),
  discountValue: discountValueSchema.optional(),
  minQuantity: minQuantitySchema.optional()
}).min(1).messages({
  'object.min': 'Phải có ít nhất một trường cần cập nhật'
});



// Multi-value filter cho bannerId và fabricId
const bannerIdFilterSchema = Joi.number().integer().positive().messages({
  'number.base': 'Banner ID phải là số',
  'number.integer': 'Banner ID phải là số nguyên',
  'number.positive': 'Banner ID phải là số dương'
});

const fabricIdFilterSchema = Joi.number().integer().positive().messages({
  'number.base': 'Fabric ID phải là số',
  'number.integer': 'Fabric ID phải là số nguyên',
  'number.positive': 'Fabric ID phải là số dương'
});

// Fields allowed to sort
const allowedBannerDiscountSortFields = [
  'id',
  'code',
  'discountValue',
  'banner.title',
  'createdAt',
  'updatedAt'
];

export const bannerDiscountQuerySchema = querySchema.keys({
  page: pageSchema,
  limit: limitSchema,
  search: Joi.string().trim().optional().messages({
    'string.base': 'Từ khóa tìm kiếm phải là chuỗi'
  }),

  // Multi-value filter
  bannerId: createMultiValueFilterSchema(bannerIdFilterSchema, 'ID Banner'),
  fabricId: createMultiValueFilterSchema(fabricIdFilterSchema, 'ID Vải'),

  discountType: Joi.string().valid('PERCENTAGE', 'FIXED').optional(),

  sortBy: createSortBySchema(allowedBannerDiscountSortFields),
  order: sortOrderSchema.optional()
});
