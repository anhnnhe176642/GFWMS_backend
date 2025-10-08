// Middleware xử lý lỗi toàn cục
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Lỗi có status code được set từ service layer (custom errors)
  if (err.status) {
    const response = { message: err.message };
    if (err.errors) {
      response.errors = err.errors;
    }
    
    return res.status(err.status).json(response);
  }

  // Lỗi JWT (vẫn cần xử lý ở middleware vì là system level)
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ 
      message: 'Token không hợp lệ' 
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ 
      message: 'Token đã hết hạn' 
    });
  }

  // Lỗi validation Joi (vẫn cần xử lý ở middleware)
  if (err.isJoi) {
    const errorDetails = err.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));

    return res.status(400).json({
      message: 'Dữ liệu không hợp lệ',
      errors: errorDetails
    });
  }

  // Lỗi Prisma chưa được xử lý (fallback)
  if (err.code && err.code.startsWith('P')) {
    console.error('Unhandled Prisma error:', err);
    return res.status(500).json({ 
      message: 'Lỗi cơ sở dữ liệu' 
    });
  }

  // Lỗi mặc định
  res.status(500).json({
    message: process.env.NODE_ENV === 'production' 
      ? 'Có lỗi xảy ra' 
      : err.message
  });
};

// Middleware xử lý 404
export const notFound = (req, res) => {
  res.status(404).json({
    message: 'Đường dẫn không tồn tại'
  });
};