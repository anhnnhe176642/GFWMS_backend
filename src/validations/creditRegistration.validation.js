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
  'user.username',
  'user.fullname',
  'user.email',
  'approver.username',
  'approver.fullname',
  'createdAt',
  'updatedAt',
  'creditLimit',
  'creditUsed',
  'approvalDate',
  'isLocked',
  'status'
];

export const creditRegistrationQuerySchema = querySchema.keys({
  page: pageSchema,
  limit: limitSchema,

  status: createMultiValueFilterSchema(Joi.string()
    .valid('PENDING', 'APPROVED', 'REJECTED')
    .optional()
    .messages({
      'any.only': 'Status phải là PENDING, APPROVED hoặc REJECTED'
    })),
  isLocked: createMultiValueFilterSchema(Joi.boolean().messages({
    'boolean.base': 'isLocked phải là giá trị boolean'
  })),

  search: Joi.string().trim().optional().messages({
    'string.base': 'Từ khóa tìm kiếm phải là chuỗi'
  }),

  sortBy: createSortBySchema(allowedSortFields),
  order: sortOrderSchema.optional(),

  userId: createMultiValueFilterSchema(Joi.string().uuid().messages({
    'string.guid': 'UserId phải là UUID hợp lệ'
  }))
});