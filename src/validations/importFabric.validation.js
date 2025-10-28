import Joi from 'joi';
import { 
  querySchema, 
  dateFromSchema, 
  dateToSchema, 
  createSortBySchema, 
  sortOrderSchema 
} from './common.validation.js';


const numericStringSchema = Joi.string()
  .pattern(/^\d+$/)
  .messages({
    'string.pattern.base': 'Phải là số nguyên dương',
    'string.empty': 'Trường này không được để trống'
  });

const floatStringSchema = Joi.string()
  .pattern(/^\d+(\.\d+)?$/)
  .messages({
    'string.pattern.base': 'Phải là số dương',
    'string.empty': 'Trường này không được để trống'
  });

export const quantitySchema = Joi.string()
  .pattern(/^\d+$/)
  .required()
  .custom((value, helpers) => {
    const num = parseInt(value, 10);
    if (num <= 0) {
      return helpers.error('any.invalid');
    }
    return value;
  })
  .messages({
    'string.pattern.base': 'Quantity phải là số nguyên dương',
    'any.required': 'Quantity là bắt buộc',
    'string.empty': 'Quantity không được để trống',
    'any.invalid': 'Quantity phải lớn hơn 0'
  });

export const priceSchema = Joi.string()
  .pattern(/^\d+(\.\d+)?$/)
  .required()
  .custom((value, helpers) => {
    const num = parseFloat(value);
    if (num < 0) {
      return helpers.error('any.invalid');
    }
    return value;
  })
  .messages({
    'string.pattern.base': 'Price phải là số dương',
    'any.required': 'Price là bắt buộc',
    'string.empty': 'Price không được để trống',
    'any.invalid': 'Price không được âm'
  });


export const importFabricItemSchema = Joi.object({


  thickness: floatStringSchema.required().messages({
    'any.required': 'Thickness là bắt buộc',
    'string.pattern.base': 'Thickness phải là số dương'
  }),
  glossId: numericStringSchema.required().messages({
    'any.required': 'GlossId là bắt buộc',
    'string.pattern.base': 'GlossId phải là số nguyên dương'
  }),
  length: floatStringSchema.required().messages({
    'any.required': 'Length là bắt buộc',
    'string.pattern.base': 'Length phải là số dương'
  }),
  width: floatStringSchema.required().messages({
    'any.required': 'Width là bắt buộc',
    'string.pattern.base': 'Width phải là số dương'
  }),
  weight: floatStringSchema.required().messages({
    'any.required': 'Weight là bắt buộc',
    'string.pattern.base': 'Weight phải là số dương'
  }),
  categoryId: numericStringSchema.required().messages({
    'any.required': 'CategoryId là bắt buộc',
    'string.pattern.base': 'CategoryId phải là số nguyên dương'
  }),
  colorId: Joi.string().required().messages({
    'any.required': 'ColorId là bắt buộc',
    'string.empty': 'ColorId không được để trống'
  }),
  supplierId: numericStringSchema.required().messages({
    'any.required': 'SupplierId là bắt buộc',
    'string.pattern.base': 'SupplierId phải là số nguyên dương'
  }),
  
 
  fabricId: Joi.forbidden().messages({
    'any.unknown': 'Không cần gửi fabricId, hệ thống tự động xử lý'
  }),
  sellingPrice: Joi.forbidden().messages({
    'any.unknown': 'Nhân viên nhập kho không có quyền set sellingPrice'
  }),
  quantityInStock: Joi.forbidden().messages({
    'any.unknown': 'Không cần gửi quantityInStock, hệ thống tự động tính'
  }),
  
  quantity: quantitySchema,
  price: priceSchema
});


export const createImportFabricSchema = Joi.object({
  warehouseId: numericStringSchema.required().messages({
    'any.required': 'Warehouse ID là bắt buộc',
    'string.pattern.base': 'Warehouse ID phải là số nguyên dương'
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
  warehouseId: numericStringSchema.optional(),
  importer: Joi.string().optional(),
  sortBy: createSortBySchema(allowedImportFabricSortFields),
  order: sortOrderSchema,
  importDateFrom: dateFromSchema,
  importDateTo: dateToSchema
});

export const importFabricIdSchema = Joi.object({
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
      'any.required': 'ID phiếu nhập là bắt buộc',
      'string.pattern.base': 'ID phiếu nhập phải là số nguyên dương'
    })
});