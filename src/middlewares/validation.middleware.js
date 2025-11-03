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
    headers: req.headers
  };
  return sourceMap[source] || req.body;
};

/**
 * Cập nhật dữ liệu đã validate vào request
 */
const setDataToRequest = (req, source, value) => {
  switch (source) {
    case 'body':
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
 */
export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const dataToValidate = getDataFromRequest(req, source);

    // Thực hiện validation
    const { error, value } = schema.validate(dataToValidate, VALIDATION_OPTIONS);

    if (error) {
      const errorDetails = formatValidationErrors(error);
      return res.status(400).json({
        message: 'Dữ liệu không hợp lệ',
        errors: errorDetails
      });
    }

    // Cập nhật request với dữ liệu đã được validate và làm sạch
    setDataToRequest(req, source, value);
    next();
  };
};

/**
 * Middleware validation cho multiple sources
 */
export const validateMultiple = (validations) => {
  return (req, res, next) => {
    const errors = [];

    // Validate từng source
    for (const { schema, source } of validations) {
      const dataToValidate = getDataFromRequest(req, source);
      const { error, value } = schema.validate(dataToValidate, VALIDATION_OPTIONS);

      if (error) {
        const errorDetails = formatValidationErrors(error, source);
        errors.push(...errorDetails);
      } else {
        // Cập nhật dữ liệu đã validate
        setDataToRequest(req, source, value);
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