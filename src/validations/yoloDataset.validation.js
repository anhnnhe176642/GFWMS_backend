import Joi from 'joi';

// Create dataset validation
export const createDatasetSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .required()
    .pattern(/^[a-zA-Z0-9_-]+$/)
    .messages({
      'string.base': 'Dataset name must be a string',
      'string.empty': 'Dataset name is required',
      'string.min': 'Dataset name must be at least 1 character',
      'string.max': 'Dataset name must not exceed 100 characters',
      'string.pattern.base': 'Dataset name can only contain letters, numbers, hyphens, and underscores',
      'any.required': 'Dataset name is required'
    }),
  description: Joi.string()
    .trim()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Description must not exceed 500 characters'
    }),
  version: Joi.string()
    .trim()
    .max(20)
    .optional()
    .messages({
      'string.max': 'Version must not exceed 20 characters'
    }),
  classes: Joi.array()
    .items(Joi.string().trim())
    .optional()
    .messages({
      'array.base': 'Classes must be an array of strings'
    })
});

// Update dataset validation
export const updateDatasetSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .optional()
    .pattern(/^[a-zA-Z0-9_-]+$/)
    .messages({
      'string.pattern.base': 'Dataset name can only contain letters, numbers, hyphens, and underscores'
    }),
  description: Joi.string()
    .trim()
    .max(500)
    .optional()
    .allow(''),
  version: Joi.string()
    .trim()
    .max(20)
    .optional(),
  status: Joi.string()
    .valid('ACTIVE', 'ARCHIVED', 'PROCESSING')
    .optional()
    .messages({
      'any.only': 'Status must be one of: ACTIVE, ARCHIVED, PROCESSING'
    })
});

// Add labeled image validation
export const addLabeledImageSchema = Joi.object({
  // Detection data from YOLO detection result
  detections: Joi.array()
    .items(
      Joi.object({
        class_id: Joi.number().integer().required(),
        class_name: Joi.string().required(),
        confidence: Joi.number().min(0).max(1).required(),
        bbox: Joi.object({
          x1: Joi.number().required(),
          y1: Joi.number().required(),
          x2: Joi.number().required(),
          y2: Joi.number().required()
        }).required(),
        center: Joi.object({
          x: Joi.number().required(),
          y: Joi.number().required()
        }).optional(),
        dimensions: Joi.object({
          width: Joi.number().required(),
          height: Joi.number().required()
        }).optional()
      })
    )
    .required()
    .messages({
      'any.required': 'Detections array is required'
    }),
  notes: Joi.string()
    .trim()
    .max(500)
    .optional()
    .allow('')
});

// Update image validation (pixel format)
export const updateImageSchema = Joi.object({
  notes: Joi.string()
    .trim()
    .max(500)
    .optional()
    .allow(''),
  annotations: Joi.array()
    .items(
      Joi.object({
        class_id: Joi.number().integer().required(),
        class_name: Joi.string().optional(),
        confidence: Joi.number().min(0).max(1).optional(),
        x1: Joi.number().required(),
        y1: Joi.number().required(),
        x2: Joi.number().required(),
        y2: Joi.number().required()
      })
    )
    .optional()
});

// Get datasets query validation
export const getDatasetsSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .optional()
    .default(1),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .optional()
    .default(10),
  search: Joi.string()
    .trim()
    .optional()
    .allow(''),
  status: Joi.string()
    .valid('ACTIVE', 'ARCHIVED', 'PROCESSING')
    .optional(),
  sortBy: Joi.string()
    .valid('name', 'createdAt', 'totalImages', 'status')
    .optional()
    .default('createdAt'),
  order: Joi.string()
    .valid('asc', 'desc')
    .optional()
    .default('desc')
});

// Get dataset images query validation
export const getDatasetImagesSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .optional()
    .default(1),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .optional()
    .default(20),
  search: Joi.string()
    .trim()
    .optional()
    .allow(''),
  sortBy: Joi.string()
    .valid('filename', 'createdAt', 'objectCount')
    .optional()
    .default('createdAt'),
  order: Joi.string()
    .valid('asc', 'desc')
    .optional()
    .default('desc')
});

// Dataset ID param validation
export const datasetIdParamSchema = Joi.object({
  datasetId: Joi.string()
    .required()
    .messages({
      'any.required': 'Dataset ID is required'
    })
});

// Image ID param validation
export const imageIdParamSchema = Joi.object({
  imageId: Joi.string()
    .required()
    .messages({
      'any.required': 'Image ID is required'
    })
});
