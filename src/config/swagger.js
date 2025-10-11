import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'GFWMS Backend API',
      version: '1.0.0',
      description: 'API documentation for GFWMS (Garment Fabric Warehouse Management System)',
      contact: {
        name: 'API Support',
        email: 'support@gfwms.com'
      },
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC'
      }
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          required: ['message'],
          properties: {
            message: {
              type: 'string',
              description: 'Error message'
            }
          }
        },
        ValidationError: {
          type: 'object',
          required: ['message', 'errors'],
          properties: {
            message: {
              type: 'string',
              description: 'Validation error message',
              example: 'Dữ liệu không hợp lệ'
            },
            errors: {
              type: 'array',
              description: 'Array of validation errors',
              items: {
                type: 'object',
                required: ['field', 'message'],
                properties: {
                  field: {
                    type: 'string',
                    description: 'Field name that failed validation',
                    example: 'username'
                  },
                  message: {
                    type: 'string',
                    description: 'Validation error message for the field',
                    example: 'Username phải có ít nhất 3 ký tự'
                  }
                }
              }
            }
          }
        },
        SuccessResponse: {
          type: 'object',
          required: ['message'],
          properties: {
            message: {
              type: 'string',
              description: 'Success message'
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'User ID'
            },
            username: {
              type: 'string',
              description: 'Username'
            },
            email: {
              type: 'string',
              description: 'User email address'
            },
            fullname: {
              type: 'string',
              description: 'Full name',
              nullable: true
            },
            phone: {
              type: 'string',
              description: 'Phone number',
              nullable: true
            },
            avatar: {
              type: 'string',
              description: 'Avatar URL',
              nullable: true
            },
            dob: {
              type: 'string',
              description: 'Date of birth',
              nullable: true
            },
            gender: {
              type: 'string',
              description: 'Gender',
              nullable: true
            },
            address: {
              type: 'string',
              description: 'Address',
              nullable: true
            },
            role: {
              type: 'string',
              description: 'Role name'
            },
            status: {
              type: 'string',
              description: 'User status'
            },
            createdAt: {
              type: 'string',
              description: 'Created date'
            },
            updatedAt: {
              type: 'string',
              description: 'Updated date'
            }
          }
        },
        Role: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Role name'
            },
            description: {
              type: 'string',
              description: 'Role description',
              nullable: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            },
            permissions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  permission_name: {
                    type: 'string'
                  }
                }
              }
            }
          }
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              description: 'Current page number'
            },
            limit: {
              type: 'integer',
              description: 'Number of items per page'
            },
            total: {
              type: 'integer',
              description: 'Total number of items'
            },
            totalPages: {
              type: 'integer',
              description: 'Total number of pages'
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Access token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              examples: {
                invalidToken: {
                  summary: 'Invalid token',
                  value: {
                    message: 'Token không hợp lệ'
                  }
                },
                expiredToken: {
                  summary: 'Expired token',
                  value: {
                    message: 'Token đã hết hạn'
                  }
                },
                missingToken: {
                  summary: 'Missing authorization header',
                  value: {
                    message: 'Token không được cung cấp'
                  }
                }
              }
            }
          }
        },
        ForbiddenError: {
          description: 'Insufficient permissions to access this resource',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                message: 'Bạn không có quyền truy cập tài nguyên này'
              }
            }
          }
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              examples: {
                userNotFound: {
                  summary: 'User not found',
                  value: {
                    message: 'User không tồn tại'
                  }
                },
                roleNotFound: {
                  summary: 'Role not found',
                  value: {
                    message: 'Role không tồn tại'
                  }
                }
              }
            }
          }
        },
        ValidationError: {
          description: 'Request validation failed',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ValidationError'
              },
              examples: {
                multipleErrors: {
                  summary: 'Multiple validation errors',
                  value: {
                    message: 'Dữ liệu không hợp lệ',
                    errors: [
                      {
                        field: 'username',
                        message: 'Username phải có ít nhất 3 ký tự'
                      },
                      {
                        field: 'email',
                        message: 'Email không hợp lệ'
                      }
                    ]
                  }
                },
                singleError: {
                  summary: 'Single validation error',
                  value: {
                    message: 'Dữ liệu không hợp lệ',
                    errors: [
                      {
                        field: 'password',
                        message: 'Password phải có ít nhất 6 ký tự'
                      }
                    ]
                  }
                }
              }
            }
          }
        },
        ConflictError: {
          description: 'Resource conflict (duplicate)',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              examples: {
                duplicateUsername: {
                  summary: 'Username already exists',
                  value: {
                    message: 'username đã tồn tại'
                  }
                },
                duplicateEmail: {
                  summary: 'Email already exists',
                  value: {
                    message: 'email đã tồn tại'
                  }
                },
                duplicateRole: {
                  summary: 'Role already exists',
                  value: {
                    message: 'name đã tồn tại'
                  }
                }
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Auth',
        description: 'Authentication and authorization endpoints'
      },
      {
        name: 'Users',
        description: 'User management endpoints'
      },
      {
        name: 'Roles',
        description: 'Role and permission management endpoints'
      }
    ]
  },
  apis: ['./src/routes/*.js'], // Path to the API routes
};

const swaggerSpec = swaggerJsdoc(options);

export { swaggerUi, swaggerSpec };
