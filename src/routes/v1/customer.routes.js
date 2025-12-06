import express from 'express';
import { getAllCustomers, getCustomerById, getCustomerOrders, getCustomerOrderStatusSummary } from '../../controllers/customer.controller.js';
import { authenticateToken, requirePermission, requireOwnershipOrPermission } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validation.middleware.js';
import { userQuerySchema, uuidParamSchema } from '../../validations/user.validation.js';
// import { orderQuerySchema } from '../../validations/order.validation.js'; // new
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

// New: Lấy danh sách orders của customer (owner hoặc permission)
router.get('/:id/orders',
  requireOwnershipOrPermission(
    PERMISSIONS.CUSTOMERS.VIEW_DETAIL,
    (req) => req.params.id
  ),
  // validate(orderQuerySchema, 'query'),
  getCustomerOrders
);

// New: Lấy summary số lượng orders theo trạng thái cho customer
router.get('/:id/orders/status',
  requireOwnershipOrPermission(
    PERMISSIONS.CUSTOMERS.VIEW_DETAIL,
    (req) => req.params.id
  ),
  validate(uuidParamSchema, 'params'),
  getCustomerOrderStatusSummary
);

export default router;