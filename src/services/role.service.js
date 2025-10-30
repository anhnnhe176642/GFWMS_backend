import { roleRepository } from '../repositories/role.repository.js';
import { NotFoundError } from '../utils/errors.js';

export const getAllRoles = async () => {
  return await roleRepository.findAll();
};

export const createRole = async (roleData) => {
  return await roleRepository.create(roleData);
};

export const getRoleByName = async (name) => {
  const role = await roleRepository.findByName(name);
  if (!role) {
    throw new NotFoundError('Role không tồn tại');
  }
  return role;
};

export const deleteRole = async (name) => {
  const existingRole = await roleRepository.findByName(name);
  if (!existingRole) {
    throw new NotFoundError('Role không tồn tại');
  }
  
  return await roleRepository.delete(name);
};

export const getAllRolesAdvanced = async (queryOptions) => {
  return await roleRepository.findWithAdvancedQuery(queryOptions);
};