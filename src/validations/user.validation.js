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
  roleSchema,
  avatarSchema,
  userStatusSchema,
  uuidSchema,
  pageSchema,
  limitSchema,
  querySchema,
  dateFromSchema,
  dateToSchema
} from './common.validation.js';

// Schema validation cho tạo user
export const createUserSchema = Joi.object({
  username: usernameSchema.required(),
  password: passwordSchema.required(),
  email: emailSchema.required(),
  phone: phoneSchema.required(),
  fullname: fullnameSchema.optional(),
  gender: genderSchema.optional(),
  address: addressSchema.optional(),
  dob: dobSchema.optional(),
  status: userStatusSchema.optional(),
  role: roleSchema.required(),
  avatar: avatarSchema.optional()
});

// Schema validation cho update user status
export const updateUserStatusSchema = Joi.object({
  status: userStatusSchema.required()
});

// Schema validation cho update user role
export const updateUserRoleSchema = Joi.object({
  role: roleSchema.required()
});

// Schema validation cho UUID params
export const uuidParamSchema = Joi.object({
  id: uuidSchema.required()
});

// Schema validation cho pagination query
export const paginationQuerySchema = Joi.object({
  page: pageSchema,
  limit: limitSchema
});

// Advanced query schema cho user với search, filter, sort
export const userQuerySchema = querySchema.keys({
  // Filter fields
  status: userStatusSchema.optional(),
  role: roleSchema.optional(),
  gender: genderSchema.optional(),
  
  // Date range filter
  createdFrom: dateFromSchema,
  createdTo: dateToSchema.min(Joi.ref('createdFrom')).messages({
    'date.min': 'createdTo phải lớn hơn hoặc bằng createdFrom'
  })
});