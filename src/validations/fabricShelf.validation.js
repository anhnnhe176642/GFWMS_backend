import Joi from 'joi';
import { 
  querySchema, 
  createSortBySchema, 
  sortOrderSchema 
} from './common.validation.js';
import { warehouseIdSchema } from './warehouse.validation.js';

//
// ──────────────────────────────────────────────
//  SCHEMA CƠ BẢN
// ──────────────────────────────────────────────
//

//  Schema cho shelfId (kệ)
export const shelfIdSchema = Joi.number().integer().positive().required().messages({
  'number.base': 'ID kệ phải là số',
  'number.integer': 'ID kệ phải là số nguyên',
  'number.positive': 'ID kệ phải lớn hơn 0',
  'any.required': 'ID kệ là bắt buộc'
});

//  Schema cho fabricId (vải)
export const fabricIdSchema = Joi.number().integer().positive().required().messages({
    'number.base': 'ID phải là số',
    'number.positive': 'ID phải lớn hơn 0',
    'number.integer': 'ID phải là số nguyên dương',
    'any.required': 'ID là bắt buộc'
  });

//  Schema cho quantity (số lượng)
export const quantitySchema = Joi.number().integer().positive().required().messages({
  'number.base': 'Số lượng phải là số',
  'number.integer': 'Số lượng phải là số nguyên',
  'number.positive': 'Số lượng phải lớn hơn 0',
  'any.required': 'Số lượng là bắt buộc'
});

//
// ──────────────────────────────────────────────
//  SCHEMA CHÍNH: PHÂN BỔ VẢI VÀO KỆ
// ──────────────────────────────────────────────
//

//  Schema cho từng kệ trong danh sách shelves
export const shelfAllocationItemSchema = Joi.object({
  shelfId: shelfIdSchema,
  quantity: quantitySchema
}).options({
  stripUnknown: true
});

//  Schema cho request body khi phân bổ vải
export const allocateFabricSchema = Joi.object({
  importFabricId: Joi.number().integer().positive().required().messages({
    'number.base': 'ID đơn nhập phải là số',
    'number.integer': 'ID đơn nhập phải là số nguyên',
    'number.positive': 'ID đơn nhập phải lớn hơn 0',
    'any.required': 'ID đơn nhập là bắt buộc'
  }),

  shelves: Joi.array()
    .items(shelfAllocationItemSchema)
    .min(1)
    .required()
    .messages({
      'array.min': 'Phải có ít nhất 1 kệ để phân bổ vải',
      'any.required': 'Danh sách kệ là bắt buộc'
    })
}).options({
  stripUnknown: true
});

//
// ──────────────────────────────────────────────
//  SCHEMA CHO CÁC API QUERY / LỌC DANH SÁCH
// ──────────────────────────────────────────────
//

const allowedFabricShelfSortFields = ['shelfId', 'fabricId', 'quantity', 'createdAt', 'updatedAt'];

export const fabricShelfQuerySchema = querySchema.keys({
  warehouseId: warehouseIdSchema.optional(),
  shelfId: shelfIdSchema.optional(),
  fabricId: fabricIdSchema.optional(),
  sortBy: createSortBySchema(allowedFabricShelfSortFields),
  order: sortOrderSchema
});

//
// ──────────────────────────────────────────────
//  SCHEMA CHO PATH PARAM
// ──────────────────────────────────────────────
//

// Dùng khi validate param :fabricId trong router
export const fabricIdParamSchema = Joi.object({
  fabricId: fabricIdSchema
});

export const shelfIdParamSchema = Joi.object({
  shelfId: shelfIdSchema
});

// Param validation cho API lấy color
export const shelfIdOnlyParamSchema = Joi.object({
  shelfId: shelfIdSchema
});
