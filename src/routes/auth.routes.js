import express from 'express';
import { register, login, getProfile, updateProfile, changePassword } from '../controllers/auth.controller.js';
import { authenticateToken, requirePermission } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validation.middleware.js';
import { registerSchema, loginSchema, updateProfileSchema, changePasswordSchema } from '../validations/auth.validation.js';
import { PERMISSIONS } from '../constants/permissions.js';

const router = express.Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - email
 *               - phone
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 50
 *                 pattern: '^[a-zA-Z0-9]+$'
 *                 description: Alphanumeric only, 3-50 characters
 *                 example: johndoe123
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 maxLength: 255
 *                 example: password123
 *               email:
 *                 type: string
 *                 format: email
 *                 maxLength: 100
 *                 description: Valid email address, will be converted to lowercase
 *                 example: user@example.com
 *               phone:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 15
 *                 pattern: '^[0-9+\-\s()]+$'
 *                 description: Phone number with digits, +, -, spaces, or parentheses
 *                 example: "+84123456789"
 *               fullname:
 *                 type: string
 *                 maxLength: 100
 *                 description: Full name (optional)
 *                 example: John Doe
 *               gender:
 *                 type: string
 *                 enum: [MALE, FEMALE, OTHER]
 *                 nullable: true
 *                 example: MALE
 *               address:
 *                 type: string
 *                 maxLength: 255
 *                 example: "123 Main St, City"
 *               dob:
 *                 type: string
 *                 format: date
 *                 description: Date of birth (must not be in the future)
 *                 nullable: true
 *                 example: "1990-01-01"
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - message
 *                 - user
 *                 - token
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Đăng ký thành công
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *                   description: JWT authentication token
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTY3OC05MGFiLWNkZWYtMTIzNC01Njc4OTBhYmNkZWYiLCJ1c2VybmFtZSI6ImpvaG5kb2UxMjMiLCJpYXQiOjE2OTg2NjY2NjYsImV4cCI6MTY5ODc1MzA2Nn0.example_signature
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         $ref: '#/components/responses/ConflictError'
 */
router.post('/register', validate(registerSchema), register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user with username or email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - usernameOrEmail
 *               - password
 *             properties:
 *               usernameOrEmail:
 *                 type: string
 *                 description: Username or email address (trimmed automatically)
 *                 example: admin
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 maxLength: 255
 *                 example: admin123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - message
 *                 - user
 *                 - token
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Đăng nhập thành công
 *                 token:
 *                   type: string
 *                   description: JWT authentication token (expires in 24h)
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTY3OC05MGFiLWNkZWYtMTIzNC01Njc4OTBhYmNkZWYiLCJ1c2VybmFtZSI6ImpvaG5kb2UxMjMiLCJpYXQiOjE2OTg2NjY2NjYsImV4cCI6MTY5ODc1MzA2Nn0.example_signature
 *                 user:
 *                   allOf:
 *                     - $ref: '#/components/schemas/User'
 *                     - type: object
 *                       properties:
 *                         permissionKeys:
 *                           type: array
 *                           items:
 *                             type: string
 *                           description: Array of user permission keys
 *                           example: ["users:view_list", "users:view_detail"]
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Invalid credentials or account inactive
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               invalidCredentials:
 *                 summary: Invalid username/email or password
 *                 value:
 *                   message: Username hoặc password không đúng
 *               inactiveAccount:
 *                 summary: Account not activated
 *                 value:
 *                   message: Tài khoản chưa được kích hoạt
 */
router.post('/login', validate(loginSchema), login);

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - message
 *                 - user
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Lấy thông tin profile thành công
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/profile', 
  authenticateToken, 
  requirePermission(PERMISSIONS.USERS.VIEW_OWN_PROFILE),
  getProfile
);

/**
 * @swagger
 * /auth/profile:
 *   put:
 *     summary: Update current user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullname:
 *                 type: string
 *                 maxLength: 100
 *                 description: Full name (optional)
 *                 example: John Doe
 *               phone:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 15
 *                 pattern: '^[0-9+\-\s()]+$'
 *                 description: Phone number
 *                 example: "+84123456789"
 *               dob:
 *                 type: string
 *                 format: date
 *                 description: Date of birth (must not be in the future)
 *                 nullable: true
 *                 example: "1990-01-01"
 *               gender:
 *                 type: string
 *                 enum: [MALE, FEMALE, OTHER]
 *                 nullable: true
 *                 example: MALE
 *               address:
 *                 type: string
 *                 maxLength: 255
 *                 example: "123 Main St, City"
 *               avatar:
 *                 type: string
 *                 nullable: true
 *                 description: Avatar URL
 *                 example: "https://example.com/avatar.jpg"
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - message
 *                 - user
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Cập nhật profile thành công
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put('/profile', 
  authenticateToken, 
  requirePermission(PERMISSIONS.USERS.UPDATE_OWN_PROFILE),
  validate(updateProfileSchema), 
  updateProfile
);

/**
 * @swagger
 * /auth/change-password:
 *   put:
 *     summary: Change password
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 maxLength: 255
 *                 description: Current password
 *                 example: oldpassword123
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 maxLength: 255
 *                 description: New password (6-255 characters)
 *                 example: newpassword123
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - message
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Đổi password thành công
 *       400:
 *         description: Validation error or password mismatch
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *             examples:
 *               validationError:
 *                 summary: Validation error
 *                 value:
 *                   message: Dữ liệu không hợp lệ
 *                   errors:
 *                     - field: currentPassword
 *                       message: Password hiện tại là bắt buộc
 *               incorrectPassword:
 *                 summary: Current password incorrect
 *                 value:
 *                   message: Dữ liệu không hợp lệ
 *                   errors:
 *                     - field: currentPassword
 *                       message: Password hiện tại không đúng
 *               samePassword:
 *                 summary: New password same as current
 *                 value:
 *                   message: Dữ liệu không hợp lệ
 *                   errors:
 *                     - field: newPassword
 *                       message: Password mới phải khác password hiện tại
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put('/change-password', 
  authenticateToken, 
  requirePermission(PERMISSIONS.USERS.UPDATE_OWN_PROFILE),
  validate(changePasswordSchema), 
  changePassword
);

export default router;