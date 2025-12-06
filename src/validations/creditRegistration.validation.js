import Joi from 'joi';
import {
  pageSchema,
  limitSchema,
  querySchema,
  createSortBySchema,
  sortOrderSchema,
  createMultiValueFilterSchema
} from './common.validation.js';

/* -----------------------------------------------------
 *   COMMON SCHEMA
 * ---------------------------------------------------*/
export const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    'number.base': 'ID phải là số',
    'number.integer': 'ID phải là số nguyên',
    'number.positive': 'ID phải lớn hơn 0',
    'any.required': 'ID là bắt buộc'
  })
});


/* -----------------------------------------------------
 *   QUERY FILTER (GET LIST)
 * ---------------------------------------------------*/
const allowedSortFields = [
  'createdAt',
  'updatedAt',
  'creditLimit',
  'status'
];

export const creditRegistrationQuerySchema = querySchema.keys({
  page: pageSchema,
  limit: limitSchema,

  status: Joi.string()
    .valid('PENDING', 'APPROVED', 'REJECTED')
    .optional()
    .messages({
      'any.only': 'Status phải là PENDING, APPROVED hoặc REJECTED'
    }),

  search: Joi.string().trim().optional().messages({
    'string.base': 'Từ khóa tìm kiếm phải là chuỗi'
  }),

  sortBy: createSortBySchema(allowedSortFields),
  order: sortOrderSchema.optional(),

  userId: createMultiValueFilterSchema(Joi.string().uuid().messages({
    'string.guid': 'UserId phải là UUID hợp lệ'
  }))
});