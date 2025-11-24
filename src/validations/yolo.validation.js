import Joi from 'joi';

export const detectSchema = Joi.object({
  confidence: Joi.number()
    .min(0)
    .max(1)
    .optional()
    .default(0.5)
    .messages({
      'number.base': 'Confidence phải là một số',
      'number.min': 'Confidence phải lớn hơn hoặc bằng 0',
      'number.max': 'Confidence phải nhỏ hơn hoặc bằng 1'
    })
});
