import Joi from 'joi';
import { querySchema, createMultiValueFilterSchema, dateFromSchema, dateToSchema, createSortBySchema, sortOrderSchema } from './common.validation.js';

// --- Schema cho các field Shelf ---
export const shelfCodeSchema = Joi.string()
  .min(2)
  .max(50)
  .required()
  .empty('')
  .trim()
  .messages({
    'string.base': 'Mã kệ phải là chuỗi',
    'string.min': 'Mã kệ phải có ít nhất 2 ký tự',
    'string.max': 'Mã kệ không được vượt quá 50 ký tự',
    'any.required': 'Mã kệ là bắt buộc',
    'string.empty': 'Mã kệ là bắt buộc'
  });

export const shelfQuantitySchema = Joi.number()
  .integer()
  .min(0)
  .messages({
    'number.base': 'Số lượng phải là một số',
    'number.integer': 'Số lượng phải là số nguyên',
    'number.min': 'Số lượng không được nhỏ hơn 0'
  });

export const shelfMaxQuantitySchema = Joi.number()
  .integer()
  .min(1)
  .messages({
    'number.base': 'Sức chứa tối đa phải là một số',
    'number.integer': 'Sức chứa tối đa phải là số nguyên',
    'number.min': 'Sức chứa tối đa phải lớn hơn 0'
  });

export const warehouseIdSchemaForShelf = Joi.number()
  .integer()
  .required()
  .messages({
    'any.required': 'ID kho là bắt buộc',
    'number.base': 'ID kho phải là số',
    'number.integer': 'ID kho phải là số nguyên'
  });

// --- Create & Update Schemas ---
export const createShelfSchema = Joi.object({
  code: shelfCodeSchema,
  maxQuantity: shelfMaxQuantitySchema,
  warehouseId: warehouseIdSchemaForShelf
});

export const updateShelfSchema = Joi.object({
  code: shelfCodeSchema.trim().required(),
  currentQuantity: shelfQuantitySchema.required().messages({
    'any.required': 'Số lượng hiện tại là bắt buộc'
  }),
  maxQuantity: shelfMaxQuantitySchema.required().messages({
    'any.required': 'Sức chứa tối đa là bắt buộc'
  }),
  warehouseId: warehouseIdSchemaForShelf.required().messages({
    'any.required': 'ID kho là bắt buộc'
  })
});

// --- Query & ID Schemas ---
const allowedShelfSortFields = ['code', 'currentQuantity', 'maxQuantity', 'warehouseId', 'createdAt', 'updatedAt'];

export const shelfQuerySchema = querySchema.keys({
  warehouseId: createMultiValueFilterSchema(warehouseIdSchemaForShelf, 'ID kho'),
  sortBy: createSortBySchema(allowedShelfSortFields),
  order: sortOrderSchema,
  createdFrom: dateFromSchema,
  createdTo: dateToSchema
});

export const shelfIdSchema = Joi.object({
  id: Joi.string()
    .required()
    .custom((value, helpers) => {
      if (value === '{id}' || value === '' || !value) {
        return helpers.error('any.required');
      }
      if (!/^\d+$/.test(value)) {
        return helpers.error('string.pattern.base');
      }
      return value;
    })
    .messages({
      'any.required': 'ID kệ là bắt buộc',
      'string.pattern.base': 'ID kệ phải là số nguyên dương'
    })
});
