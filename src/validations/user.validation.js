import Joi from 'joi';

// Schema validation cho tạo user
export const createUserSchema = Joi.object({
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
    }),
    
  status: Joi.string()
    .valid('ACTIVE', 'INACTIVE')
    .optional()
    .messages({
      'any.only': 'Trạng thái phải là ACTIVE hoặc INACTIVE'
    }),
    
  role: Joi.string()
    .max(50)
    .required()
    .messages({
      'string.max': 'Role name không được vượt quá 50 ký tự',
      'any.required': 'Role là bắt buộc'
    }),

  avatar: Joi.string()
    .optional()
    .allow('')
    .allow(null)
});

// Schema validation cho update user status  
export const updateUserStatusSchema = Joi.object({
  status: Joi.string()
    .valid('ACTIVE', 'INACTIVE', 'SUSPENDED')
    .required()
    .messages({
      'any.only': 'Trạng thái phải là ACTIVE, INACTIVE hoặc SUSPENDED',
      'any.required': 'Status là bắt buộc'
    })
});

// Schema validation cho update user role
export const updateUserRoleSchema = Joi.object({
  role: Joi.string()
    .max(50)
    .required()
    .messages({
      'string.max': 'Role name không được vượt quá 50 ký tự',
      'any.required': 'Role là bắt buộc'
    })
});


// Schema validation cho UUID params
export const uuidParamSchema = Joi.object({
  id: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': 'ID phải là UUID hợp lệ',
      'any.required': 'ID là bắt buộc'
    })
});

// Schema validation cho pagination query
export const paginationQuerySchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.integer': 'Page phải là số nguyên',
      'number.min': 'Page phải lớn hơn 0'
    }),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .messages({
      'number.integer': 'Limit phải là số nguyên',
      'number.min': 'Limit phải lớn hơn 0',
      'number.max': 'Limit không được vượt quá 100'
    })
});