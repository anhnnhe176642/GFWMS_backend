import express from 'express';
import {
  getAllStores,
  getStoreById,
  createStore,
  updateStore,
  deleteStore,
  assignStaffToStore,    
  unassignStaffFromStore,
  getStaffsByStore   
} from '../../controllers/store.controller.js';
import { authenticateToken, requirePermission } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validation.middleware.js';
import { 
  createStoreSchema, 
  updateStoreSchema, 
  storeQuerySchema, 
  storeIdSchema,
  assignStaffSchema,   
  unassignStaffSchema,
  storeStaffQuerySchema
} from '../../validations/store.validation.js';
import { PERMISSIONS } from '../../constants/permissions.js';

const router = express.Router();

router.use(authenticateToken);

/**
 * @swagger
 * /stores:
 *   get:
 *     summary: Lấy danh sách cửa hàng với bộ lọc tùy chọn
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: string
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: string
 *         description: Số lượng bản ghi mỗi trang
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm theo tên hoặc địa chỉ
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Trường sắp xếp
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *         description: Thứ tự sắp xếp
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: string
 *         description: Lọc theo trạng thái hoạt động

 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get('/',
  requirePermission(PERMISSIONS.STORES.VIEW_LIST),
  validate(storeQuerySchema, 'query'),
  getAllStores
);

/**
 * @swagger
 * /stores:
 *   post:
 *     summary: Tạo cửa hàng mới
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Tên cửa hàng
 *                 example: "Cửa hàng vải Hà Nội"
 *               address:
 *                 type: string
 *                 description: Địa chỉ cửa hàng
 *                 example: "123 Đường Láng, Hà Nội"
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.post('/',
  requirePermission(PERMISSIONS.STORES.CREATE),
  validate(createStoreSchema, 'body'),
  createStore
);

/**
 * @swagger
 * /stores/{id}:
 *   get:
 *     summary: Lấy thông tin cửa hàng theo ID
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         description: ID cửa hàng
 *         example: "1"
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get('/:id',
  requirePermission(PERMISSIONS.STORES.VIEW_DETAIL),
  validate(storeIdSchema, 'params'),
  getStoreById
);

/**
 * @swagger
 * /stores/{id}:
 *   put:
 *     summary: Cập nhật thông tin cửa hàng
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         description: ID cửa hàng
 *         example: "1"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Cửa hàng vải Cầu Giấy"
 *               address:
 *                 type: string
 *                 example: "456 Trần Duy Hưng, Hà Nội"
 *               isActive:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.put('/:id',
  requirePermission(PERMISSIONS.STORES.UPDATE),
  validate(updateStoreSchema, 'body'),
  validate(storeIdSchema, 'params'),
  updateStore
);

/**
 * @swagger
 * /stores/{id}:
 *   delete:
 *     summary: Xóa cửa hàng
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         description: ID cửa hàng
 *         example: "1"
 *     responses:
 *       200:
 *         description: Xóa thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Xóa cửa hàng thành công"
 *                 data:
 *                   type: object
 *       400:
 *         description: Cửa hàng đang được sử dụng hoặc có ràng buộc dữ liệu
 *       404:
 *         description: Không tìm thấy cửa hàng
 */
router.delete('/:id',
  requirePermission(PERMISSIONS.STORES.DELETE),
  validate(storeIdSchema, 'params'),
  deleteStore
);

/**
 * @swagger
 * /stores/{id}/staffs:
 *   get:
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         description: Store ID
 *         example: "1"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số bản ghi mỗi trang
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo fullname, email hoặc phone
 *         example: "Nguyen Van A"
 *       - in: query
 *         name: gender
 *         schema:
 *           type: string
 *         description: Lọc theo giới tính (MALE,FEMALE).
 *         example: "MALE,FEMALE"
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: Sắp xếp theo trường (fullname, email, phone, role, status)
 *         example: "fullname"
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           default: desc,asc
 *         description: Thứ tự sắp xếp
 *         example: "asc"
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Lấy danh sách nhân viên thành công
 *                 store:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     name:
 *                       type: string
 *                       example: "Cửa hàng Quận 1"
 *                     address:
 *                       type: string
 *                       example: "123 Nguyễn Huệ, Q1"
 *                     isActive:
 *                       type: boolean
 *                       example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "c85fb535-5ccb-45a1-8907-9a8f5a9415d3"
 *                       username:
 *                         type: string
 *                         example: "staff01"
 *                       phone:
 *                         type: string
 *                         example: "0912345678"
 *                       email:
 *                         type: string
 *                         example: "staff01@example.com"
 *                       avatar:
 *                         type: string
 *                         nullable: true
 *                       avatarPublicId:
 *                         type: string
 *                         nullable: true
 *                       gender:
 *                         type: string
 *                         enum: [MALE, FEMALE]
 *                         nullable: true
 *                         example: "MALE"
 *                       address:
 *                         type: string
 *                         nullable: true
 *                         example: "456 Lê Lợi, Q1"
 *                       dob:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                       fullname:
 *                         type: string
 *                         example: "Nguyễn Văn A"
 *                       status:
 *                         type: string
 *                         enum: [ACTIVE, INACTIVE, SUSPENDED]
 *                         example: "ACTIVE"
 *                       role:
 *                         type: string
 *                         example: "STAFF"
 *                       storeId:
 *                         type: integer
 *                         nullable: true
 *                         example: 1
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     total:
 *                       type: integer
 *                       example: 25
 *                     totalPages:
 *                       type: integer
 *                       example: 3
 *       400:
 *         description: Validation error
 *       404:
 *         description: Không tìm thấy cửa hàng
 */
router.get('/:id/staffs',
  requirePermission(PERMISSIONS.STORES. VIEW_STAFF),
  validate(storeIdSchema, 'params'),
  validate(storeStaffQuerySchema, 'query'),
  getStaffsByStore
);

/**
 * @swagger
 * /stores/{id}/assign-staff:
 *   post:
 *     summary: Phân công nhân viên cho cửa hàng
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Store ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               staffIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["user123", "user456"]
 *     responses:
 *       200:
 *         description: Phân công thành công
 */
router.post('/:id/assign-staff',
  requirePermission(PERMISSIONS.STORES. ASSIGN_STAFF),
  validate(storeIdSchema, 'params'),
  validate(assignStaffSchema, 'body'),
  assignStaffToStore
);

/**
 * @swagger
 * /stores/{id}/unassign-staff:
 *   post:
 *     summary: Hủy phân công nhân viên khỏi cửa hàng
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Store ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               staffId:
 *                 type: string
 *                 example: "user123"
 *     responses:
 *       200:
 *         description: Hủy phân công thành công
 */
router.post('/:id/unassign-staff',
  requirePermission(PERMISSIONS.STORES.ASSIGN_STAFF),
  validate(storeIdSchema, 'params'),
  validate(unassignStaffSchema, 'body'),
  unassignStaffFromStore
);

export default  router;
