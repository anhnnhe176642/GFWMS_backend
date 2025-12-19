import bcrypt from 'bcryptjs';
import { NotFoundError } from '../utils/errors.js';
import { UserStatus } from '@prisma/client';
import { userRepository } from '../repositories/user.repository.js';

export const createUser = async (data) => {
  // Hash password if provided
  if (data.password) {
    data.password = await bcrypt.hash(data.password, 10);
  }
  
  return await userRepository.create(data);
};

export const getUserById = async (id) => {
  const user = await userRepository.findById(id);
  
  if (!user) {
    throw new NotFoundError('User không tồn tại');
  }
  
  return user;
};

export const updateUser = async (id, data) => {
  // Hash password if provided
  if (data.password) {
    data.password = await bcrypt.hash(data.password, 10);
  }
  
  return await userRepository.updateById(id, data);
};

export const deleteUser = async (id) => {
  // Check if user exists first
  const existingUser = await userRepository.findById(id);
  if (!existingUser) {
    throw new NotFoundError('User không tồn tại');
  }
  
  if (existingUser.status === UserStatus.DELETED) {
    throw new Error('User đã bị xóa trước đó');
  }
  return await userRepository.softDelete(id);
};

export const getUserByUsername = async (username) => {
  return await userRepository.findByUsername(username);
};

export const getUserByEmail = async (email) => {
  return await userRepository.findByEmail(email);
};

export const getAllUsersAdvanced = async (queryOptions) => {
  return await userRepository.findWithAdvancedQuery(queryOptions);
};

export const searchUsersByPhone = async (phone) => {
  if (!phone || phone.trim() === '') {
    throw new Error('Vui lòng nhập số điện thoại');
  }
  
  const users = await userRepository.findByPhoneContaining(phone.trim());
  
  if (!users || users.length === 0) {
    return [];
  }
  
  return users;
};
