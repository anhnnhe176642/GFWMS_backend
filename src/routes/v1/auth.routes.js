import express from 'express';
import { register, login, getProfile, updateProfile, changePassword, verifyEmail, resendVerification } from '../../controllers/auth.controller.js';
import { requestPasswordReset, verifyResetPin, setNewPassword } from '../../controllers/auth.controller.js';
import { authenticateToken, requirePermission } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validation.middleware.js';
import { registerSchema, loginSchema, updateProfileSchema, changePasswordSchema, verifyEmailSchema, resendVerificationSchema, requestPasswordResetSchema, verifyResetPinSchema, setNewPasswordSchema } from '../../validations/auth.validation.js';
import { PERMISSIONS } from '../../constants/permissions.js';

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
 *             properties:
 *               username:
 *                 type: string
 *                 description: Username (alphanumeric only)
 *                 example: johndoe123
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Password
 *                 example: password123
 *               email:
 *                 type: string
 *                 description: Email address (will be converted to lowercase)
 *                 example: user@example.com
 *               phone:
 *                 type: string
 *                 description: Phone number
 *                 example: "+84123456789"
 *               fullname:
 *                 type: string
 *                 description: Full name (optional)
 *                 example: John Doe
 *               gender:
 *                 type: string
 *                 description: Gender (MALE, FEMALE, OTHER)
 *                 example: MALE
 *               address:
 *                 type: string
 *                 description: Address
 *                 example: "123 Main St, City"
 *               dob:
 *                 type: string
 *                 description: Date of birth
 *                 example: "1990-01-01"
 *     responses:
 *       201:
 *         description: User registered successfully (verification PIN sent to email)
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
 *                   example: Đăng ký thành công. Mã xác thực đã được gửi tới email của bạn.
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         $ref: '#/components/responses/ConflictError'
 */
router.post('/register', validate(registerSchema), register);

/**
 * @swagger
 * /auth/verify-email:
 *   post:
 *     summary: Verify email using numeric PIN sent to email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               pin:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Email verified and token issued
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *                   description: JWT authentication token (expires in 24h)
 */
router.post('/verify-email', validate(verifyEmailSchema), verifyEmail);

/**
 * @swagger
 * /auth/resend-verification:
 *   post:
 *     summary: Resend verification PIN to user's email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Verification PIN resent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.post('/resend-verification', validate(resendVerificationSchema), resendVerification);

/**
 * @swagger
 * /auth/request-password-reset:
 *   post:
 *     summary: Request a password reset PIN to be sent to user's email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Password reset PIN sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.post('/request-password-reset', validate(requestPasswordResetSchema), requestPasswordReset);


/**
 * @swagger
 * /auth/verify-reset-pin:
 *   post:
 *     summary: Verify password reset PIN
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               pin:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: PIN verified, user can set new password
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.post('/verify-reset-pin', validate(verifyResetPinSchema), verifyResetPin);

/**
 * @swagger
 * /auth/set-new-password:
 *   post:
 *     summary: Set new password after PIN verified
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               pin:
 *                 type: string
 *                 example: "123456"
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: newpassword123
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.post('/set-new-password', validate(setNewPasswordSchema), setNewPassword);

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
 *             properties:
 *               usernameOrEmail:
 *                 type: string
 *                 description: Username or email address
 *                 example: admin
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Password
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
 *                 description: Full name
 *                 example: John Doe
 *               phone:
 *                 type: string
 *                 description: Phone number
 *                 example: "+84123456789"
 *               dob:
 *                 type: string
 *                 description: Date of birth
 *                 example: "1990-01-01"
 *               gender:
 *                 type: string
 *                 description: Gender (MALE, FEMALE, OTHER)
 *                 example: MALE
 *               address:
 *                 type: string
 *                 description: Address
 *                 example: "123 Main St, City"
 *               avatar:
 *                 type: string
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
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *                 description: Current password
 *                 example: oldpassword123
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 description: New password
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