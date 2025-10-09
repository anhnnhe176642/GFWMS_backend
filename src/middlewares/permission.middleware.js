import jwt from 'jsonwebtoken';
import { AuthenticationError, AuthorizationError } from '../utils/errors.js';
import { userRepository } from '../repositories/user.repository.js';

// Middleware xác thực JWT token
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      throw new AuthenticationError('Access token is required');
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Lấy thông tin user cơ bản từ database
    const user = await userRepository.findById(decoded.userId);
    
    if (!user) {
      throw new AuthenticationError('User không tồn tại');
    }

    if (user.status !== 'ACTIVE') {
      throw new AuthenticationError('Tài khoản đã bị khóa hoặc chưa kích hoạt');
    }

    // Attach user info vào request 
    req.user = user
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      next(new AuthenticationError('Token không hợp lệ'));
    } else if (error.name === 'TokenExpiredError') {
      next(new AuthenticationError('Token đã hết hạn'));
    } else {
      next(error);
    }
  }
};

// Middleware kiểm tra permission (single permission)
export const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new AuthenticationError('User chưa được xác thực');
      }

      const hasPermission = await userRepository.hasPermission(req.user.id, permission);
      
      if (!hasPermission) {
        throw new AuthorizationError(`Không có quyền: ${permission}`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Middleware kiểm tra multiple permissions (OR logic - chỉ cần 1 trong các quyền)
export const requireAnyPermission = (permissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new AuthenticationError('User chưa được xác thực');
      }

      const hasAnyPermission = await userRepository.hasAnyPermission(req.user.id, permissions);
      
      if (!hasAnyPermission) {
        throw new AuthorizationError(`Không có quyền: ${permissions.join(' hoặc ')}`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Middleware kiểm tra multiple permissions (AND logic - cần tất cả quyền)
export const requireAllPermissions = (permissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new AuthenticationError('User chưa được xác thực');
      }

      const hasAllPermissions = await userRepository.hasAllPermissions(req.user.id, permissions);
      
      if (!hasAllPermissions) {
        throw new AuthorizationError(`Không có đủ quyền: ${permissions.join(', ')}`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Middleware kiểm tra quyền sở hữu resource (cho phép user quản lý data của chính mình)
export const requireOwnershipOrPermission = (permission, getResourceOwnerId) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new AuthenticationError('User chưa được xác thực');
      }

      const hasPermission = await userRepository.hasPermission(req.user.id, permission);
      if (hasPermission) {
        return next();
      }

      // Nếu không có permission, check ownership
      const resourceOwnerId = await getResourceOwnerId(req);
      if (resourceOwnerId === req.user.id) {
        return next();
      }

      throw new AuthorizationError('Không có quyền truy cập resource này');
    } catch (error) {
      next(error);
    }
  };
};

// Helper function để check admin role
export const isAdmin = (req, res, next) => {
  return requirePermission('system:manage_permissions')(req, res, next);
};