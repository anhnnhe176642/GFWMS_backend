

import Joi from 'joi';
import {
  phoneSchema,
  querySchema,
  sortOrderSchema,
  dateFromSchema,
  dateToSchema,
  createMultiValueFilterSchema,
  createSortBySchema
} from './common.validation.js'; 

const positiveIntegerSchema = Joi.number().integer().positive().required().messages({
  'number.base': 'Phải là số',
  'number.positive': 'Phải lớn hơn 0',
  'number.integer': 'Phải là số nguyên dương',
  'any.required': 'Trường này là bắt buộc'
});


const orderStatusSchema = Joi.string()
  .valid('PENDING', 'PROCESSING', 'DELIVERED', 'CANCELED', 'FAILED')
  .messages({
    'any.only': 'Status phải là: PENDING, PROCESSING, DELIVERED, CANCELED, FAILED'
  });

const paymentTypeSchema = Joi.string()
  .valid('CASH', 'CREDIT')
  .messages({
    'any.only': 'Payment type phải là: CASH hoặc CREDIT'
  });

export const orderItemSchema = Joi.object({
  fabricId: positiveIntegerSchema,
  quantity: positiveIntegerSchema,
  saleUnit: Joi.string()
    .valid('ROLL', 'METER')
    .required()
    .messages({
      'any.only': 'Đơn vị bán phải là ROLL hoặc METER',
      'any.required': 'Đơn vị bán là bắt buộc'
    })
});

//CREATE ORDER (ONLINE - Customer)
export const createOrderSchema = Joi.object({
  storeId: positiveIntegerSchema,
  orderItems: Joi.array()
    .items(orderItemSchema)
    .min(1)
    .required()
    .messages({
      'array.base': 'Danh sách sản phẩm phải là mảng',
      'array.min': 'Đơn hàng phải có ít nhất 1 sản phẩm',
      'any.required': 'Danh sách sản phẩm là bắt buộc'
    }),
  
  paymentType: Joi.string()
    .valid('CASH', 'CREDIT')
    .default('CASH')
    .messages({
      'any.only': 'Phương thức thanh toán chỉ được là CASH hoặc CREDIT'
    }),
  
  notes: Joi.string()
    .max(500)
    .trim()
    .allow('', null)
    .messages({
      'string.max': 'Ghi chú không được vượt quá 500 ký tự'
    })
});

//CREATE ORDER OFFLINE (Staff)
export const createOfflineOrderSchema = Joi.object({
  customerPhone: phoneSchema,
  
  orderItems: Joi.array()
    .items(orderItemSchema)
    .min(1)
    .required()
    .messages({
      'array.min': 'Đơn hàng phải có ít nhất 1 sản phẩm',
      'any.required': 'Danh sách sản phẩm là bắt buộc'
    }),
  
  paymentType: Joi.string()
    .valid('CASH', 'CREDIT')
    .required()
    .messages({
      'any.only': 'Phương thức thanh toán chỉ được là CASH hoặc CREDIT',
      'any.required': 'Phương thức thanh toán là bắt buộc'
    }),
  
  payExcessAmount: Joi.boolean().optional(),
  
  notes: Joi.string()
    .max(500)
    .trim()
    .allow('', null)
    .messages({
      'string.max': 'Ghi chú không được vượt quá 500 ký tự'
    })
});



//order id
export const orderIdParamSchema = Joi.object({
  orderId: positiveIntegerSchema
});

const allowedOrderSortFields = ['id', 'orderDate', 'totalAmount', 'status', 'createdAt', 'updatedAt'];

//getall 
export const getAllOrdersQuerySchema = querySchema.keys({
  status: createMultiValueFilterSchema(
    orderStatusSchema,
    'Trạng thái'
  ),
  paymentType: createMultiValueFilterSchema(
    paymentTypeSchema,
    'Phương thức thanh toán'
  ),
  isOffline: Joi.string()
    .valid('true', 'false')
    .optional()
    .messages({
      'any.only': 'isOffline phải là: true hoặc false'
    }),
  sortBy: createSortBySchema(allowedOrderSortFields),
  order: sortOrderSchema,
  createdFrom: dateFromSchema,
  createdTo: dateToSchema
});

// get all cho customer
export const getMyOrdersQuerySchema = querySchema.keys({
  status: createMultiValueFilterSchema(
    orderStatusSchema,
    'Trạng thái'
  ),
  paymentType: createMultiValueFilterSchema(
    paymentTypeSchema,
    'Phương thức thanh toán'
  ),
  sortBy: createSortBySchema(allowedOrderSortFields),
  order: sortOrderSchema,
  createdFrom: dateFromSchema,
  createdTo: dateToSchema
});

