import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export { 
  authenticateToken,
  requirePermission,
  requireAnyPermission, 
  requireAllPermissions,
  requireOwnershipOrPermission,
  requireAdmin
} from './permission.middleware.js';

export const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { role: true }
      });
      req.user = user;
    } catch (error) {
      // Token không hợp lệ, nhưng không trả về lỗi
    }
  }
  
  next();
};