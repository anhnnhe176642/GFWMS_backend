import Joi from 'joi';
import {
  pageSchema,
  limitSchema,
  querySchema,
  createSortBySchema,
  sortOrderSchema,
  dateFromSchema,
  dateToSchema,
  createMultiValueFilterSchema
} from './common.validation.js';

/**
 * ============================
 * FIELD VALIDATIONS
 * ============================
 */

// Warehouse ID
const exportWarehouseIdSchema = Joi.number()
  .integer()
  .positive()
  .required()
  .messages({
    'number.base': 'Mã kho phải là số',
    'number.integer': 'Mã kho phải là số nguyên',
    'number.positive': 'Mã kho phải lớn hơn 0',
    'any.required': 'Vui lòng chọn kho xuất hàng'
  });

// Store ID
const exportStoreIdSchema = Joi.number()
  .integer()
  .positive()
  .required()
  .messages({
    'number.base': 'Mã cửa hàng phải là số',
    'number.integer': 'Mã cửa hàng phải là số nguyên',
    'number.positive': 'Mã cửa hàng phải lớn hơn 0',
    'any.required': 'Vui lòng chọn cửa hàng nhận hàng'
  });

// Status
const exportStatusSchema = Joi.string()
  .uppercase()
  .valid('PENDING', 'APPROVED', 'REJECTED')
  .default('PENDING')
  .trim()
  .messages({
    'any.only': 'Trạng thái chỉ được là: PENDING, APPROVED hoặc REJECTED'
  });

/**
 * ============================
 * PARAM + PAGINATION
 * ============================
 */
export const exportFabricIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    'number.base': 'ID phải là số',
    'number.positive': 'ID phải lớn hơn 0',
    'number.integer': 'ID phải là số nguyên dương',
    'any.required': 'ID là bắt buộc'
  })
});

export const paginationQuerySchema = Joi.object({
  page: pageSchema,
  limit: limitSchema
});

/**
 * ============================
 * QUERY (FILTER + SORT)
 * ============================
 */
const allowedExportFabricSortFields = ['id', 'createdAt', 'updatedAt', 'status'];

export const exportFabricQuerySchema = querySchema.keys({
  sortBy: createSortBySchema(allowedExportFabricSortFields),
  order: sortOrderSchema.optional(),

  warehouseId: createMultiValueFilterSchema(exportWarehouseIdSchema, 'Mã kho'),
  storeId: createMultiValueFilterSchema(exportStoreIdSchema, 'Mã cửa hàng'),
  status: createMultiValueFilterSchema(exportStatusSchema, 'Trạng thái phiếu'),

  createdFrom: dateFromSchema,
  createdTo: dateToSchema.min(Joi.ref('createdFrom')).messages({
    'date.min': 'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu'
  })
});

/**
 * ============================
 * CREATE EXPORT FABRIC BODY
 * ============================
 */
const exportFabricItemSchema = Joi.object({
  fabricId: Joi.number().integer().positive().required().messages({
    'number.base': 'Mã vải phải là số',
    'number.integer': 'Mã vải phải là số nguyên',
    'number.positive': 'Mã vải phải lớn hơn 0',
    'any.required': 'Vui lòng chọn loại vải'
  }),
  quantity: Joi.number().integer().positive().required().messages({
    'number.base': 'Số lượng phải là số',
    'number.integer': 'Số lượng phải là số nguyên',
    'number.positive': 'Số lượng phải lớn hơn 0',
    'any.required': 'Vui lòng nhập số lượng vải cần xuất'
  })
});

export const createExportFabricSchema = Joi.object({
  warehouseId: exportWarehouseIdSchema,
  storeId: exportStoreIdSchema,
  note: Joi.string().max(255).allow(null, '').messages({
    'string.max': 'Ghi chú tối đa 255 ký tự'
  }),
  exportItems: Joi.array().items(exportFabricItemSchema).min(1).required().messages({
    'array.base': 'Danh sách vải (exportItems) phải là mảng',
    'array.min': 'Phiếu xuất phải có ít nhất 1 loại vải',
    'any.required': 'Danh sách vải (exportItems) là bắt buộc'
  })
});

/**
 * ============================
 * APPROVE / REJECT EXPORT FABRIC
 * ============================
 */

// Chọn kệ cho từng exportItem
const exportItemShelfSelectionSchema = Joi.object({
  fabricId: Joi.number().integer().positive().required().messages({
    'number.base': 'Mã vải phải là số',
    'number.integer': 'Mã vải phải là số nguyên',
    'number.positive': 'Mã vải phải lớn hơn 0',
    'any.required': 'Vui lòng chọn vải'
  }),
  shelfId: Joi.number().integer().positive().required().messages({
    'number.base': 'Mã kệ phải là số',
    'number.integer': 'Mã kệ phải là số nguyên',
    'number.positive': 'Mã kệ phải lớn hơn 0',
    'any.required': 'Vui lòng chọn kệ'
  }),
  quantityToTake: Joi.number().integer().positive().required().messages({
    'number.base': 'Số lượng lấy phải là số',
    'number.integer': 'Số lượng lấy phải là số nguyên',
    'number.positive': 'Số lượng lấy phải lớn hơn 0',
    'any.required': 'Vui lòng nhập số lượng lấy từ kệ'
  })
});

// Body approve/reject
export const approveExportFabricSchema = Joi.object({
  status: Joi.string()
    .uppercase()
    .valid('APPROVED', 'REJECTED')
    .required()
    .messages({
      'any.only': 'Trạng thái chỉ được là: APPROVED hoặc REJECTED',
      'any.required': 'Trạng thái là bắt buộc'
    }),
  itemShelfSelections: Joi.array()
    .items(exportItemShelfSelectionSchema)
    .when('status', {
      is: 'APPROVED',
      then: Joi.required().messages({
        'any.required': 'Danh sách chọn kệ là bắt buộc khi duyệt phiếu APPROVED'
      }),
      otherwise: Joi.forbidden()
    })
});

