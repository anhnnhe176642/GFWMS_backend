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


export const importFabricItemSchema = Joi.object({


   thickness: Joi.number().positive().required().messages({
    'number.base': 'Thickness phải là số',
    'number.positive': 'Thickness phải là số dương',
    'any.required': 'Thickness là bắt buộc'
  }),
  glossId: Joi.number().integer().positive().required().messages({
    'number.base': 'GlossId phải là số',
    'number.integer': 'GlossId phải là số nguyên',
    'number.positive': 'GlossId phải là số nguyên dương',
    'any.required': 'GlossId là bắt buộc'
  }),

  length: Joi.number().positive().required().messages({
    'number.base': 'Length phải là số',
    'number.positive': 'Length phải là số dương',
    'any.required': 'Length là bắt buộc'
  }),
  width: Joi.number().positive().required().messages({
    'number.base': 'Width phải là số',
    'number.positive': 'Width phải là số dương',
    'any.required': 'Width là bắt buộc'
  }),
  weight: Joi.number().positive().required().messages({
    'number.base': 'Weight phải là số',
    'number.positive': 'Weight phải là số dương',
    'any.required': 'Weight là bắt buộc'
  }),
  categoryId: Joi.number().integer().positive().required().messages({
    'number.base': 'CategoryId phải là số',
    'number.integer': 'CategoryId phải là số nguyên',
    'number.positive': 'CategoryId phải là số nguyên dương',
    'any.required': 'CategoryId là bắt buộc'
  }),
  colorId: Joi.string().required().messages({
    'any.required': 'ColorId là bắt buộc',
    'string.empty': 'ColorId không được để trống'
  }),
  supplierId: Joi.number().integer().positive().required().messages({
    'number.base': 'SupplierId phải là số',
    'number.integer': 'SupplierId phải là số nguyên',
    'number.positive': 'SupplierId phải là số nguyên dương',
    'any.required': 'SupplierId là bắt buộc'
  }),
  quantity: quantitySchema,
  price: priceSchema
}).options({ 
  stripUnknown: true 
});


export const createImportFabricSchema = Joi.object({
  warehouseId: Joi.number().integer().positive().required().messages({
    'number.base': 'Warehouse ID phải là số',
    'number.integer': 'Warehouse ID phải là số nguyên dương',
    'any.required': 'Warehouse ID là bắt buộc'
  }),
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