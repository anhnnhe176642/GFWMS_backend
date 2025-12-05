import Joi from 'joi';
import { querySchema } from './common.validation.js';

export const addToWishlistSchema = Joi.object({
  fabricId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'ID sản phẩm phải là số',
      'number.integer': 'ID sản phẩm phải là số nguyên',
      'any.required': 'ID sản phẩm là bắt buộc'
    })
});

export const wishlistQuerySchema = querySchema.keys({
  sortBy: Joi.string()
    .valid('createdAt', 'updatedAt')
    .default('createdAt'),
  order: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
});