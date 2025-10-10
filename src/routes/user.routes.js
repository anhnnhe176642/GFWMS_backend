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
 *           minimum: 1
 *           default: 1
 *         description: Page number (min 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Items per page (max 100)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           maxLength: 100
 *         description: Search keyword (max 100 chars)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status. Single value (ACTIVE) or multiple comma-separated (ACTIVE,INACTIVE,SUSPENDED)
 *         example: ACTIVE,INACTIVE
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: Filter by role. Single value or multiple comma-separated (admin,manager,employee)
 *         example: admin,manager
 *       - in: query
 *         name: gender
 *         schema:
 *           type: string
 *         description: Filter by gender. Single value or multiple comma-separated (MALE,FEMALE,OTHER)
 *         example: MALE,FEMALE
 *       - in: query
 *         name: createdFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter users created from this date (ISO 8601 format)
 *         example: "2024-01-01"
 *       - in: query
 *         name: createdTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter users created until this date (must be >= createdFrom)
 *         example: "2024-12-31"
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           pattern: '^[a-zA-Z_]+(,[a-zA-Z_]+)*$'
 *         description: Field(s) to sort by. Single field or comma-separated (field1,field2)
 *         example: created_at,username
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order. Can be comma-separated for multiple fields (asc,desc)
 *         example: desc
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
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
 *             required:
 *               - username
 *               - password
 *               - email
 *               - phone
 *               - role
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
 *                 description: Valid email (lowercase)
 *                 example: user@example.com
 *               phone:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 15
 *                 pattern: '^[0-9+\-\s()]+$'
 *                 example: "+84123456789"
 *               fullname:
 *                 type: string
 *                 maxLength: 100
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
 *                 nullable: true
 *                 description: Date of birth (not in future)
 *                 example: "1990-01-01"
 *               role:
 *                 type: string
 *                 maxLength: 50
 *                 description: Role name
 *                 example: employee
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE, SUSPENDED]
 *                 description: User status (optional)
 *                 example: ACTIVE
 *               avatar:
 *                 type: string
 *                 nullable: true
 *                 example: "https://example.com/avatar.jpg"
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       409:
 *         description: Username or email already exists
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
 *           format: uuid
 *         description: User ID
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
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
 *           format: uuid
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE, SUSPENDED]
 *     responses:
 *       200:
 *         description: User status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
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
 *           format: uuid
 *         description: Valid UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 maxLength: 50
 *                 description: Role name
 *                 example: manager
 *     responses:
 *       200:
 *         description: User role updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
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
 *           format: uuid
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User deleted successfully
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
