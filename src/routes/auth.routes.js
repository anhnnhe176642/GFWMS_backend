import express from 'express';
import { register, login, getProfile, updateProfile, changePassword } from '../controllers/auth.controller.js';
import { authenticateToken, requirePermission } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validation.middleware.js';
import { registerSchema, loginSchema, updateProfileSchema, changePasswordSchema } from '../validations/auth.validation.js';
import { PERMISSIONS } from '../constants/permissions.js';

const router = express.Router();

// Public routes
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);

// Protected routes - cần authentication
router.get('/profile', 
  authenticateToken, 
  requirePermission(PERMISSIONS.USERS.VIEW_OWN_PROFILE),
  getProfile
);

router.put('/profile', 
  authenticateToken, 
  requirePermission(PERMISSIONS.USERS.UPDATE_OWN_PROFILE),
  validate(updateProfileSchema), 
  updateProfile
);

router.put('/change-password', 
  authenticateToken, 
  requirePermission(PERMISSIONS.USERS.UPDATE_OWN_PROFILE),
  validate(changePasswordSchema), 
  changePassword
);

export default router;