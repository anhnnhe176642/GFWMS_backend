import { roleRepository } from '../repositories/role.repository.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

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

export const updateRole = async (name, updateData) => {
  const existingRole = await roleRepository.findByName(name);
  if (!existingRole) {
    throw new NotFoundError('Role không tồn tại');
  }
  
  return await roleRepository.update(name, updateData);
};

export const deleteRole = async (name) => {
  const existingRole = await roleRepository.findByName(name);
  if (!existingRole) {
    throw new NotFoundError('Role không tồn tại');
  }
  
  // Kiểm tra xem có user nào đang sử dụng role này không
  const isInUse = await roleRepository.isRoleInUse(name);
  if (isInUse) {
    // Lấy danh sách users để thông báo chi tiết
    const users = await roleRepository.getUsersUsingRole(name);
    const usernames = users.map(user => user.username).join(', ');
    
    throw new ValidationError(
      `Không thể xóa role '${name}' vì đang được sử dụng bởi các user: ${usernames}`,
      'role'
    );
  }
  
  return await roleRepository.delete(name);
};

export const getAllRolesAdvanced = async (queryOptions) => {
  return await roleRepository.findWithAdvancedQuery(queryOptions);
};