import Joi from 'joi';
import {
  createMultiValueFilterSchema,
  pageSchema,
  limitSchema,
  searchSchema,
  createSortBySchema,
  sortOrderSchema,
  dateFromSchema,
  dateToSchema
} from './common.validation.js';

// Create dataset validation
export const createDatasetSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .required()
    .pattern(/^[a-zA-Z0-9_-]+$/)
    .messages({
      'string.base': 'Tên dataset phải là một chuỗi',
      'string.empty': 'Tên dataset là bắt buộc',
      'string.min': 'Tên dataset phải có ít nhất 1 ký tự',
      'string.max': 'Tên dataset không được vượt quá 100 ký tự',
      'string.pattern.base': 'Tên dataset chỉ có thể chứa các chữ cái, số, dấu gạch ngang và dấu gạch dưới',
      'any.required': 'Tên dataset là bắt buộc'
    }),
  description: Joi.string()
    .trim()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Mô tả không được vượt quá 500 ký tự'
    }),
  classes: Joi.array()
    .items(Joi.string().trim())
    .optional()
    .messages({
      'array.base': 'Các lớp phải là một mảng chuỗi'
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
      'string.pattern.base': 'Tên dataset chỉ có thể chứa các chữ cái, số, dấu gạch ngang và dấu gạch dưới'
    }),
  description: Joi.string()
    .trim()
    .max(500)
    .optional()
    .allow(''),
  status: Joi.string()
    .valid('ACTIVE', 'ARCHIVED')
    .optional()
    .messages({
      'any.only': 'Trạng thái phải là một trong: ACTIVE hoặc ARCHIVED'
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
      'any.required': 'Mảng phát hiện là bắt buộc'
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
  page: pageSchema,
  limit: limitSchema,
  search: searchSchema.optional(),
  status: createMultiValueFilterSchema(
    Joi.string().valid('ACTIVE', 'ARCHIVED'),
    'Trạng thái'
  ),
  sortBy: createSortBySchema(['name', 'createdAt','description', 'totalImages', 'totalLabels', 'status']).optional(),
  order: sortOrderSchema.optional(),
  createdFrom: dateFromSchema,
  createdTo: dateToSchema.min(Joi.ref('createdFrom')).messages({
    'date.min': 'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu'
  })
});

// Get dataset images query validation
export const getDatasetImagesSchema = Joi.object({
  page: pageSchema,
  limit: limitSchema,
  search: searchSchema.optional(),
  sortBy: createSortBySchema(['filename', 'createdAt', 'objectCount']).optional(),
  order: sortOrderSchema.optional()
});

// Dataset ID param validation
export const datasetIdParamSchema = Joi.object({
  datasetId: Joi.string()
    .required()
    .messages({
      'any.required': 'ID Dataset là bắt buộc'
    })
});

// Image ID param validation
export const imageIdParamSchema = Joi.object({
  imageId: Joi.string()
    .required()
    .messages({
      'any.required': 'ID Hình ảnh là bắt buộc'
    })
});
