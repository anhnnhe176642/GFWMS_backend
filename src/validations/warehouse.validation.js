import Joi from 'joi';
import { querySchema, createMultiValueFilterSchema, addressSchema,
  dateFromSchema,         
  dateToSchema,
  createSortBySchema,
  sortOrderSchema
} from './common.validation.js';

export const warehouseNameSchema = Joi.string()
  .min(2)
  .max(100)
  .required()
  .empty('')
  .messages({
    'string.min': 'Tên kho phải có ít nhất 2 ký tự',
    'string.max': 'Tên kho không được vượt quá 100 ký tự',
    'any.required': 'Tên kho là bắt buộc',
    'string.empty': 'Tên kho là bắt buộc'
  });

export const warehouseAddressSchema = addressSchema  
  .min(5)
  .required()
  .empty('')
  .messages({
    'string.min': 'Địa chỉ kho phải có ít nhất 5 ký tự',
    'any.required': 'Địa chỉ kho là bắt buộc',
    'string.empty': 'Địa chỉ kho là bắt buộc'
  });

/**
 *  Warehouse Latitude Schema
 */
export const warehouseLatitudeSchema = Joi.number()
  .min(-90)
  .max(90)
  .allow(null)
  .messages({
    'number.base': 'Vĩ độ (latitude) phải là số',
    'number.min': 'Vĩ độ (latitude) phải lớn hơn hoặc bằng -90',
    'number.max': 'Vĩ độ (latitude) phải nhỏ hơn hoặc bằng 90'
  });

/**
 *  Warehouse Longitude Schema
 */
export const warehouseLongitudeSchema = Joi.number()
  .min(-180)
  .max(180)
  .allow(null)
  .messages({
    'number.base': 'Kinh độ (longitude) phải là số',
    'number.min': 'Kinh độ (longitude) phải lớn hơn hoặc bằng -180',
    'number.max': 'Kinh độ (longitude) phải nhỏ hơn hoặc bằng 180'
  });

export const createWarehouseSchema = Joi.object({
  name: warehouseNameSchema,
  address: warehouseAddressSchema,
  latitude: warehouseLatitudeSchema,
  longitude: warehouseLongitudeSchema
});

export const warehouseStatusSchema = Joi.string()
  .valid('ACTIVE', 'INACTIVE')
  .messages({
    'any.only': 'Trạng thái phải là ACTIVE hoặc INACTIVE',
    'string.empty': 'Trạng thái không được để trống',
  });

export const updateWarehouseSchema = Joi.object({
  name: warehouseNameSchema
    .trim()                    
    .disallow(null)          
    .required(),
  address: warehouseAddressSchema
    .trim()                    
    .disallow(null)          
    .required(),
  latitude: warehouseLatitudeSchema,
  longitude: warehouseLongitudeSchema,
  status: warehouseStatusSchema
    .disallow(null)
    .required()
}).messages({
  'any.required': 'Status là bắt buộc',
});

const allowedWarehouseSortFields = ['id', 'name', 'address', 'status', 'createdAt', 'updatedAt'];

export const warehouseQuerySchema = querySchema.keys({
  status: createMultiValueFilterSchema(
    warehouseStatusSchema, 
    'Trạng thái'
  ),
  sortBy: createSortBySchema(allowedWarehouseSortFields),
  order: sortOrderSchema,
  createdFrom: dateFromSchema,
  createdTo: dateToSchema
});

export const warehouseIdSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    'number.base': 'ID kho phải là một số',
    'number.integer': 'ID kho phải là một số nguyên',
    'number.positive': 'ID kho phải là một số dương',
    'any.required': 'ID kho là bắt buộc'
  })
});

export const warehouseIdWithFabricIdSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    'number.base': 'ID kho phải là một số',
    'number.integer': 'ID kho phải là một số nguyên',
    'number.positive': 'ID kho phải là một số dương',
    'any.required': 'ID kho là bắt buộc'
  }),
  fabricId: Joi.number().integer().positive().required().messages({
    'number.base': 'ID vải phải là một số',
    'number.integer': 'ID vải phải là một số nguyên',
    'number.positive': 'ID vải phải là một số dương',
    'any.required': 'ID vải là bắt buộc'
  })
});

// Schema cho query params của API tính toán lấy hàng tối ưu
export const fabricPickupQuerySchema = Joi.object({
  quantity: Joi.number().integer().positive().required().messages({
    'number.base': 'Số lượng cần lấy phải là một số',
    'number.integer': 'Số lượng cần lấy phải là một số nguyên',
    'number.positive': 'Số lượng cần lấy phải là một số dương',
    'any.required': 'Số lượng cần lấy là bắt buộc'
  }),
  priority: Joi.string()
    .valid('NEWEST_FIRST', 'OLDEST_FIRST', 'LOWEST_PRICE', 'HIGHEST_PRICE', 'FEWEST_SHELVES')
    .default('NEWEST_FIRST')
    .messages({
      'any.only': 'Ưu tiên phải là: NEWEST_FIRST, OLDEST_FIRST, LOWEST_PRICE, HIGHEST_PRICE hoặc FEWEST_SHELVES'
    })
});

// Schema cho điều chỉnh số lượng vải trên kệ
export const adjustFabricSchema = Joi.object({
  fabricId: Joi.number().integer().positive().required().messages({
    'number.base': 'ID vải phải là một số',
    'number.integer': 'ID vải phải là một số nguyên',
    'number.positive': 'ID vải phải là một số dương',
    'any.required': 'ID vải là bắt buộc'
  }),
  importId: Joi.number().integer().positive().required().messages({
    'number.base': 'ID lần nhập phải là một số',
    'number.integer': 'ID lần nhập phải là một số nguyên',
    'number.positive': 'ID lần nhập phải là một số dương',
    'any.required': 'ID lần nhập là bắt buộc'
  }),
  quantity: Joi.number().integer().positive().required().messages({
    'number.base': 'Số lượng phải là một số',
    'number.integer': 'Số lượng phải là một số nguyên',
    'number.positive': 'Số lượng phải là một số dương',
    'any.required': 'Số lượng là bắt buộc'
  }),
  type: Joi.string().valid('IMPORT', 'DESTROY').required().messages({
    'any.only': 'Loại điều chỉnh phải là IMPORT hoặc DESTROY',
    'string.empty': 'Loại điều chỉnh không được để trống',
    'any.required': 'Loại điều chỉnh là bắt buộc'
  }),
  reason: Joi.string().min(5).max(255).required().messages({
    'string.min': 'Lý do phải có ít nhất 5 ký tự',
    'string.max': 'Lý do không được vượt quá 255 ký tự',
    'string.empty': 'Lý do không được để trống',
    'any.required': 'Lý do là bắt buộc'
  })
});

export const adjustFabricParamSchema = Joi.object({
  shelfId: Joi.number().integer().positive().required().messages({
    'number.base': 'ID kệ phải là một số',
    'number.integer': 'ID kệ phải là một số nguyên',
    'number.positive': 'ID kệ phải là một số dương',
    'any.required': 'ID kệ là bắt buộc'
  })
});

// Schema cho xem lịch sử điều chỉnh vải
const allowedAdjustFabricSortFields = [
  'id',
  'fabricId',
  'shelfId',
  'quantity',
  'type',
  'price',
  'reason',
  'userId',
  'createdAt',
  'updatedAt',
  'shelf.code',
  'shelf.warehouse.name',
  'user.fullname',
  'fabric.category.name',
  'fabric.color.name',
  'fabric.supplier.name',
];

export const adjustFabricHistoryQuerySchema = querySchema.keys({
  search: Joi.string().max(255).optional().messages({
    'string.max': 'Tìm kiếm không được vượt quá 255 ký tự'
  }),
  warehouseId: createMultiValueFilterSchema(
    Joi.number().integer().positive(),
    'ID kho'
  ),
  fabricId: createMultiValueFilterSchema(
    Joi.number().integer().positive(),
    'ID vải'
  ),
  shelfId: createMultiValueFilterSchema(
    Joi.number().integer().positive(),
    'ID kệ'
  ),
  categoryId: createMultiValueFilterSchema(
    Joi.number().integer().positive(),
    'ID loại vải'
  ),
  colorId: createMultiValueFilterSchema(
    Joi.string().max(50),
    'ID màu vải'
  ),
  supplierId: createMultiValueFilterSchema(
    Joi.number().integer().positive(),
    'ID nhà cung cấp'
  ),
  type: createMultiValueFilterSchema(
    Joi.string().valid('IMPORT', 'DESTROY'),
    'Loại điều chỉnh'
  ),
  userId: createMultiValueFilterSchema(
    Joi.string().uuid(),
    'ID người dùng'
  ),
  sortBy: createSortBySchema(allowedAdjustFabricSortFields),
  order: sortOrderSchema,
  createdFrom: dateFromSchema,
  createdTo: dateToSchema
});