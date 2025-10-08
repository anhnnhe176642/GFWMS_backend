// Custom Error Classes với status code
export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.status = statusCode;
    this.name = this.constructor.name;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message, field = null) {
    super(message, 400);
    
    if (field) {
      this.errors = [{
        field: field,
        message: message
      }];
      this.message = 'Dữ liệu không hợp lệ';
    }
  }
}

export class AuthenticationError extends AppError {
  constructor(message) {
    super(message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message) {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message) {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message, field = null) {
    super(message, 409);
    
    if (field) {
      this.errors = [{
        field: field,
        message: message
      }];
    }
  }
}

export class InternalServerError extends AppError {
  constructor(message) {
    super(message, 500);
  }
}