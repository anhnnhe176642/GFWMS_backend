import Joi from 'joi';

/**
 * Common validation schemas để tái sử dụng
 */

/**
 * Helper function để tạo multi-value filter schema
 * Validate format comma-separated và từng giá trị individual
 * @param {Object} singleValueSchema - Schema validation cho single value
 * @param {string} fieldName - Tên field để hiển thị trong error message
 * @returns {Object} Joi schema cho multi-value filter
 */
export const createMultiValueFilterSchema = (singleValueSchema, fieldName) => {
  return Joi.string()
    .pattern(/^[^,]+(,\s*[^,]+)*$/) // Check format: không rỗng và có dấu phẩy hợp lệ
    .optional()
    .custom((value, helpers) => {
      // Validate từng giá trị bằng schema gốc
      const values = value.split(',').map(v => v.trim());
      for (const val of values) {
        const { error } = singleValueSchema.validate(val);
        if (error) {
          return helpers.error('any.invalid', { message: error.details[0].message });
        }
      }
      return value;
    })
    .messages({
      'string.pattern.base': `${fieldName} phải là giá trị hợp lệ hoặc nhiều giá trị cách nhau bởi dấu phẩy`,
      'any.invalid': `${fieldName} không hợp lệ: {{#message}}`
    });
};

// Username validation
export const usernameSchema = Joi.string()
  .alphanum()
  .min(3)
  .max(50)
  .messages({
    'string.alphanum': 'Username chỉ được chứa chữ cái và số',
    'string.min': 'Username phải có ít nhất 3 ký tự',
    'string.max': 'Username không được vượt quá 50 ký tự',
    'any.required': 'Username là bắt buộc'
  });

// Email validation
export const emailSchema = Joi.string()
  .email()
  .lowercase()
  .max(100)
  .messages({
    'string.email': 'Email không hợp lệ',
    'string.max': 'Email không được vượt quá 100 ký tự',
    'any.required': 'Email là bắt buộc'
  });

// Password validation
export const passwordSchema = Joi.string()
  .min(6)
  .max(255)
  .messages({
    'string.min': 'Password phải có ít nhất 6 ký tự',
    'string.max': 'Password không được vượt quá 255 ký tự',
    'any.required': 'Password là bắt buộc'
  });

// Phone validation
export const phoneSchema = Joi.string()
  .pattern(/^[0-9+\-\s()]+$/)
  .min(10)
  .max(15)
  .messages({
    'string.pattern.base': 'Số điện thoại không hợp lệ',
    'string.min': 'Số điện thoại phải có ít nhất 10 ký tự',
    'string.max': 'Số điện thoại không được vượt quá 15 ký tự',
    'any.required': 'Số điện thoại là bắt buộc'
  });

// Fullname validation
export const fullnameSchema = Joi.string()
  .max(100)
  .allow('')
  .messages({
    'string.max': 'Họ tên không được vượt quá 100 ký tự'
  });

// Gender validation
export const genderSchema = Joi.string()
  .valid('MALE', 'FEMALE', 'OTHER')
  .allow(null)
  .messages({
    'any.only': 'Giới tính phải là MALE, FEMALE hoặc OTHER'
  });

// Address validation
export const addressSchema = Joi.string()
  .max(255)
  .allow('')
  .messages({
    'string.max': 'Địa chỉ không được vượt quá 255 ký tự'
  });

// Date of birth validation
export const dobSchema = Joi.date()
  .max('now')
  .allow(null)
  .messages({
    'date.max': 'Ngày sinh không được lớn hơn ngày hiện tại'
  });

// Role validation
export const roleSchema = Joi.string()
  .max(50)
  .messages({
    'string.max': 'Role name không được vượt quá 50 ký tự',
    'any.required': 'Role là bắt buộc'
  });

// Avatar validation
export const avatarSchema = Joi.string()
  .allow('')
  .allow(null);

// User status validation
export const userStatusSchema = Joi.string()
  .valid('ACTIVE', 'INACTIVE', 'SUSPENDED')
  .messages({
    'any.only': 'Trạng thái phải là ACTIVE, INACTIVE hoặc SUSPENDED',
    'any.required': 'Status là bắt buộc'
  });

// UUID validation
export const uuidSchema = Joi.string()
  .uuid()
  .messages({
    'string.uuid': 'ID phải là UUID hợp lệ',
    'any.required': 'ID là bắt buộc'
  });

// Pagination validation
export const pageSchema = Joi.number()
  .integer()
  .min(1)
  .default(1)
  .messages({
    'number.integer': 'Page phải là số nguyên',
    'number.min': 'Page phải lớn hơn 0'
  });

export const limitSchema = Joi.number()
  .integer()
  .min(1)
  .max(100)
  .default(10)
  .messages({
    'number.integer': 'Limit phải là số nguyên',
    'number.min': 'Limit phải lớn hơn 0',
    'number.max': 'Limit không được vượt quá 100'
  });

// Search validation
export const searchSchema = Joi.string()
  .allow('')
  .max(100)
  .messages({
    'string.max': 'Từ khóa tìm kiếm không được vượt quá 100 ký tự'
  });

// Sort validation - support multiple fields (comma-separated)
export const sortBySchema = Joi.string()
  .pattern(/^[a-zA-Z_]+(,[a-zA-Z_]+)*$/)
  .messages({
    'string.base': 'Sort by phải là string',
    'string.pattern.base': 'Sort by phải là tên field hợp lệ hoặc các field cách nhau bởi dấu phẩy (vd: field1,field2)'
  });

export const sortOrderSchema = Joi.string()
  .pattern(/^(asc|desc|ASC|DESC)(,(asc|desc|ASC|DESC))*$/)
  .lowercase()
  .default('desc')
  .messages({
    'any.only': 'Sort order phải là asc hoặc desc, hoặc nhiều giá trị cách nhau bởi dấu phẩy (vd: asc,desc)',
    'string.pattern.base': 'Sort order phải là asc hoặc desc, hoặc nhiều giá trị cách nhau bởi dấu phẩy (vd: asc,desc)'
  });

// Date filter validation
export const dateFromSchema = Joi.date().iso().optional().messages({
  'date.base': 'Ngày bắt đầu phải là ngày hợp lệ',
  'date.format': 'Ngày bắt đầu phải theo định dạng ISO 8601'
});

export const dateToSchema = Joi.date().iso().optional().messages({
  'date.base': 'Ngày kết thúc phải là ngày hợp lệ',
  'date.format': 'Ngày kết thúc phải theo định dạng ISO 8601'
});

// Generic query schema cho phân trang, tìm kiếm, sắp xếp
export const querySchema = Joi.object({
  page: pageSchema,
  limit: limitSchema,
  search: searchSchema.optional(),
  sortBy: sortBySchema.optional(),
  order: sortOrderSchema.optional()
});
