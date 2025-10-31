import { permissionRepository } from '../repositories/permission.repository.js';

export const getAllPermissions = async () => {
  return await permissionRepository.findAll();
};

export const getPermissionsByIds = async (ids) => {
  return await permissionRepository.findByIds(ids);
};
