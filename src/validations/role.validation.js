import Joi from 'joi';

// Schema validation cho tạo role
export const createRoleSchema = Joi.object({
  name: Joi.string()
    .max(50)
    .required()
    .messages({
      'string.max': 'Tên role không được vượt quá 50 ký tự',
      'any.required': 'Tên role là bắt buộc'
    })
});

// Schema validation cho cập nhật role
export const updateRoleSchema = Joi.object({
  name: Joi.string()
    .max(50)
    .required()
    .messages({
      'string.max': 'Tên role không được vượt quá 50 ký tự',
      'any.required': 'Tên role là bắt buộc'
    })
});

// Schema validation cho role name parameter
export const roleNameParamSchema = Joi.object({
  name: Joi.string()
    .max(50)
    .required()
    .messages({
      'string.max': 'Tên role không được vượt quá 50 ký tự',
      'any.required': 'Tên role là bắt buộc'
    })
});