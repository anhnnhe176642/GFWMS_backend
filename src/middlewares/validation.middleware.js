// Validation options
const VALIDATION_OPTIONS = {
  abortEarly: false, // Hiển thị tất cả lỗi validation
  allowUnknown: true, // Cho phép các field không được định nghĩa trong schema
  stripUnknown: true // Loại bỏ các field không được định nghĩa
};

/**
 * Lấy dữ liệu từ request theo source
 */
const getDataFromRequest = (req, source) => {
  const sourceMap = {
    body: req.body,
    params: req.params,
    query: req.query,
    headers: req.headers,
    fields: req.body // multipart/form-data fields
  };
  return sourceMap[source] || req.body;
};

/**
 * Cập nhật dữ liệu đã validate vào request
 */
const setDataToRequest = (req, source, value) => {
  switch (source) {
    case 'body':
    case 'fields':
      req.body = value;
      break;
    case 'params':
      req.params = value;
      break;
    case 'query':
      // Force overwrite read-only query property
      Object.defineProperty(req, 'query', {
        value,
        writable: true,
        enumerable: true,
        configurable: true
      });
      break;
    case 'headers':
      req.headers = value;
      break;
  }
};

/**
 * Format lỗi validation thành response
 */
const formatValidationErrors = (error, sourcePrefix = '') => {
  return error.details.map(detail => ({
    field: sourcePrefix ? `${sourcePrefix}.${detail.path.join('.')}` : detail.path.join('.'),
    message: detail.message
  }));
};

/**
 * Middleware validation sử dụng Joi
 * Hỗ trợ validate multiple sources trong một lần gọi
 * 
 * @example
 * // Single source
 * validate(schema, 'body')
 * validate(schema, 'query')
 * validate(schema, 'params')
 * 
 * // Multiple sources
 * validate([
 *   { schema: bodySchema, source: 'body' },
 *   { schema: paramsSchema, source: 'params' }
 * ])
 */
export const validate = (schemaOrArray, source = 'body') => {
  return (req, res, next) => {
    const errors = [];
    
    // Kiểm tra nếu là array hay single schema
    const validations = Array.isArray(schemaOrArray)
      ? schemaOrArray
      : [{ schema: schemaOrArray, source }];

    // Validate từng source
    for (const { schema, source: currentSource } of validations) {
      const dataToValidate = getDataFromRequest(req, currentSource);
      const { error, value } = schema.validate(dataToValidate, VALIDATION_OPTIONS);

      if (error) {
        // Chỉ thêm source prefix khi validate multiple sources để phân biệt
        const sourcePrefix = validations.length > 1 ? currentSource : '';
        const errorDetails = formatValidationErrors(error, sourcePrefix);
        errors.push(...errorDetails);
      } else {
        // Cập nhật dữ liệu đã validate
        setDataToRequest(req, currentSource, value);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        message: 'Dữ liệu không hợp lệ',
        errors
      });
    }

    next();
  };
};