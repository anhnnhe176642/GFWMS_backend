import { permissionRepository } from '../repositories/permission.repository.js';
import { NotFoundError } from '../utils/errors.js';

export const getAllPermissions = async () => {
  return await permissionRepository.findAll();
};

export const getPermissionsByIds = async (ids) => {
  return await permissionRepository.findByIds(ids);
};

export const getPermissionsByUserId = async (userId) => {
  const userPermissions = await permissionRepository.findByUserId(userId);
  
  if (!userPermissions) {
    throw new NotFoundError('Không tìm thấy người dùng');
  }

  return userPermissions;
};
