import jwt from 'jsonwebtoken';
import process from 'process';
import { userRepository } from '../repositories/user.repository.js';


export { 
  authenticateToken,
  requirePermission,
  requireAnyPermission, 
  requireAllPermissions,
  requireOwnershipOrPermission,
  requireAdmin
} from './permission.middleware.js';

export const optionalAuth = async (req, res, next) => {
  try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Lấy thông tin user cơ bản từ database
      const user = await userRepository.findById(decoded.userId);
      
      // Attach user info vào request 
      req.user = user
      
      next();
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
      // Nếu không có token hoặc token không hợp lệ, tiếp tục mà không gán req.user
      next();
    }
};