import Joi from 'joi';

export const geminiPromptSchema = Joi.object({
  prompt: Joi.string()
    .trim()
    .required()
    .max(10000)
    .messages({
      'string.empty': 'Prompt không được để trống',
      'string.max': 'Prompt không được vượt quá 10000 ký tự',
      'any.required': 'Prompt là bắt buộc'
    }),
  model: Joi.string()
    .trim()
    .optional()
    .default('gemini-2.5-flash')
    .valid('gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-pro')
    .messages({
      'any.only': 'Model không hợp lệ. Chỉ chấp nhận: gemini-2.5-flash, gemini-2.5-pro, gemini-pro'
    }),
  temperature: Joi.number()
    .optional()
    .min(0)
    .max(2)
    .default(0.7)
    .messages({
      'number.min': 'Temperature phải >= 0',
      'number.max': 'Temperature phải <= 2'
    }),
  maxTokens: Joi.number()
    .optional()
    .min(1)
    .max(32768)
    .default(2000)
    .messages({
      'number.min': 'maxTokens phải >= 1',
      'number.max': 'maxTokens không được vượt quá 32768'
    })
});

export const geminiChatSchema = Joi.object({
  messages: Joi.array()
    .items(
      Joi.object({
        role: Joi.string()
          .trim()
          .required()
          .valid('user', 'model')
          .messages({
            'any.only': 'Role phải là "user" hoặc "model"'
          }),
        content: Joi.string()
          .trim()
          .required()
          .max(10000)
          .messages({
            'string.empty': 'Content không được để trống',
            'string.max': 'Content không được vượt quá 10000 ký tự'
          })
      })
    )
    .required()
    .min(1)
    .messages({
      'array.min': 'Ít nhất phải có 1 message trong conversation'
    }),
  model: Joi.string()
    .trim()
    .optional()
    .default('gemini-2.5-flash')
    .valid('gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-pro'),
  temperature: Joi.number()
    .optional()
    .min(0)
    .max(2)
    .default(0.7),
  maxTokens: Joi.number()
    .optional()
    .min(1)
    .max(32768)
    .default(2000)
});
