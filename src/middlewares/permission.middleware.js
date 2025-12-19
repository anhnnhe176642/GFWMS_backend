import jwt from 'jsonwebtoken';
import { AuthenticationError, AuthorizationError } from '../utils/errors.js';
import { userRepository } from '../repositories/user.repository.js';
import { PERMISSIONS } from '../constants/permissions.js';

// Middleware xác thực JWT token
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      throw new AuthenticationError('Token không được cung cấp');
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

      // Hỗ trợ cả object {key, description} và string
      const permissionKey = permission?.key || permission;
      const permissionDesc = permission?.description || permissionKey;
      const hasPermission = await userRepository.hasPermission(req.user.id, permissionKey);
      
      if (!hasPermission) {
        console.log("Bạn không có quyền : ", permissionKey)
        throw new AuthorizationError(`Bạn không có quyền: ${permissionDesc}`);
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

      // Hỗ trợ cả object {key, description} và string
      const permissionKeys = permissions.map(p => p?.key || p);
      const permissionDescs = permissions.map(p => p?.description || p?.key || p);
      const hasAnyPermission = await userRepository.hasAnyPermission(req.user.id, permissionKeys);
      
      if (!hasAnyPermission) {
        console.log("Bạn không có quyền : ", permissionKeys)
        throw new AuthorizationError(`Bạn cần ít nhất một trong các quyền sau: ${permissionDescs.join(', ')}`);
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

      // Hỗ trợ cả object {key, description} và string
      const permissionKeys = permissions.map(p => p?.key || p);
      const permissionDescs = permissions.map(p => p?.description || p?.key || p);
      const hasAllPermissions = await userRepository.hasAllPermissions(req.user.id, permissionKeys);
      
      if (!hasAllPermissions) {
        throw new AuthorizationError(`Bạn cần tất cả các quyền sau: ${permissionDescs.join(', ')}`);
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

      // Hỗ trợ cả object {key, description} và string
      const permissionKey = permission?.key || permission;
      const permissionDesc = permission?.description || permissionKey;
      const hasPermission = await userRepository.hasPermission(req.user.id, permissionKey);
      if (hasPermission) {
        return next();
      }

      // Nếu không có permission, check ownership
      const resourceOwnerId = await getResourceOwnerId(req);
      if (resourceOwnerId === req.user.id) {
        return next();
      }

      throw new AuthorizationError(`Bạn không có quyền: ${permissionDesc} và không phải chủ sở hữu resource này`);
    } catch (error) {
      next(error);
    }
  };
};

// Helper function để check admin role
export const requireAdmin = (req, res, next) => {
  return requirePermission(PERMISSIONS.SYSTEM.MANAGE_PERMISSIONS.key)(req, res, next);
};

// Middleware kiểm tra user có quyền manage store cụ thể không
export const requireStoreAccess = (getStoreId) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new AuthenticationError('User chưa được xác thực');
      }

      const storeId = await getStoreId(req);
      
      if (!storeId) {
        throw new AuthorizationError('Store ID không tìm thấy');
      }

      // Admin hoặc user có permission store:manager_all thì có thể access tất cả stores
      const hasManagerAllPermission = await userRepository.hasPermission(req.user.id, PERMISSIONS.STORES.MANAGER_ALL.key);
      if (hasManagerAllPermission) {
        req.storeId = storeId;
        return next();
      }

      // Hoặc check user có quản lý store đó không (store:manager + trong danh sách UserStore)
      const canManage = await userRepository.canManageStore(req.user.id, storeId);
      if (!canManage) {
        throw new AuthorizationError(`Bạn không có quyền truy cập cửa hàng này`);
      }

      req.storeId = storeId;
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Helper function để lấy stores mà user manage
export const getUserManagedStores = async (userId) => {
  return await userRepository.getUserStores(userId);
};

// ===== Simplified Store Access Middlewares =====

// Lấy storeId từ params
export const requireStoreAccessFromParams = requireStoreAccess(req => Promise.resolve(parseInt(req.params.storeId)));

// Lấy storeId từ body
export const requireStoreAccessFromBody = requireStoreAccess(req => Promise.resolve(parseInt(req.body.storeId)));

// Lấy storeId từ query
export const requireStoreAccessFromQuery = requireStoreAccess(req => Promise.resolve(parseInt(req.query.storeId)));

// ===== Warehouse Access Middleware =====

// Middleware kiểm tra user có quyền manage warehouse cụ thể không
export const requireWarehouseAccess = (getWarehouseId) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new AuthenticationError('User chưa được xác thực');
      }

      const warehouseId = await getWarehouseId(req);
      
      if (!warehouseId) {
        throw new AuthorizationError('Warehouse ID không tìm thấy');
      }

      // User có permission warehouse:manager_all thì có thể access tất cả warehouses
      const hasManagerAllPermission = await userRepository.hasPermission(req.user.id, PERMISSIONS.WAREHOUSES_MANAGER.MANAGER_ALL.key);
      if (hasManagerAllPermission) {
        req.warehouseId = warehouseId;
        return next();
      }

      // Hoặc check user có quản lý warehouse đó không (warehouse:manager + trong danh sách WarehouseManage)
      const canManage = await userRepository.canManageWarehouse(req.user.id, warehouseId);
      if (!canManage) {
        throw new AuthorizationError(`Bạn không có quyền truy cập kho này`);
      }

      req.warehouseId = warehouseId;
      next();
    } catch (error) {
      next(error);
    }
  };
};

// ===== Simplified Warehouse Access Middlewares =====

// Lấy warehouseId từ params
export const requireWarehouseAccessFromParams = requireWarehouseAccess(req => Promise.resolve(parseInt(req.params.warehouseId)));

// Lấy warehouseId từ body
export const requireWarehouseAccessFromBody = requireWarehouseAccess(req => Promise.resolve(parseInt(req.body.warehouseId)));

// Lấy warehouseId từ query
export const requireWarehouseAccessFromQuery = requireWarehouseAccess(req => Promise.resolve(parseInt(req.query.warehouseId)));

// Middleware: nếu query chứa warehouseId -> kiểm tra access cho warehouse đó
// Ngược lại, chỉ cho phép truy cập nếu user có quyền quản lý tất cả kho (WAREHOUSES_MANAGER.MANAGER_ALL)
export const requireWarehouseAccessForQuery = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new AuthenticationError('User chưa được xác thực');
    }

    const warehouseId = req.query?.warehouseId ? parseInt(req.query.warehouseId) : null;

    if (warehouseId) {
      // Delegate to existing middleware which will also set req.warehouseId
      return requireWarehouseAccessFromQuery(req, res, next);
    }

    // Nếu không truyền warehouseId, chỉ cho phép user có MANAGER_ALL
    const hasManagerAllPermission = await userRepository.hasPermission(req.user.id, PERMISSIONS.WAREHOUSES_MANAGER.MANAGER_ALL.key);
    if (!hasManagerAllPermission) {
      throw new AuthorizationError('Bạn cần quyền quản lý tất cả kho để thực hiện thao tác này');
    }

    next();
  } catch (error) {
    next(error);
  }
};