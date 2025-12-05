import Joi from 'joi';
import {
  pageSchema,
  limitSchema,
  querySchema,
  createSortBySchema,
  sortOrderSchema
} from './common.validation.js';

/* -----------------------------------------------------
 *   COMMON SCHEMA
 * ---------------------------------------------------*/

// UUID param
export const uuidParamSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    'string.base': 'ID phải là chuỗi',
    'string.guid': 'ID phải là UUID hợp lệ',
    'any.required': 'ID là bắt buộc'
  })
});

/* -----------------------------------------------------
 *   CREATE CREDIT REGISTRATION
 * ---------------------------------------------------*/

export const createCreditRegistrationSchema = Joi.object({
  note: Joi.string().allow(null, '').max(500)
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
  order: sortOrderSchema.optional()
});

/* -----------------------------------------------------
 *   UPDATE STATUS (APPROVE / REJECT)
 * ---------------------------------------------------*/

const statusSchema = Joi.string()
  .valid('APPROVED', 'REJECTED')
  .required()
  .messages({
    'any.only': 'Trạng thái phải là APPROVED hoặc REJECTED',
    'any.required': 'Trạng thái là bắt buộc'
  });


const creditLimitSchema = Joi.number()
  .positive()
  .when('status', {
    is: 'APPROVED',
    then: Joi.required().messages({
      'any.required': 'creditLimit là bắt buộc và phải lớn hơn 0 khi duyệt đơn',
      'number.base': 'creditLimit phải là số',
      'number.positive': 'creditLimit phải lớn hơn 0'
    }),
    otherwise: Joi.forbidden() 
  });

export const updateCreditStatusSchema = Joi.object({
  status: statusSchema,
  creditLimit: creditLimitSchema
});
