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
const allowedShelfSortFields = ['id', 'code', 'currentQuantity', 'maxQuantity', 'warehouseId', 'createdAt', 'updatedAt'];

// Fabric filter schemas
export const fabricIdSchema = createMultiValueFilterSchema(
  Joi.number()
    .integer()
    .messages({
      'number.base': 'ID vải phải là số',
      'number.integer': 'ID vải phải là số nguyên'
    }),
  'ID vải'
);

export const fabricCategoryIdSchema = Joi.string()
  .optional()
  .messages({
    'string.base': 'ID danh mục vải phải là chuỗi'
  });

export const fabricColorIdSchema = Joi.string()
  .optional()
  .messages({
    'string.base': 'ID màu vải phải là chuỗi'
  });

export const fabricGlossIdSchema = Joi.number()
  .integer()
  .optional()
  .messages({
    'number.base': 'ID độ bóng phải là số',
    'number.integer': 'ID độ bóng phải là số nguyên'
  });

export const fabricSupplierId = Joi.number()
  .integer()
  .optional()
  .messages({
    'number.base': 'ID nhà cung cấp phải là số',
    'number.integer': 'ID nhà cung cấp phải là số nguyên'
  });

// Group by schema - hỗ trợ gom nhóm theo nhiều cột
const allowedGroupByFields = ['categoryId', 'colorId', 'glossId', 'supplierId'];
export const groupBySchema = Joi.string()
  .optional()
  .trim()
  .custom((value, helpers) => {
    if (!value) return value;
    
    const fields = value.split(',').map(f => f.trim()).filter(f => f);
    const invalidFields = fields.filter(f => !allowedGroupByFields.includes(f));
    
    if (invalidFields.length > 0) {
      return helpers.error('custom.invalid', { invalid: invalidFields.join(', ') });
    }
    
    return fields.join(',');
  })
  .messages({
    'string.base': 'GroupBy phải là chuỗi',
    'custom.invalid': 'Các trường group by không hợp lệ: {#invalid}. Cho phép: categoryId, colorId, glossId, supplierId'
  });

export const shelfQuerySchema = querySchema.keys({
  warehouseId: createMultiValueFilterSchema(warehouseIdSchemaForShelf, 'ID kho'),
  fabricId: fabricIdSchema,
  sortBy: createSortBySchema(allowedShelfSortFields),
  order: sortOrderSchema,
  createdFrom: dateFromSchema,
  createdTo: dateToSchema,
  groupBy: groupBySchema
});

// Schema cho lọc vải theo thuộc tính và gom nhóm
export const getShelfFabricGroupSchema = querySchema.keys({
  categoryId: fabricCategoryIdSchema,
  colorId: fabricColorIdSchema,
  glossId: fabricGlossIdSchema,
  supplierId: fabricSupplierId,
  groupBy: groupBySchema
});

export const shelfIdSchema = Joi.object({
  id: Joi.number()
    .integer()
    .required()
    .messages({
      'any.required': 'ID kệ là bắt buộc',
      'number.base': 'ID kệ phải là số',
      'number.integer': 'ID kệ phải là số nguyên'
    })
});
