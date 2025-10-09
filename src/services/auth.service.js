import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthenticationError, NotFoundError, ValidationError } from '../utils/errors.js';
import { userRepository } from '../repositories/user.repository.js';

export const registerUser = async (userData) => {
  // Hash password
  const hashedPassword = await bcrypt.hash(userData.password, 10);
  
  // Create user
  const user = await userRepository.create({
    ...userData,
    password: hashedPassword
  });

  // Generate JWT token
  const token = jwt.sign(
    { userId: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );

  return {
    user,
    token
  };
};

export const loginUser = async (usernameOrEmail, password) => {
  // Find user by username or email (cần password để verify)
  const user = await userRepository.findByUsernameOrEmailWithPassword(usernameOrEmail);

  if (!user) {
    throw new AuthenticationError('Username hoặc password không đúng');
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AuthenticationError('Username hoặc password không đúng');
  }

  // Check user status
  if (user.status === 'INACTIVE') {
    throw new AuthenticationError('Tài khoản chưa được kích hoạt');
  }

  // Generate JWT token
  const token = jwt.sign(
    { userId: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );

  delete user.password;

  return {
    user,
    token
  };
};

export const getUserProfile = async (userId) => {
  const user = await userRepository.findById(userId);

  if (!user) {
    throw new NotFoundError('User không tồn tại');
  }

  return user;
};

export const updateUserProfile = async (userId, updateData) => {
  const user = await userRepository.updateById(userId, updateData);
  return user;
};

export const changeUserPassword = async (userId, currentPassword, newPassword) => {
  // Lấy user với password để verify
  const user = await userRepository.findByIdWithPassword(userId);
  
  if (!user) {
    throw new NotFoundError('User không tồn tại');
  }

  // Verify current password
  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
  if (!isCurrentPasswordValid) {
    throw new ValidationError('Password hiện tại không đúng', 'currentPassword');
  }

  // Check if new password is different from current
  const isSamePassword = await bcrypt.compare(newPassword, user.password);
  if (isSamePassword) {
    throw new ValidationError('Password mới phải khác password hiện tại', 'newPassword');
  }

  // Hash new password
  const hashedNewPassword = await bcrypt.hash(newPassword, 10);

  // Update password
  await userRepository.updateById(userId, { password: hashedNewPassword });
};