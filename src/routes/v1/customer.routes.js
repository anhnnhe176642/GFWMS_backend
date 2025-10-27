import express from 'express';
import { getAllCustomers, getCustomerById } from '../../controllers/customer.controller.js';
import { authenticateToken, requirePermission } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validation.middleware.js';
import { userQuerySchema, uuidParamSchema } from '../../validations/user.validation.js';
import { PERMISSIONS } from '../../constants/permissions.js';

const router = express.Router();

router.use(authenticateToken);

/**
 * @swagger
 * /customers:
 *   get:
 *     summary: Get all customers with advanced filtering
 *     tags: [Customers]
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
 *         description: Search by name, email, phone
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *       - in: query
 *         name: gender
 *         schema:
 *           type: string
 *         description: Filter by gender
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Sort by field(s)
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *         description: Sort order
 */
router.get('/',
  requirePermission(PERMISSIONS.CUSTOMERS.VIEW_LIST),
  validate(userQuerySchema, 'query'),
  getAllCustomers
);

/**
 * @swagger
 * /customers/{id}:
 *   get:
 *     summary: Get customer details by ID
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id',
  requirePermission(PERMISSIONS.CUSTOMERS.VIEW_DETAIL),
  validate(uuidParamSchema, 'params'),
  getCustomerById
);

export default router;