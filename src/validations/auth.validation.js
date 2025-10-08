import Joi from 'joi';

// Schema validation cho register
export const registerSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(50)
    .required()
    .messages({
      'string.alphanum': 'Username chỉ được chứa chữ cái và số',
      'string.min': 'Username phải có ít nhất 3 ký tự',
      'string.max': 'Username không được vượt quá 50 ký tự',
      'any.required': 'Username là bắt buộc'
    }),
    
  password: Joi.string()
    .min(6)
    .max(255)
    .required()
    .messages({
      'string.min': 'Password phải có ít nhất 6 ký tự',
      'string.max': 'Password không được vượt quá 255 ký tự',
      'any.required': 'Password là bắt buộc'
    }),
    
  email: Joi.string()
    .email()
    .max(100)
    .required()
    .messages({
      'string.email': 'Email không hợp lệ',
      'string.max': 'Email không được vượt quá 100 ký tự',
      'any.required': 'Email là bắt buộc'
    }),
    
  phone: Joi.string()
    .pattern(/^[0-9+\-\s()]+$/)
    .min(10)
    .max(15)
    .required()
    .messages({
      'string.pattern.base': 'Số điện thoại không hợp lệ',
      'string.min': 'Số điện thoại phải có ít nhất 10 ký tự',
      'string.max': 'Số điện thoại không được vượt quá 15 ký tự',
      'any.required': 'Số điện thoại là bắt buộc'
    }),
    
  fullname: Joi.string()
    .max(100)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Họ tên không được vượt quá 100 ký tự'
    }),
    
  gender: Joi.string()
    .valid('MALE', 'FEMALE', 'OTHER')
    .optional()
    .allow(null)
    .messages({
      'any.only': 'Giới tính phải là MALE, FEMALE hoặc OTHER'
    }),
    
  address: Joi.string()
    .max(255)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Địa chỉ không được vượt quá 255 ký tự'
    }),
    
  dob: Joi.date()
    .max('now')
    .optional()
    .allow(null)
    .messages({
      'date.max': 'Ngày sinh không được lớn hơn ngày hiện tại'
    })
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
    
  password: Joi.string()
    .required()
    .messages({
      'string.empty': 'Password không được để trống',
      'any.required': 'Password là bắt buộc'
    })
});

// Schema validation cho change password
export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'any.required': 'Password hiện tại là bắt buộc'
    }),
    
  newPassword: Joi.string()
    .min(6)
    .max(255)
    .required()
    .messages({
      'string.min': 'Password mới phải có ít nhất 6 ký tự',
      'string.max': 'Password mới không được vượt quá 255 ký tự',
      'any.required': 'Password mới là bắt buộc'
    })
});

// Schema validation cho update profile (loại bỏ password field)
export const updateProfileSchema = Joi.object({
  fullname: Joi.string()
    .max(100)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Họ tên không được vượt quá 100 ký tự'
    }),
    
  gender: Joi.string()
    .valid('MALE', 'FEMALE', 'OTHER')
    .optional()
    .allow(null)
    .messages({
      'any.only': 'Giới tính phải là MALE, FEMALE hoặc OTHER'
    }),
    
  address: Joi.string()
    .max(255)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Địa chỉ không được vượt quá 255 ký tự'
    }),
    
  dob: Joi.date()
    .max('now')
    .optional()
    .allow(null)
    .messages({
      'date.max': 'Ngày sinh không được lớn hơn ngày hiện tại'
    }),
    
  phone: Joi.string()
    .pattern(/^[0-9+\-\s()]+$/)
    .min(10)
    .max(15)
    .optional()
    .messages({
      'string.pattern.base': 'Số điện thoại không hợp lệ',
      'string.min': 'Số điện thoại phải có ít nhất 10 ký tự',
      'string.max': 'Số điện thoại không được vượt quá 15 ký tự'
    }),

  avatar: Joi.string()
    .optional()
    .allow('')
    .allow(null)
});