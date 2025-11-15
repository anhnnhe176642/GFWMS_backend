import Joi from 'joi';
import {
  pageSchema,
  limitSchema,
  querySchema,
  createSortBySchema,
  sortOrderSchema,
  dateFromSchema,
  dateToSchema,
  createMultiValueFilterSchema
} from './common.validation.js';


// Title của Banner
const titleSchema = Joi.string()
  .trim()
  .min(1)
  .max(100)
  .required()
  .messages({
    'string.empty': 'Tiêu đề banner không được để trống',
    'string.min': 'Tiêu đề banner không được để trống',
    'string.max': 'Tiêu đề banner không được vượt quá 100 ký tự',
    'any.required': 'Tiêu đề banner là bắt buộc'
  });

// Description (không bắt buộc)
const descriptionSchema = Joi.string()
  .trim()
  .max(255)
  .allow('', null)
  .messages({
    'string.max': 'Mô tả banner không được vượt quá 255 ký tự'
  });

// URL hình ảnh
const imageUrlSchema = Joi.string()
  .trim()
  .uri()
  .required()
  .messages({
    'string.uri': 'URL hình ảnh banner không hợp lệ',
    'any.required': 'URL hình ảnh banner là bắt buộc'
  });

// Start date / End date
const startDateSchema = Joi.date()
  .required()
  .messages({
    'date.base': 'Ngày bắt đầu không hợp lệ',
    'any.required': 'Ngày bắt đầu là bắt buộc'
  });

const endDateSchema = Joi.date()
  .required()
  .messages({
    'date.base': 'Ngày kết thúc không hợp lệ',
    'any.required': 'Ngày kết thúc là bắt buộc'
  });

// isActive
const isActiveSchema = Joi.boolean().optional();


export const bannerIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    'number.base': 'ID banner phải là số',
    'number.integer': 'ID banner phải là số nguyên',
    'number.positive': 'ID banner phải là số dương',
    'any.required': 'ID banner là bắt buộc'
  })
});

export const paginationQuerySchema = Joi.object({
  page: pageSchema,
  limit: limitSchema
});


export const createBannerSchema = Joi.object({
  title: titleSchema,
  description: descriptionSchema.optional(),
  imageUrl: imageUrlSchema,
  startDate: startDateSchema,
  endDate: endDateSchema,
  isActive: isActiveSchema
});

export const updateBannerSchema = Joi.object({
  title: titleSchema.optional(),
  description: descriptionSchema.optional(),
  imageUrl: imageUrlSchema.optional(),
  startDate: startDateSchema.optional(),
  endDate: endDateSchema.optional(),
  isActive: isActiveSchema.optional()
}).min(1).messages({
  'object.min': 'Phải có ít nhất một trường cần cập nhật'
});



// Multi-value filter cho isActive (ví dụ filter nhiều trạng thái)
const isActiveFilterSchema = Joi.boolean().required().messages({
  'boolean.base': 'Trạng thái isActive phải là true hoặc false',
  'any.required': 'Trạng thái isActive là bắt buộc'
});

const allowedBannerSortFields = [
  'title',
  'startDate',
  'endDate',
  'isActive',
  'createdAt',
  'updatedAt'
];

export const bannerQuerySchema = querySchema.keys({
  page: pageSchema,
  limit: limitSchema,
  search: Joi.string().trim().optional().messages({
    'string.base': 'Từ khóa tìm kiếm phải là chuỗi'
  }),

  // Multi-value filter: isActive
  isActive: createMultiValueFilterSchema(isActiveFilterSchema, 'Trạng thái'),

  startDateFrom: dateFromSchema,
  startDateTo: dateToSchema.min(Joi.ref('startDateFrom')).messages({
    'date.min': 'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu'
  }),

  endDateFrom: dateFromSchema,
  endDateTo: dateToSchema.min(Joi.ref('endDateFrom')).messages({
    'date.min': 'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu'
  }),

  sortBy: createSortBySchema(allowedBannerSortFields),
  order: sortOrderSchema.optional()
});
