import Joi from 'joi';
import { 
  querySchema, 
  dateFromSchema, 
  dateToSchema, 
  createSortBySchema, 
  sortOrderSchema,
} from './common.validation.js';
import { warehouseIdSchema } from './warehouse.validation.js';

export const quantitySchema = Joi.number()
  .integer()
  .positive()
  .required()
  .messages({
    'number.base': 'Quantity phải là số',
    'number.integer': 'Quantity phải là số nguyên',
    'number.positive': 'Quantity phải lớn hơn 0',
    'any.required': 'Quantity là bắt buộc'
  });

export const priceSchema = Joi.number()
  .min(0)
  .required()
  .messages({
    'number.base': 'Price phải là số',
    'number.min': 'Price không được âm',
    'any.required': 'Price là bắt buộc'
  });

  export const positiveNumberSchema = Joi.number().positive().required().messages({
  'number.base': 'Phải là số',
  'number.positive': 'Phải là số dương',
  'any.required': 'Trường này là bắt buộc'
});

export const positiveIntegerSchema = Joi.number().integer().positive().required().messages({
  'number.base': 'Phải là số nguyên',
  'number.integer': 'Phải là số nguyên',
  'number.positive': 'Phải lớn hơn 0',
  'any.required': 'Trường này là bắt buộc'
});

export const importFabricItemSchema = Joi.object({

    thickness: positiveNumberSchema,
    glossId: positiveIntegerSchema,
    length: positiveNumberSchema,
    width: positiveNumberSchema,
    weight: positiveNumberSchema,
    categoryId: positiveIntegerSchema,

  colorId: Joi.string().required().messages({
    'any.required': 'ColorId là bắt buộc',
    'string.empty': 'ColorId không được để trống'
  }),
  supplierId: positiveIntegerSchema,
  quantity: quantitySchema,
  price: priceSchema
}).options({ 
  stripUnknown: true 
});


export const createImportFabricSchema = Joi.object({
  warehouseId: positiveIntegerSchema,
  items: Joi.array()
    .min(1)
    .items(importFabricItemSchema)
    .required()
    .messages({
      'array.min': 'Phải có ít nhất 1 item',
      'any.required': 'Items là bắt buộc'
    })
});


const allowedImportFabricSortFields = ['id', 'importDate', 'totalPrice', 'createdAt'];

export const importFabricQuerySchema = querySchema.keys({
  warehouseId: warehouseIdSchema.optional(),
  importer: Joi.string().optional(),
  sortBy: createSortBySchema(allowedImportFabricSortFields),
  order: sortOrderSchema,
  importDateFrom: dateFromSchema,
  importDateTo: dateToSchema
});

export const importFabricIdSchema = warehouseIdSchema;