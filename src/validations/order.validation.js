// ...existing code...
import Joi from 'joi';
import {
  querySchema,
  createSortBySchema,
  sortOrderSchema,
  dateFromSchema,
  dateToSchema,
  createMultiValueFilterSchema
} from './common.validation.js';

const allowedOrderSortFields = ['id', 'orderDate', 'status', 'totalAmount', 'createdAt', 'updatedAt'];

export const orderQuerySchema = querySchema.keys({
  sortBy: createSortBySchema(allowedOrderSortFields),
  order: sortOrderSchema.optional(),
  status: createMultiValueFilterSchema(Joi.string(), 'Order status').optional(),
  createdFrom: dateFromSchema,
  createdTo: dateToSchema.min(Joi.ref('createdFrom')).messages({
    'date.min': 'createdTo phải lớn hơn hoặc bằng createdFrom'
  })
});