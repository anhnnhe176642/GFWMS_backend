import Joi from 'joi';
import {
  uuidSchema,
  pageSchema,
  limitSchema,
  querySchema,
  createSortBySchema,
  sortOrderSchema,
  dateFromSchema,
  dateToSchema,
  createMultiValueFilterSchema,
} from './common.validation.js';

// ENUM Request Status
const requestStatusSchema = Joi.string().valid('PENDING', 'APPROVED', 'REJECTED');

export const approveRequestSchema = Joi.object({
  status: Joi.string().valid('APPROVED').required().messages({
    'any.only': 'Status phải là APPROVED',
    'any.required': 'Trạng thái là bắt buộc'
  }),

  requestLimit: Joi.number().positive().required().messages({
    'number.base': 'Hạn mức phải là số',
    'number.positive': 'Hạn mức phải lớn hơn 0',
    'any.required': 'Hạn mức là bắt buộc'
  }),

  note: Joi.string().trim().max(255).allow(null, '')
});


export const rejectRequestSchema = Joi.object({
  status: Joi.string().valid('REJECTED').required().messages({
    'any.only': 'Chỉ có thể từ chối (REJECTED)',
    'any.required': 'Trạng thái là bắt buộc'
  }),
  note: Joi.string().trim().max(255).allow(null, '')
});


export const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    'number.base': 'ID phải là số',
    'number.integer': 'ID phải là số nguyên',
    'number.positive': 'ID phải lớn hơn 0',
    'any.required': 'ID là bắt buộc'
  })
});

// Allowed fields for sorting
const allowedCreditRequestSortFields = [
  'user.username',
  'user.fullname',
  'user.email',
  'createdAt',
  'updatedAt',
  'requestLimit',
  'status',
  'type'
];

/* ==========================================================
 * Schema: Create Credit Request
 * ========================================================== */
export const createCreditRequestSchema = Joi.object({
  requestLimit: Joi.number().positive().required(),
  note: Joi.string().trim().max(255).allow(null, '')
});


/* ==========================================================
 * Schema: UUID Param
 * ========================================================== */
export const creditRequestIdParamSchema = Joi.object({
  id: uuidSchema.required()
});

/* ==========================================================
 * Schema: Pagination Query
 * ========================================================== */
export const creditRequestPaginationSchema = Joi.object({
  page: pageSchema,
  limit: limitSchema
});

/* ==========================================================
 * Advanced Query: search + filter + sort
 * ========================================================== */
export const creditRequestQuerySchema = querySchema.keys({
  // Sorting
  sortBy: createSortBySchema(allowedCreditRequestSortFields),
  order: sortOrderSchema.optional(),

  // Filters
  status: createMultiValueFilterSchema(requestStatusSchema, 'RequestStatus'),
  userId: createMultiValueFilterSchema(Joi.string().uuid().messages({
    'string.guid': 'UserId phải là UUID hợp lệ'
  })),

  // Date range
  createdFrom: dateFromSchema,
  createdTo: dateToSchema.min(Joi.ref('createdFrom')).messages({
    'date.min': 'createdTo phải lớn hơn hoặc bằng createdFrom'
  })
});
