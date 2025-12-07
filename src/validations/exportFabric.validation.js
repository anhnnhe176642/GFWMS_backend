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
  .valid('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED')
  .default('PENDING')
  .trim()
  .messages({
    'any.only': 'Chỉ được là PENDING, APPROVED hoặc REJECTED'
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
const allowedExportFabricSortFields = ['id', 'createdAt', 'updatedAt', 'status','warehouse.name', 'store.name'];

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
 * PREVIEW INVENTORY
 * ============================
 */
export const previewInventorySchema = Joi.object({
  fabricItems: Joi.array().items(exportFabricItemSchema).min(1).required().messages({
    'array.base': 'Danh sách vải (fabricItems) phải là mảng',
    'array.min': 'Phải có ít nhất 1 loại vải',
    'any.required': 'Danh sách vải (fabricItems) là bắt buộc'
  })
});

/**
 * ============================
 * CREATE BATCH EXPORT FABRIC
 * ============================
 */
const warehouseAllocationSchema = Joi.object({
  warehouseId: Joi.number().integer().positive().required().messages({
    'number.base': 'Mã kho phải là số',
    'number.integer': 'Mã kho phải là số nguyên',
    'number.positive': 'Mã kho phải lớn hơn 0',
    'any.required': 'Vui lòng chọn kho'
  }),
  items: Joi.array().items(exportFabricItemSchema).min(1).required().messages({
    'array.base': 'Danh sách vải (items) phải là mảng',
    'array.min': 'Mỗi phân bổ kho phải có ít nhất 1 loại vải',
    'any.required': 'Danh sách vải (items) là bắt buộc'
  })
});

export const createBatchExportFabricSchema = Joi.object({
  storeId: exportStoreIdSchema,
  note: Joi.string().max(255).allow(null, '').messages({
    'string.max': 'Ghi chú tối đa 255 ký tự'
  }),
  warehouseAllocations: Joi.array().items(warehouseAllocationSchema).min(1).required().messages({
    'array.base': 'Danh sách phân bổ kho (warehouseAllocations) phải là mảng',
    'array.min': 'Phải có ít nhất 1 phân bổ kho',
    'any.required': 'Danh sách phân bổ kho (warehouseAllocations) là bắt buộc'
  })
});

/**
 * ============================
 * APPROVE / REJECT EXPORT FABRIC
 * ============================
 */

// Chi tiết một batch cần lấy (chỉ essentials - system sẽ query mấy cái khác)
const batchPickupDetailSchema = Joi.object({
  importId: Joi.number().integer().positive().required().messages({
    'number.base': 'ID lô nhập (importId) phải là số',
    'any.required': 'Vui lòng chỉ định importId'
  }),
  shelfId: Joi.number().integer().positive().required().messages({
    'number.base': 'ID kệ (shelfId) phải là số',
    'any.required': 'Vui lòng chỉ định shelfId'
  }),
  pickQuantity: Joi.number().integer().positive().required().messages({
    'number.base': 'Số lượng (pickQuantity) phải là số',
    'number.integer': 'Số lượng phải là số nguyên',
    'number.positive': 'Số lượng phải lớn hơn 0',
    'any.required': 'Vui lòng nhập số lượng cần lấy'
  })
});

// Chi tiết batch cho một loại vải
const fabricBatchPickupSchema = Joi.object({
  fabricId: Joi.number().integer().positive().required().messages({
    'number.base': 'ID vải (fabricId) phải là số',
    'number.positive': 'ID vải phải lớn hơn 0',
    'any.required': 'Vui lòng chỉ định fabricId'
  }),
  batches: Joi.array().items(batchPickupDetailSchema).min(1).required().messages({
    'array.base': 'Danh sách batch phải là mảng',
    'array.min': 'Phải có ít nhất 1 batch',
    'any.required': 'Danh sách batch là bắt buộc'
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
  batchPickupDetails: Joi.array()
    .items(fabricBatchPickupSchema)
    .when('status', {
      is: 'APPROVED',
      then: Joi.required().messages({
        'any.required': 'Chi tiết batch (importId, shelfId, pickQuantity) là bắt buộc khi duyệt'
      }),
      otherwise: Joi.forbidden()
    }),
  note: Joi.string()
    .max(500)
    .when('status', {
      is: 'REJECTED',
      then: Joi.required().messages({
        'any.required': 'Lý do từ chối là bắt buộc'
      }),
      otherwise: Joi.optional()
    })
});

