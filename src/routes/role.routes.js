import express from 'express';
import { getAllRoles, createRole, getRoleByName, updateRole, deleteRole } from '../controllers/role.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/permission.middleware.js';
import { PERMISSIONS } from '../constants/permissions.js';
import { validate } from '../middlewares/validation.middleware.js';
import { createRoleSchema, updateRoleSchema, roleNameParamSchema } from '../validations/role.validation.js';

const router = express.Router();

// Tất cả routes yêu cầu authentication
router.use(authenticateToken);

// GET /roles
router.get('/', 
  requirePermission(PERMISSIONS.ROLES.VIEW),
  getAllRoles
);

// POST /roles
router.post('/', 
  requirePermission(PERMISSIONS.ROLES.CREATE),
  validate(
    { schema: createRoleSchema, source: 'body' }
  ),
  createRole
);

// GET /roles/:name
router.get('/:name', 
  requirePermission(PERMISSIONS.ROLES.VIEW),
  validate(
    { schema: roleNameParamSchema, source: 'params' }
  ),
  getRoleByName
);

// PUT /roles/:name 
router.put('/:name', 
  requirePermission(PERMISSIONS.ROLES.UPDATE),
  validate(
    { schema: roleNameParamSchema, source: 'params' },
    { schema: updateRoleSchema, source: 'body' }
  ),
  updateRole
);

// DELETE /roles/:name 
router.delete('/:name', 
  requirePermission(PERMISSIONS.ROLES.DELETE),
  validate(
    { schema: roleNameParamSchema, source: 'params' }
  ),
  deleteRole
);

export default router;