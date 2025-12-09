import Joi from 'joi';

export const assignMultiple = Joi.object({
  userId: Joi.string().uuid().required(),
  warehouseIds: Joi.array().items(Joi.number().integer()).min(1).required()
});

export const getUserWarehouses = Joi.object({
  userId: Joi.string().uuid().required()
});

export const getWarehouseManagers = Joi.object({
  warehouseId: Joi.number().integer().required()
});

export const checkAccess = Joi.object({
  userId: Joi.string().uuid().required(),
  warehouseId: Joi.number().integer().required()
});

export const removeAll = Joi.object({
  userId: Joi.string().uuid().required()
});
