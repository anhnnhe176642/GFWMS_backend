// Middleware validation sử dụng Joi
export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    let dataToValidate;
    
    // Xác định nguồn dữ liệu cần validate
    switch (source) {
      case 'body':
        dataToValidate = req.body;
        break;
      case 'params':
        dataToValidate = req.params;
        break;
      case 'query':
        dataToValidate = req.query;
        break;
      case 'headers':
        dataToValidate = req.headers;
        break;
      default:
        dataToValidate = req.body;
    }

    // Thực hiện validation
    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false, // Hiển thị tất cả lỗi validation
      allowUnknown: true, // Cho phép các field không được định nghĩa trong schema
      stripUnknown: true // Loại bỏ các field không được định nghĩa
    });

    if (error) {
      // Xử lý lỗi validation
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        message: 'Dữ liệu không hợp lệ',
        errors: errorDetails
      });
    }

    // Cập nhật request với dữ liệu đã được validate và làm sạch
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
          value: value,
          writable: true,
          enumerable: true,
          configurable: true
        });
        break;
      case 'headers':
        req.headers = value;
        break;
    }

    next();
  };
};

// Middleware validation cho multiple sources
export const validateMultiple = (validations) => {
  return (req, res, next) => {
    const errors = [];

    // Validate từng source
    for (const { schema, source } of validations) {
      let dataToValidate;
      
      switch (source) {
        case 'body':
          dataToValidate = req.body;
          break;
        case 'params':
          dataToValidate = req.params;
          break;
        case 'query':
          dataToValidate = req.query;
          break;
        case 'headers':
          dataToValidate = req.headers;
          break;
        default:
          dataToValidate = req.body;
      }

      const { error, value } = schema.validate(dataToValidate, {
        abortEarly: false,
        allowUnknown: true,
        stripUnknown: true
      });

      if (error) {
        const errorDetails = error.details.map(detail => ({
          field: `${source}.${detail.path.join('.')}`,
          message: detail.message
        }));
        errors.push(...errorDetails);
      } else {
        // Cập nhật dữ liệu đã validate
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
              value: value,
              writable: true,
              enumerable: true,
              configurable: true
            });
            break;
          case 'headers':
            req.headers = value;
            break;
        }
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