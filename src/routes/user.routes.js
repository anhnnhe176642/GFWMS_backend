import express from 'express';
import { getAllUsers, createUser, getUserById, updateUserStatus, updateUserRole, deleteUser } from '../controllers/user.controller.js';
import { authenticateToken, requirePermission, requireOwnershipOrPermission } from '../middlewares/auth.middleware.js';
import { validate, validateMultiple } from '../middlewares/validation.middleware.js';
import { createUserSchema, updateUserStatusSchema, updateUserRoleSchema, uuidParamSchema, paginationQuerySchema, userQuerySchema } from '../validations/user.validation.js';
import { PERMISSIONS } from '../constants/permissions.js';

const router = express.Router();

// Tất cả routes user đều cần xác thực
router.use(authenticateToken);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users with advanced filtering
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search keyword
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *         example: ACTIVE,INACTIVE
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: Filter by role
 *         example: admin,manager
 *       - in: query
 *         name: gender
 *         schema:
 *           type: string
 *         description: Filter by gender
 *         example: MALE,FEMALE
 *       - in: query
 *         name: createdFrom
 *         schema:
 *           type: string
 *         description: Filter users created from this date
 *         example: "2024-01-01"
 *       - in: query
 *         name: createdTo
 *         schema:
 *           type: string
 *         description: Filter users created until this date
 *         example: "2025-12-31"
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Field(s) to sort by
 *         example: createdAt,username
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *         description: Sort order
 *         example: desc
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - message
 *                 - data
 *                 - pagination
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Lấy danh sách users thành công
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *             example:
 *               message: Lấy danh sách users thành công
 *               data:
 *                 - id: "123e4567-e89b-12d3-a456-426614174000"
 *                   username: "johndoe123"
 *                   email: "john@example.com"
 *                   fullname: "John Doe"
 *                   phone: "+84123456789"
 *                   role: "employee"
 *                   status: "ACTIVE"
 *                   gender: "MALE"
 *                   dob: "1990-01-01"
 *                   address: "123 Main St"
 *                   avatar: null
 *                   createdAt: "2024-10-01T10:00:00.000Z"
 *                   updatedAt: "2024-10-01T10:00:00.000Z"
 *               pagination:
 *                 page: 1
 *                 limit: 10
 *                 total: 50
 *                 totalPages: 5
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/', 
  requirePermission(PERMISSIONS.USERS.VIEW_LIST),
  validate(userQuerySchema, 'query'), 
  getAllUsers
);

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
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
 *                 description: Email address (lowercase)
 *                 example: user@example.com
 *               phone:
 *                 type: string
 *                 description: Phone number
 *                 example: "+84123456789"
 *               fullname:
 *                 type: string
 *                 description: Full name
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
 *               role:
 *                 type: string
 *                 description: Role name
 *                 example: employee
 *               status:
 *                 type: string
 *                 description: User status (ACTIVE, INACTIVE, SUSPENDED)
 *                 example: ACTIVE
 *               avatar:
 *                 type: string
 *                 description: Avatar URL
 *                 example: "https://example.com/avatar.jpg"
 *     responses:
 *       201:
 *         description: User created successfully
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
 *                   example: Tạo user thành công
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       409:
 *         $ref: '#/components/responses/ConflictError'
 */
router.post('/', 
  requirePermission(PERMISSIONS.USERS.CREATE),
  validate(createUserSchema), 
  createUser
);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User retrieved successfully
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
 *                   example: Lấy thông tin user thành công
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid UUID format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *             example:
 *               message: Dữ liệu không hợp lệ
 *               errors:
 *                 - field: id
 *                   message: ID phải là UUID hợp lệ
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id', 
  requireOwnershipOrPermission(
    PERMISSIONS.USERS.VIEW_DETAIL, 
    (req) => req.params.id // Check if user is accessing their own profile
  ),
  validate(uuidParamSchema, 'params'), 
  getUserById
);

/**
 * @swagger
 * /users/{id}/status:
 *   patch:
 *     summary: Update user status
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 description: User status (ACTIVE, INACTIVE, SUSPENDED)
 *     responses:
 *       200:
 *         description: User status updated successfully
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
 *                   example: Cập nhật trạng thái user thành công
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
router.patch('/:id/status', 
  requirePermission(PERMISSIONS.USERS.CHANGE_STATUS),
  validateMultiple([
    { schema: uuidParamSchema, source: 'params' },
    { schema: updateUserStatusSchema, source: 'body' }
  ]), 
  updateUserStatus
);

/**
 * @swagger
 * /users/{id}/role:
 *   patch:
 *     summary: Update user role (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 description: Role name
 *                 example: manager
 *     responses:
 *       200:
 *         description: User role updated successfully
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
 *                   example: Cập nhật role user thành công
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
router.patch('/:id/role', 
  requirePermission(PERMISSIONS.USERS.MANAGE_ROLES),
  validateMultiple([
    { schema: uuidParamSchema, source: 'params' },
    { schema: updateUserRoleSchema, source: 'body' }
  ]), 
  updateUserRole
);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully (soft delete)
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
 *                   example: Xóa user thành công (soft delete)
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error or user already deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               invalidUuid:
 *                 summary: Invalid UUID
 *                 value:
 *                   message: Dữ liệu không hợp lệ
 *                   errors:
 *                     - field: id
 *                       message: ID phải là UUID hợp lệ
 *               alreadyDeleted:
 *                 summary: User already deleted
 *                 value:
 *                   message: User đã bị xóa trước đó
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/:id', 
  requirePermission(PERMISSIONS.USERS.DELETE),
  validate(uuidParamSchema, 'params'), 
  deleteUser
);

export default router;
