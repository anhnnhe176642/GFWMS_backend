import Joi from 'joi';

/**
 * Validation schemas for YOLO Dataset endpoints
 */

/**
 * Middleware to check if file is uploaded
 * Use before Joi validation for multipart/form-data
 */
export const requireImageFile = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      message: 'Dữ liệu không hợp lệ',
      errors: [{
        field: 'image',
        message: 'Image file is required'
      }]
    });
  }
  next();
};

export const createDatasetSchema = Joi.object({
  name: Joi.string()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Dataset name is required',
      'string.max': 'Dataset name must be at most 100 characters'
    }),
  
  description: Joi.string()
    .max(1000)
    .allow('', null)
    .optional(),

  status: Joi.string()
    .valid('ACTIVE', 'ARCHIVED', 'TRAINING')
    .default('ACTIVE')
    .optional()
});

export const updateDatasetSchema = Joi.object({
  name: Joi.string()
    .min(1)
    .max(100)
    .optional(),
  
  description: Joi.string()
    .max(1000)
    .allow('', null)
    .optional(),

  status: Joi.string()
    .valid('ACTIVE', 'ARCHIVED', 'TRAINING')
    .optional()
}).min(1); // At least one field required

// Label object schema
const labelSchema = Joi.object({
  class_id: Joi.number().integer().min(0).required(),
  class_name: Joi.string().required(),
  center_x: Joi.number().min(0).max(1).required(),
  center_y: Joi.number().min(0).max(1).required(),
  width: Joi.number().min(0).max(1).required(),
  height: Joi.number().min(0).max(1).required(),
  confidence: Joi.number().min(0).max(1).optional(),
  verified: Joi.boolean().default(false).optional()
});

export const saveImageSchema = Joi.object({
  labels: Joi.alternatives()
    .try(
      // Accept array directly
      Joi.array().items(labelSchema).min(1),
      // Or accept JSON string and parse it
      Joi.string().custom((value, helpers) => {
        try {
          const parsed = JSON.parse(value);
          const { error, value: validated } = Joi.array().items(labelSchema).min(1).validate(parsed);
          if (error) {
            return helpers.error('any.invalid');
          }
          return validated;
        // eslint-disable-next-line no-unused-vars
        } catch (err) {
          return helpers.error('string.base');
        }
      })
    )
    .required()
    .messages({
      'any.required': 'Labels are required',
      'any.invalid': 'Invalid label format'
    }),

  split: Joi.string()
    .valid('train', 'val', 'test')
    .default('train')
    .optional()
});

// Detection result schema
const detectionItemSchema = Joi.object({
  class_id: Joi.number().integer().min(0).required(),
  class_name: Joi.string().required(),
  confidence: Joi.number().min(0).max(1).required(),
  bbox: Joi.object({
    x1: Joi.number().required(),
    y1: Joi.number().required(),
    x2: Joi.number().required(),
    y2: Joi.number().required()
  }).required()
});

const detectionResultSchema = Joi.object({
  success: Joi.boolean().required(),
  image_info: Joi.object({
    width: Joi.number().required(),
    height: Joi.number().required()
  }).required(),
  detections: Joi.array().items(detectionItemSchema).min(1).required()
});

export const saveDetectionSchema = Joi.object({
  detection_result: Joi.alternatives()
    .try(
      // Accept object directly
      detectionResultSchema,
      // Or accept JSON string and parse it
      Joi.string().custom((value, helpers) => {
        try {
          const parsed = JSON.parse(value);
          const { error, value: validated } = detectionResultSchema.validate(parsed);
          if (error) {
            return helpers.error('any.invalid');
          }
          return validated;
        // eslint-disable-next-line no-unused-vars
        } catch (err) {
          return helpers.error('string.base');
        }
      })
    )
    .required()
    .messages({
      'any.required': 'Detection result is required',
      'any.invalid': 'Invalid detection result format'
    }),

  split: Joi.string()
    .valid('train', 'val', 'test')
    .default('train')
    .optional()
});

export const startTrainingSchema = Joi.object({
  base_model: Joi.string()
    .default('best.pt')
    .optional()
    .messages({
      'string.empty': 'Base model path cannot be empty'
    }),

  epochs: Joi.number()
    .integer()
    .min(1)
    .max(1000)
    .default(100)
    .optional(),

  batch_size: Joi.number()
    .integer()
    .min(1)
    .max(128)
    .default(16)
    .optional(),

  image_size: Joi.number()
    .integer()
    .valid(320, 640, 1280)
    .default(640)
    .optional()
});

export const datasetQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).optional(),
  limit: Joi.number().integer().min(1).max(100).default(20).optional(),
  sortBy: Joi.string().default('createdAt').optional(),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc').optional(),
  status: Joi.string().valid('ACTIVE', 'ARCHIVED', 'TRAINING').optional(),
  search: Joi.string().allow('').optional()
});

export const trainingRunQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).optional(),
  limit: Joi.number().integer().min(1).max(100).default(20).optional(),
  sortBy: Joi.string().default('createdAt').optional(),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc').optional(),
  status: Joi.string().valid('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED').optional(),
  datasetId: Joi.number().integer().optional()
});

export const classesQuerySchema = Joi.object({
  active_only: Joi.string()
    .valid('true', 'false')
    .default('true')
    .optional()
    .custom((value) => value !== 'false') // Convert to boolean
});

