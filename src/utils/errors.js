// Custom Error Classes với status code
export class AppError extends Error {
  constructor(message, statusCode, field = null) {
    super(message);
    this.status = statusCode;
    this.name = this.constructor.name;
    
    if (field) {
      this.errors = [{
        field: field,
        message: message
      }];
    }
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message, field = null) {
    super(message, 400, field);
  }
}

export class AuthenticationError extends AppError {
  constructor(message, field = null) {
    super(message, 401, field);
  }
}

export class AuthorizationError extends AppError {
  constructor(message, field = null) {
    super(message, 403, field);
  }
}

export class NotFoundError extends AppError {
  constructor(message, field = null) {
    super(message, 404, field);
  }
}

export class ConflictError extends AppError {
  constructor(message, field = null) {
    super(message, 409, field);
  }
}

export class InternalServerError extends AppError {
  constructor(message, field = null) {
    super(message, 500, field);
  }
}