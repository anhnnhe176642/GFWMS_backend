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

// Description
const descriptionSchema = Joi.string()
  .trim()
  .max(255)
  .allow('', null)
  .messages({
    'string.max': 'Mô tả banner không được vượt quá 255 ký tự'
  });

// Image URL
const imageUrlSchema = Joi.string()
  .trim()
  .uri()
  .required()
  .messages({
    'string.empty': 'URL hình ảnh banner không được để trống',
    'string.uri': 'URL hình ảnh banner không hợp lệ',
    'any.required': 'URL hình ảnh banner là bắt buộc'
  });

// Start / End date - Joi will auto-convert to Date object
const startDateSchema = Joi.date()
  .iso()
  .required()
  .messages({
    'date.base': 'Ngày bắt đầu phải đúng định dạng (YYYY-MM-DD hoặc ISO 8601)',
    'date.isoDate': 'Ngày bắt đầu phải đúng định dạng (YYYY-MM-DD hoặc ISO 8601)',
    'any.required': 'Ngày bắt đầu là bắt buộc'
  });

const endDateSchema = Joi.date()
  .iso()
  .required()
  .messages({
    'date.base': 'Ngày kết thúc phải đúng định dạng (YYYY-MM-DD hoặc ISO 8601)',
    'date.isoDate': 'Ngày kết thúc phải đúng định dạng (YYYY-MM-DD hoặc ISO 8601)',
    'any.required': 'Ngày kết thúc là bắt buộc'
  });


// isActive
const isActiveSchema = Joi.boolean()
  .optional()
  .messages({
    'boolean.base': 'Trạng thái hoạt động phải là true hoặc false'
  });


// ID param
export const bannerIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    'number.base': 'ID banner phải là số',
    'number.integer': 'ID banner phải là số nguyên',
    'number.positive': 'ID banner phải là số dương',
    'any.required': 'ID banner là bắt buộc'
  })
});

// Pagination
export const paginationQuerySchema = Joi.object({
  page: pageSchema,
  limit: limitSchema
});


// CREATE
export const createBannerSchema = Joi.object({
  title: titleSchema,
  description: descriptionSchema.optional(),
  imageUrl: imageUrlSchema,
  startDate: startDateSchema,
  endDate: endDateSchema,
  isActive: isActiveSchema
});


// UPDATE
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


// Filter isActive
const isActiveFilterSchema = Joi.boolean()
  .required()
  .messages({
    'boolean.base': 'Trạng thái isActive phải là true hoặc false',
    'any.required': 'Trạng thái isActive là bắt buộc'
  });


// Allowed sort
const allowedBannerSortFields = [
  'title',
  'startDate',
  'endDate',
  'isActive',
  'createdAt',
  'updatedAt'
];


// QUERY
export const bannerQuerySchema = querySchema.keys({
  page: pageSchema,
  limit: limitSchema,

  search: Joi.string().trim().optional().messages({
    'string.base': 'Từ khóa tìm kiếm phải là chuỗi'
  }),

  isActive: createMultiValueFilterSchema(isActiveFilterSchema, 'Trạng thái'),

  startDate: dateFromSchema.optional(),

  endDate: dateToSchema
    .optional()
    .custom((value, helpers) => {
      const { startDate } = helpers.state.ancestors[0];

      if (value && !startDate) {
        return helpers.error('any.custom', { message: 'Vui lòng nhập ngày bắt đầu trước' });
      }

      if (startDate && new Date(value < new Date(startDate))) {
        return helpers.error('date.min', { limit: startDate });
      }

      return value;
    })
    .messages({
      'any.custom': '{{#message}}',
      'date.min': 'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu'
    }),

  sortBy: createSortBySchema(allowedBannerSortFields),
  order: sortOrderSchema.optional()
});
