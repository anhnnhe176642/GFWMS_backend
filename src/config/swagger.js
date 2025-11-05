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
              format: 'date-time',
              description: 'Date of birth',
              nullable: true
            },
            gender: {
              type: 'string',
              enum: ['MALE', 'FEMALE'],
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
              enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED'],
              description: 'User status'
            },
            emailVerified: {
              type: 'boolean',
              description: 'Email verification status'
            },
            emailVerifiedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Email verification date',
              nullable: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Created date'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
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
              format: 'date-time',
              description: 'Created date'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Updated date'
            }
          }
        },
        Permission: {
          type: 'object',
          properties: {
            key: {
              type: 'string',
              description: 'Permission key'
            },
            description: {
              type: 'string',
              description: 'Permission description',
              nullable: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Created date'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Updated date'
            }
          }
        },
        Fabric: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Fabric ID'
            },
            thickness: {
              type: 'number',
              format: 'float',
              description: 'Fabric thickness'
            },
            glossId: {
              type: 'integer',
              description: 'Gloss ID'
            },
            length: {
              type: 'number',
              format: 'float',
              description: 'Fabric length'
            },
            width: {
              type: 'number',
              format: 'float',
              description: 'Fabric width'
            },
            weight: {
              type: 'number',
              format: 'float',
              description: 'Fabric weight'
            },
            sellingPrice: {
              type: 'number',
              format: 'float',
              description: 'Selling price',
              nullable: true
            },
            quantityInStock: {
              type: 'integer',
              description: 'Quantity in stock'
            },
            categoryId: {
              type: 'integer',
              description: 'Category ID'
            },
            colorId: {
              type: 'string',
              description: 'Color ID'
            },
            supplierId: {
              type: 'integer',
              description: 'Supplier ID'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Created date'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Updated date'
            }
          }
        },
        FabricCategory: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Category ID'
            },
            name: {
              type: 'string',
              description: 'Category name'
            },
            description: {
              type: 'string',
              description: 'Category description',
              nullable: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Created date'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Updated date'
            }
          }
        },
        FabricColor: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Color ID'
            },
            name: {
              type: 'string',
              description: 'Color name'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Created date'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Updated date'
            }
          }
        },
        FabricGloss: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Gloss ID'
            },
            description: {
              type: 'string',
              description: 'Gloss description'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Created date'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Updated date'
            }
          }
        },
        Supplier: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Supplier ID'
            },
            name: {
              type: 'string',
              description: 'Supplier name'
            },
            address: {
              type: 'string',
              description: 'Supplier address'
            },
            phone: {
              type: 'string',
              description: 'Supplier phone'
            },
            isActive: {
              type: 'boolean',
              description: 'Active status'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Created date'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Updated date'
            }
          }
        },
        Warehouse: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Warehouse ID'
            },
            name: {
              type: 'string',
              description: 'Warehouse name'
            },
            address: {
              type: 'string',
              description: 'Warehouse address'
            },
            status: {
              type: 'string',
              enum: ['ACTIVE', 'INACTIVE'],
              description: 'Warehouse status'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Created date'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Updated date'
            }
          }
        },
        Store: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Store ID'
            },
            name: {
              type: 'string',
              description: 'Store name'
            },
            address: {
              type: 'string',
              description: 'Store address'
            },
            isActive: {
              type: 'boolean',
              description: 'Active status'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Created date'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Updated date'
            }
          }
        },
        Order: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Order ID'
            },
            userId: {
              type: 'string',
              description: 'User ID'
            },
            orderDate: {
              type: 'string',
              format: 'date-time',
              description: 'Order date'
            },
            status: {
              type: 'string',
              enum: ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELED'],
              description: 'Order status'
            },
            totalAmount: {
              type: 'number',
              format: 'float',
              description: 'Total amount'
            },
            notes: {
              type: 'string',
              description: 'Order notes',
              nullable: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Created date'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Updated date'
            }
          }
        },
        Invoice: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Invoice ID'
            },
            orderId: {
              type: 'integer',
              description: 'Order ID'
            },
            invoiceDate: {
              type: 'string',
              format: 'date-time',
              description: 'Invoice date'
            },
            dueDate: {
              type: 'string',
              format: 'date-time',
              description: 'Due date'
            },
            invoiceStatus: {
              type: 'string',
              enum: ['UNPAID', 'PAID', 'OVERDUE', 'CREDIT', 'REFUNDED', 'CANCELED'],
              description: 'Invoice status'
            },
            totalAmount: {
              type: 'number',
              format: 'float',
              description: 'Total amount'
            },
            notes: {
              type: 'string',
              description: 'Invoice notes',
              nullable: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Created date'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Updated date'
            }
          }
        },
        ImportFabric: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Import ID'
            },
            warehouseId: {
              type: 'integer',
              description: 'Warehouse ID'
            },
            importDate: {
              type: 'string',
              format: 'date-time',
              description: 'Import date'
            },
            importer: {
              type: 'string',
              description: 'Importer user ID'
            },
            totalPrice: {
              type: 'number',
              format: 'float',
              description: 'Total price'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Created date'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Updated date'
            }
          }
        },
        ExportFabric: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Export ID'
            },
            warehouseId: {
              type: 'integer',
              description: 'Warehouse ID'
            },
            storeId: {
              type: 'integer',
              description: 'Store ID'
            },
            status: {
              type: 'string',
              enum: ['PENDING', 'APPROVED', 'REJECTED'],
              description: 'Export status'
            },
            note: {
              type: 'string',
              description: 'Export note',
              nullable: true
            },
            createdById: {
              type: 'string',
              description: 'Creator user ID'
            },
            receivedById: {
              type: 'string',
              description: 'Receiver user ID',
              nullable: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Created date'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Updated date'
            }
          }
        },
        Notification: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Notification ID'
            },
            creator: {
              type: 'string',
              description: 'Creator user ID'
            },
            title: {
              type: 'string',
              description: 'Notification title'
            },
            message: {
              type: 'string',
              description: 'Notification message'
            },
            type: {
              type: 'string',
              enum: ['SYSTEM', 'PROMOTION', 'ORDER', 'CUSTOM'],
              description: 'Notification type'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Created date'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Updated date'
            }
          }
        },
        Shelf: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Shelf ID'
            },
            code: {
              type: 'string',
              description: 'Shelf code (unique identifier)'
            },
            currentQuantity: {
              type: 'integer',
              description: 'Current quantity of fabric on shelf'
            },
            maxQuantity: {
              type: 'integer',
              description: 'Maximum capacity of shelf'
            },
            warehouseId: {
              type: 'integer',
              description: 'Warehouse ID'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Created date'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Updated date'
            }
          }
        },
        Pagination: {
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
            },
            hasNext: {
              type: 'boolean',
              description: 'Indicates if there is a next page'
            },
            hasPrev: {
              type: 'boolean',
              description: 'Indicates if there is a previous page'
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
            },
            hasNext: {
              type: 'boolean',
              description: 'Indicates if there is a next page'
            },
            hasPrev: {
              type: 'boolean',
              description: 'Indicates if there is a previous page'
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
      },
      {
        name: 'Permissions',
        description: 'Permission management endpoints'
      },
      {
        name: 'Fabrics',
        description: 'Fabric management endpoints'
      },
      {
        name: 'FabricCategory',
        description: 'Fabric category management endpoints'
      },
      {
        name: 'FabricColor',
        description: 'Fabric color management endpoints'
      },
      {
        name: 'FabricGloss',
        description: 'Fabric gloss management endpoints'
      },
      {
        name: 'Supplier',
        description: 'Supplier management endpoints'
      },
      {
        name: 'Warehouses',
        description: 'Warehouse management endpoints'
      },
      {
        name: 'Shelves',
        description: 'Shelf management endpoints'
      },
      {
        name: 'Stores',
        description: 'Store management endpoints'
      },
      {
        name: 'Orders',
        description: 'Order management endpoints'
      },
      {
        name: 'Invoices',
        description: 'Invoice management endpoints'
      },
      {
        name: 'Import Fabrics',
        description: 'Fabric import management endpoints'
      },
      {
        name: 'ExportFabrics',
        description: 'Fabric export management endpoints'
      },
      {
        name: 'Notifications',
        description: 'Notification management endpoints'
      }
    ],
    servers: [
      { url: '/api/v1', description: 'Version 1' },
      { url: '/api/v2', description: 'Version 2' },
    ],
  },
  apis: ['./src/routes/**/*.js'], // Path to the API routes
};

const swaggerSpec = swaggerJsdoc(options);

// Swagger UI options with persistent authorization
const swaggerUiOptions = {
  swaggerOptions: {
    persistAuthorization: true, // Persist authorization data in localStorage
  },
  customCss: '.swagger-ui .topbar { display: none }' // Optional: hide top bar
};

export { swaggerUi, swaggerSpec, swaggerUiOptions };
