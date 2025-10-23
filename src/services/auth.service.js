import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import process from 'process';
import { AuthenticationError, NotFoundError, ValidationError, ConflictError } from '../utils/errors.js';
import { userRepository } from '../repositories/user.repository.js';
import { emailVerificationRepository } from '../repositories/emailVerification.repository.js';
import { hashPin, generateNumericPin } from '../utils/hash.js';
import { sendVerificationCodeEmail } from './email.service.js';
import { passwordResetPinRepository } from '../repositories/passwordResetPin.repository.js';
import { sendPasswordResetPin } from '../utils/mailer.js';

export const registerUser = async (userData) => {
  // If email already exists and is verified -> conflict
  const existing = await userRepository.findByEmail(userData.email);
  if (existing) {
    if (existing.emailVerified) {
      throw new ConflictError('Email đã được sử dụng', 'email');
    }

    await emailVerificationRepository.invalidatePinsForUser(existing.id);
    await userRepository.deleteById(existing.id);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(userData.password, 10);

  // Create user
  const user = await userRepository.create({
    ...userData,
    password: hashedPassword
  });

  // Generate a numeric PIN and send verification email
  await emailVerificationRepository.invalidatePinsForUser(user.id);

  const pin = generateNumericPin(6);
  const pinHash = hashPin(pin);
  const expiresInMinutes = parseInt(process.env.VERIFY_PIN_EXPIRES_MINUTES) || 15;
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

  await emailVerificationRepository.createPin({
    userId: user.id,
    pinHash,
    expiresAt
  });

  sendVerificationCodeEmail(user.email, pin, expiresInMinutes);

  return { user };
};

export const verifyEmailPin = async (email, pin) => {
  const user = await userRepository.findByEmail(email);

  if (!user) {
    throw new NotFoundError('User không tồn tại');
  }

  if (user.emailVerified) {
    throw new ValidationError('Email đã được xác thực', 'email');
  }

  // Find the latest active pin for user
  const latestPin = await emailVerificationRepository.findLatestActiveByUser(user.id);
  if (!latestPin) {
    throw new AuthenticationError('Mã xác thực không hợp lệ hoặc đã hết hạn');
  }

  const providedHash = hashPin(pin);

  // If pin matches
  if (latestPin.pinHash === providedHash) {
    // Mark pin used and update user
    await emailVerificationRepository.markUsed(latestPin.id);
    const verifiedUser = await userRepository.markEmailVerified(user.id);

    // Generate JWT token so user can be logged in immediately after verification
    const token = jwt.sign(
      { userId: verifiedUser.id, username: verifiedUser.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    verifiedUser.permissionKeys = await userRepository.getUserPermissionKeys(verifiedUser.id);
    return { user: verifiedUser, token };
  }

  // Pin mismatch — increment attempts and possibly invalidate
  await emailVerificationRepository.incrementAttempts(latestPin.id);
  const MAX_ATTEMPTS = parseInt(process.env.VERIFY_PIN_MAX_ATTEMPTS || '5');
  if ((latestPin.attempts || 0) + 1 >= MAX_ATTEMPTS) {
    await emailVerificationRepository.markUsed(latestPin.id);
    throw new AuthenticationError('Quá nhiều lần thử. Mã xác thực đã bị hủy. Vui lòng yêu cầu mã mới.');
  }

  throw new AuthenticationError('Mã xác thực không hợp lệ');
};

export const resendVerificationPin = async (email) => {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw new NotFoundError('User không tồn tại');
  }

  if (user.emailVerified) {
    throw new ValidationError('Email đã được xác thực', 'email');
  }

  // Check cooldown for resending
  const lastPin = await emailVerificationRepository.findLatestActiveByUser(user.id);
  const cooldownSeconds = parseInt(process.env.VERIFY_PIN_RESEND_COOLDOWN_SECONDS || '60');
  if (lastPin && (new Date() - new Date(lastPin.createdAt)) / 1000 < cooldownSeconds) {
    throw new ValidationError('Vui lòng đợi trước khi gửi lại mã xác thực');
  }

  // Invalidate previous pins and create a new one
  await emailVerificationRepository.invalidatePinsForUser(user.id);
  const pin = generateNumericPin(6);
  const pinHash = hashPin(pin);
  const expiresInMinutes = parseInt(process.env.VERIFY_PIN_EXPIRES_MINUTES || '15');
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

  await emailVerificationRepository.createPin({ userId: user.id, pinHash, expiresAt });
  sendVerificationCodeEmail(user.email, pin, expiresInMinutes);
  return { message: 'Mã xác thực đã được gửi lại' };
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
  user.permissionKeys = await userRepository.getUserPermissionKeys(user.id);

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

// --- Password reset via PIN ---
export const requestPasswordReset = async (email) => {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    // For security, do not reveal whether email exists. But keep consistent: throw NotFoundError or return silently.
    throw new NotFoundError('User không tồn tại');
  }

  // Invalidate previous reset pins
  await passwordResetPinRepository.invalidatePinsForUser(user.id);

  const pin = generateNumericPin(6);
  const pinHash = hashPin(pin);
  const expiresInMinutes = parseInt(process.env.PASSWORD_RESET_PIN_EXPIRES_MINUTES || '15');
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

  await passwordResetPinRepository.createPin({ userId: user.id, pinHash, expiresAt });

  // Send email with the pin
  await sendPasswordResetPin(user.email, pin, expiresInMinutes);

  return { message: 'Mã đặt lại mật khẩu đã được gửi đến email của bạn' };
};

// Step 1: Verify PIN only
export const verifyPasswordResetPin = async (email, pin) => {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw new NotFoundError('User không tồn tại');
  }
  const latestPin = await passwordResetPinRepository.findLatestActiveByUser(user.id);
  if (!latestPin) {
    throw new AuthenticationError('Mã đặt lại không hợp lệ hoặc đã hết hạn');
  }
  const providedHash = hashPin(pin);
  if (providedHash === latestPin.pinHash) {
    await passwordResetPinRepository.markVerified(latestPin.id);
    return { message: 'Mã PIN hợp lệ. Bạn có thể đặt lại mật khẩu.' };
  }
  await passwordResetPinRepository.incrementAttempts(latestPin.id);
  const MAX_ATTEMPTS = parseInt(process.env.PASSWORD_RESET_PIN_MAX_ATTEMPTS || '5');
  if ((latestPin.attemptCount || 0) + 1 >= MAX_ATTEMPTS) {
    await passwordResetPinRepository.markUsed(latestPin.id);
    throw new AuthenticationError('Quá nhiều lần thử. Mã đặt lại đã bị hủy. Vui lòng yêu cầu mã mới.');
  }
  throw new AuthenticationError('Mã đặt lại không hợp lệ');
};

// Step 2: Set new password (only if PIN verified)
export const setNewPasswordWithVerifiedPin = async (email, pin, newPassword) => {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw new NotFoundError('User không tồn tại');
  }
  const latestPin = await passwordResetPinRepository.findLatestVerifiedByUser(user.id);
  if (!latestPin) {
    throw new AuthenticationError('Bạn chưa xác nhận mã PIN hoặc mã đã hết hạn.');
  }
  const providedHash = hashPin(pin);
  if (providedHash !== latestPin.pinHash) {
    throw new AuthenticationError('Mã PIN không hợp lệ.');
  }
  // Đổi mật khẩu và đánh dấu used
  const hashedNewPassword = await bcrypt.hash(newPassword, 10);
  await userRepository.updateById(user.id, { password: hashedNewPassword });
  await passwordResetPinRepository.markUsed(latestPin.id);
  return { message: 'Mật khẩu đã được đặt lại thành công' };
};

