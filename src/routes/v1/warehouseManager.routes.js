import express from 'express';
import {
  getUserWarehouses,
  getWarehouseManagers,
  checkUserWarehouseAccess,
  assignMultipleWarehousesToUser,
  removeAllWarehousesFromUser
} from '../../controllers/warehouseManager.controller.js';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
import { requirePermission } from '../../middlewares/permission.middleware.js';
import { validate } from '../../middlewares/validation.middleware.js';
import { PERMISSIONS } from '../../constants/permissions.js';
import {
  assignMultiple,
  getUserWarehouses as getUserWarehousesSchema,
  getWarehouseManagers as getWarehouseManagersSchema,
  checkAccess,
  removeAll
} from '../../validations/warehouseManager.validation.js';

const router = express.Router();

// Tất cả routes yêu cầu authentication
router.use(authenticateToken);

/**
 * @swagger
 * /warehouse-managers/user/{userId}:
 *   get:
 *     summary: Get all warehouses assigned to a user
 *     tags: [Warehouse Managers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Warehouses retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       userId:
 *                         type: string
 *                       warehouseId:
 *                         type: integer
 *                       assignedAt:
 *                         type: string
 *                         format: date-time
 *                       warehouse:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                           address:
 *                             type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/user/:userId',
  validate(getUserWarehousesSchema, 'params'),
  getUserWarehouses
);

/**
 * @swagger
 * /warehouse-managers/warehouse/{warehouseId}:
 *   get:
 *     summary: Get all managers of a warehouse
 *     tags: [Warehouse Managers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: warehouseId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Managers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       userId:
 *                         type: string
 *                       user:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           username:
 *                             type: string
 *                           fullname:
 *                             type: string
 *                           email:
 *                             type: string
 *                           phone:
 *                             type: string
 *                           status:
 *                             type: string
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/warehouse/:warehouseId',
  validate(getWarehouseManagersSchema, 'params'),
  getWarehouseManagers
);

/**
 * @swagger
 * /warehouse-managers/check/{userId}/{warehouseId}:
 *   get:
 *     summary: Check if user is assigned to a warehouse
 *     tags: [Warehouse Managers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: warehouseId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Access check completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                     warehouseId:
 *                       type: integer
 *                     hasAccess:
 *                       type: boolean
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/check/:userId/:warehouseId',
  validate(checkAccess, 'params'),
  checkUserWarehouseAccess
);

/**
 * @swagger
 * /warehouse-managers/assign-multiple:
 *   post:
 *     summary: Assign multiple warehouses to a user
 *     tags: [Warehouse Managers]
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
 *               - warehouseIds
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *               warehouseIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 2, 3]
 *     responses:
 *       201:
 *         description: Warehouses assigned successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/assign-multiple',
  requirePermission(PERMISSIONS.WAREHOUSES_MANAGER.MANAGE_MANAGERS),
  validate(assignMultiple, 'body'),
  assignMultipleWarehousesToUser
);

/**
 * @swagger
 * /warehouse-managers/remove-all/{userId}:
 *   delete:
 *     summary: Remove all warehouses from a user
 *     tags: [Warehouse Managers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: All warehouses removed successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.delete('/remove-all/:userId',
  requirePermission(PERMISSIONS.WAREHOUSES_MANAGER.MANAGE_MANAGERS),
  validate(removeAll, 'params'),
  removeAllWarehousesFromUser
);

export default router;
