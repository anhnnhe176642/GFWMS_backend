import Joi from 'joi';
import {
  usernameSchema,
  passwordSchema,
  emailSchema,
  phoneSchema,
  fullnameSchema,
  genderSchema,
  addressSchema,
  dobSchema,
  avatarSchema
} from './common.validation.js';

// Schema validation cho register
export const registerSchema = Joi.object({
  username: usernameSchema.required(),
  password: passwordSchema.required(),
  email: emailSchema.required(),
  phone: phoneSchema.required(),
  fullname: fullnameSchema.optional(),
  gender: genderSchema.optional(),
  address: addressSchema.optional(),
  dob: dobSchema.optional()
});

// Schema validation cho login
export const loginSchema = Joi.object({
  usernameOrEmail: Joi.string()
    .trim()
    .required()
    .messages({
      'string.empty': 'Username hoặc email không được để trống',
      'any.required': 'Username hoặc email là bắt buộc'
    }),
  password: passwordSchema.required()
});

// Schema validation cho change password
export const changePasswordSchema = Joi.object({
  currentPassword: passwordSchema.required().messages({
    'any.required': 'Password hiện tại là bắt buộc'
  }),
  newPassword: passwordSchema.required().messages({
    'any.required': 'Password mới là bắt buộc'
  })
});

// Schema validation cho update profile (loại bỏ password field)
export const updateProfileSchema = Joi.object({
  fullname: fullnameSchema.optional(),
  gender: genderSchema.optional(),
  address: addressSchema.optional(),
  dob: dobSchema.optional(),
  phone: phoneSchema.optional(),
  avatar: avatarSchema.optional()
});