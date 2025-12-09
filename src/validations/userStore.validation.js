import Joi from 'joi';

export const assignStoreSchema = Joi.object({
  userId: Joi.string().uuid().required().messages({
    'string.empty': 'User ID không được trống',
    'string.guid': 'User ID không hợp lệ'
  }),
  storeId: Joi.number().integer().positive().required().messages({
    'number.base': 'Store ID phải là số',
    'number.positive': 'Store ID phải lớn hơn 0'
  })
});

export const assignMultipleStoresSchema = Joi.object({
  userId: Joi.string().uuid().required().messages({
    'string.empty': 'User ID không được trống',
    'string.guid': 'User ID không hợp lệ'
  }),
  storeIds: Joi.array()
    .items(Joi.number().integer().positive())
    .min(1)
    .required()
    .messages({
      'array.min': 'Danh sách cửa hàng phải có ít nhất 1 phần tử',
      'array.empty': 'Danh sách cửa hàng không được trống'
    })
});

export const removeStoreSchema = Joi.object({
  userId: Joi.string().uuid().required().messages({
    'string.empty': 'User ID không được trống',
    'string.guid': 'User ID không hợp lệ'
  }),
  storeId: Joi.number().integer().positive().required().messages({
    'number.base': 'Store ID phải là số',
    'number.positive': 'Store ID phải lớn hơn 0'
  })
});

export const userIdParamSchema = Joi.object({
  userId: Joi.string().uuid().required().messages({
    'string.empty': 'User ID không được trống',
    'string.guid': 'User ID không hợp lệ'
  })
});

export const storeIdParamSchema = Joi.object({
  storeId: Joi.number().integer().positive().required().messages({
    'number.base': 'Store ID phải là số',
    'number.positive': 'Store ID phải lớn hơn 0'
  })
});
