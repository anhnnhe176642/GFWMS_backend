import express from 'express';
import { getAllUsers, createUser, getUserById, updateUserStatus, updateUserRole, deleteUser } from '../controllers/user.controller.js';
import { authenticateToken, requirePermission, requireOwnershipOrPermission } from '../middlewares/auth.middleware.js';
import { validate, validateMultiple } from '../middlewares/validation.middleware.js';
import { createUserSchema, updateUserStatusSchema, updateUserRoleSchema, uuidParamSchema, paginationQuerySchema } from '../validations/user.validation.js';
import { PERMISSIONS } from '../constants/permissions.js';

const router = express.Router();

// Tất cả routes user đều cần xác thực
router.use(authenticateToken);

// GET /users - Xem danh sách users (cần quyền view_list)
router.get('/', 
  requirePermission(PERMISSIONS.USERS.VIEW_LIST),
  validate(paginationQuerySchema, 'query'), 
  getAllUsers
);

// POST /users - Tạo user mới (cần quyền create)
router.post('/', 
  requirePermission(PERMISSIONS.USERS.CREATE),
  validate(createUserSchema), 
  createUser
);

// GET /users/:id - Xem chi tiết user (cần quyền view_detail hoặc là chính user đó)
router.get('/:id', 
  requireOwnershipOrPermission(
    PERMISSIONS.USERS.VIEW_DETAIL, 
    (req) => req.params.id // Check if user is accessing their own profile
  ),
  validate(uuidParamSchema, 'params'), 
  getUserById
);

// PATCH /users/:id/status - Cập nhật trạng thái user (chỉ admin/manager)
router.patch('/:id/status', 
  requirePermission(PERMISSIONS.USERS.CHANGE_STATUS),
  validateMultiple([
    { schema: uuidParamSchema, source: 'params' },
    { schema: updateUserStatusSchema, source: 'body' }
  ]), 
  updateUserStatus
);

// PATCH /users/:id/role - Cập nhật role user (chỉ admin có quyền manage_roles)
router.patch('/:id/role', 
  requirePermission(PERMISSIONS.USERS.MANAGE_ROLES),
  validateMultiple([
    { schema: uuidParamSchema, source: 'params' },
    { schema: updateUserRoleSchema, source: 'body' }
  ]), 
  updateUserRole
);

// DELETE /users/:id - Xóa user (chỉ admin mới được xóa user)
router.delete('/:id', 
  requirePermission(PERMISSIONS.USERS.DELETE),
  validate(uuidParamSchema, 'params'), 
  deleteUser
);

export default router;
