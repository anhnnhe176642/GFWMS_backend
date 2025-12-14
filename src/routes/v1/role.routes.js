import express from 'express';
import { getAllRoles, createRole, getRoleByName, deleteRole, updateRole, generateUniqueName } from '../../controllers/role.controller.js';
import { 
  assignStoreToUser, 
  removeStoreFromUser, 
  getUserStores, 
  getStoreManagers, 
  assignMultipleStoresToUser,
  removeAllStoresFromUser 
} from '../../controllers/userStore.controller.js';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
import { requirePermission } from '../../middlewares/permission.middleware.js';
import { PERMISSIONS } from '../../constants/permissions.js';
import { validate } from '../../middlewares/validation.middleware.js';
import { createRoleSchema, roleNameParamSchema, roleQuerySchema, updateRoleSchema } from '../../validations/role.validation.js';
import { 
  assignStoreSchema, 
  removeStoreSchema, 
  assignMultipleStoresSchema,
  userIdParamSchema,
  storeIdParamSchema 
} from '../../validations/userStore.validation.js';

const router = express.Router();

// Tất cả routes yêu cầu authentication
router.use(authenticateToken);

/**
 * @swagger
 * /roles:
 *   get:
 *     summary: Get all roles with pagination and search
 *     tags: [Roles]
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
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Field(s) to sort by
 *         example: name
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Roles retrieved successfully
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
 *                   example: Lấy danh sách roles thành công
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Role'
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
  requirePermission(PERMISSIONS.ROLES.VIEW_LIST),
  validate(roleQuerySchema, 'query'),
  getAllRoles
);

/**
 * @swagger
 * /roles:
 *   post:
 *     summary: Create a new role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Role name
 *                 example: MANAGER
 *               fullName:
 *                 type: string
 *                 description: Role full name (unique)
 *                 example: Quản lý kho
 *               description:
 *                 type: string
 *                 description: Role description
 *                 example: Người quản lý kho hàng và bán hàng.
 *                 maxLength: 255
 *               permissions:
 *                 type: array
 *                 description: Array of permission IDs to assign to role
 *                 items:
 *                   type: integer
 *                 example: [1, 2, 3, 4, 5]
 *     responses:
 *       201:
 *         description: Role created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - message
 *                 - data
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Tạo role thành công
 *                 data:
 *                   $ref: '#/components/schemas/Role'
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
  requirePermission(PERMISSIONS.ROLES.CREATE),
  validate(createRoleSchema, 'body'),
  createRole
);

/**
 * @swagger
 * /roles/generate-name:
 *   post:
 *     summary: Generate unique role name based on input
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - input
 *             properties:
 *               input:
 *                 type: string
 *                 description: Input string to generate role name from (e.g., "Manager Store", "Quản Lý Kho")
 *                 example: Manager Store
 *     responses:
 *       200:
 *         description: Unique role name generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - message
 *                 - data
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Tạo tên role duy nhất thành công
 *                 data:
 *                   type: object
 *                   required:
 *                     - name
 *                     - suggestion
 *                   properties:
 *                     name:
 *                       type: string
 *                       description: Generated unique role name
 *                       example: manager_store
 *                     suggestion:
 *                       type: string
 *                       description: Suggested name (same as name)
 *                       example: manager_store
 *                     baseName:
 *                       type: string
 *                       description: Original processed input
 *                       example: manager_store
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 errors:
 *                   type: array
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/generate-name',
  requirePermission(PERMISSIONS.ROLES.CREATE),
  generateUniqueName
);

/**
 * @swagger
 * /roles/{name}:
 *   get:
 *     summary: Get role by name
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Role name
 *         example: manager
 *     responses:
 *       200:
 *         description: Role retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - message
 *                 - data
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Lấy thông tin role thành công
 *                 data:
 *                   $ref: '#/components/schemas/Role'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:name', 
  requirePermission(PERMISSIONS.ROLES.VIEW_DETAIL),
  validate(roleNameParamSchema, 'params'),
  getRoleByName
);

/**
 * @swagger
 * /roles/{name}:
 *   delete:
 *     summary: Delete role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Role name to delete
 *         example: manager
 *     responses:
 *       200:
 *         description: Role deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - message
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Xóa role thành công
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       409:
 *         description: Cannot delete role with assigned users or foreign key constraint
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               hasUsers:
 *                 summary: Role has assigned users
 *                 value:
 *                   message: Không thể xóa role có users đang sử dụng
 *               foreignKey:
 *                 summary: Foreign key constraint
 *                 value:
 *                   message: Tham chiếu không hợp lệ hoặc không tồn tại
 */
router.delete('/:name', 
  requirePermission(PERMISSIONS.ROLES.DELETE),
  validate(roleNameParamSchema, 'params'),
  deleteRole
);

/**
 * @swagger
 * /roles/{name}:
 *   put:
 *     summary: Update role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Role name to update
 *         example: ADMIN
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 description: Role full name (unique)
 *                 example: Quản trị viên
 *                 maxLength: 15
 *               description:
 *                 type: string
 *                 description: Role description
 *                 example: Quản trị viên hệ thống
 *                 maxLength: 255
 *               permissions:
 *                 type: array
 *                 description: Array of permission IDs to assign to role
 *                 items:
 *                   type: integer
 *                 example: [1, 2, 3, 4, 5]
 *     responses:
 *       200:
 *         description: Role updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - message
 *                 - data
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Cập nhật role thành công
 *                 data:
 *                   $ref: '#/components/schemas/Role'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       409:
 *         description: Full name already exists for another role or description already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:name', 
  requirePermission(PERMISSIONS.ROLES.UPDATE),
  validate(roleNameParamSchema, 'params'),
  validate(updateRoleSchema, 'body'),
  updateRole
);

// ===== User Store Management Routes =====

/**
 * @swagger
 * /roles/user-stores/assign:
 *   post:
 *     summary: Assign a store to a user
 *     tags: [User Stores]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - storeId
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *                 description: User ID
 *               storeId:
 *                 type: integer
 *                 description: Store ID
 *     responses:
 *       201:
 *         description: Store assigned successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post('/user-stores/assign',
  requirePermission(PERMISSIONS.STORES.MANAGE_MANAGERS),
  validate(assignStoreSchema, 'body'),
  assignStoreToUser
);

/**
 * @swagger
 * /roles/user-stores/assign-multiple:
 *   post:
 *     summary: Assign multiple stores to a user
 *     tags: [User Stores]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - storeIds
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *               storeIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 minItems: 1
 *     responses:
 *       201:
 *         description: Stores assigned successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post('/user-stores/assign-multiple',
  requirePermission(PERMISSIONS.STORES.MANAGE_MANAGERS),
  validate(assignMultipleStoresSchema, 'body'),
  assignMultipleStoresToUser
);

/**
 * @swagger
 * /roles/user-stores/remove:
 *   post:
 *     summary: Remove a store from a user
 *     tags: [User Stores]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - storeId
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *               storeId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Store removed successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post('/user-stores/remove',
  requirePermission(PERMISSIONS.STORES.MANAGE_MANAGERS),
  validate(removeStoreSchema, 'body'),
  removeStoreFromUser
);

/**
 * @swagger
 * /roles/user-stores/{userId}:
 *   get:
 *     summary: Get all stores assigned to a user
 *     tags: [User Stores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     responses:
 *       200:
 *         description: Stores retrieved successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/user-stores/:userId',
  requirePermission(PERMISSIONS.STORES.MANAGE_MANAGERS),
  validate(userIdParamSchema, 'params'),
  getUserStores
);

/**
 * @swagger
 * /roles/store-managers/{storeId}:
 *   get:
 *     summary: Get all managers assigned to a store
 *     tags: [User Stores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Store ID
 *     responses:
 *       200:
 *         description: Managers retrieved successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/store-managers/:storeId',
  requirePermission(PERMISSIONS.STORES.MANAGE_MANAGERS),
  validate(storeIdParamSchema, 'params'),
  getStoreManagers
);

/**
 * @swagger
 * /roles/user-stores/{userId}/remove-all:
 *   delete:
 *     summary: Remove all stores from a user
 *     tags: [User Stores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     responses:
 *       200:
 *         description: All stores removed successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/user-stores/:userId/remove-all',
  requirePermission(PERMISSIONS.STORES.MANAGE_MANAGERS),
  validate(userIdParamSchema, 'params'),
  removeAllStoresFromUser
);

export default router;