import express from 'express';
import { authenticateToken, requirePermission } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validation.middleware.js';
import { allocateFabricToShelves } from '../../controllers/fabricShelf.controller.js';
import { allocateFabricSchema, fabricIdParamSchema } from '../../validations/fabricShelf.validation.js';
import { PERMISSIONS } from '../../constants/permissions.js';

const router = express.Router();

/**
 * @swagger
 * /fabric-shelf/{fabricId}/allocate-to-shelves:
 *   post:
 *     summary: Phân bổ vải vào các kệ trong kho (chỉ trong cùng một đơn nhập)
 *     description: |
 *       Phân bổ số lượng vải thuộc **một đơn nhập cụ thể (ImportFabric)** vào các kệ trong kho.  
 *       - Chỉ những vải thuộc `importFabricId` này mới được phép phân bổ.  
 *       - Tổng số lượng phân bổ không được vượt quá số lượng của vải trong đơn nhập đó.
 *     tags: [Fabrics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fabricId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID của loại vải cần phân bổ
 *         example: 12
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - importFabricId
 *               - shelves
 *             properties:
 *               importFabricId:
 *                 type: integer
 *                 description: ID của đơn nhập vải (ImportFabric) mà vải này thuộc về
 *                 example: 5
 *               shelves:
 *                 type: array
 *                 description: Danh sách các kệ và số lượng vải tương ứng
 *                 items:
 *                   type: object
 *                   required:
 *                     - shelfId
 *                     - quantity
 *                   properties:
 *                     shelfId:
 *                       type: integer
 *                       example: 7
 *                     quantity:
 *                       type: number
 *                       example: 30
 *           examples:
 *             example-1:
 *               summary: Phân bổ 50m vải trong đơn nhập #5 vào 2 kệ
 *               value:
 *                 importFabricId: 5
 *                 shelves:
 *                   - shelfId: 7
 *                     quantity: 30
 *                   - shelfId: 8
 *                     quantity: 20
 *     responses:
 *       200:
 *         description: Phân bổ vải thành công trong cùng đơn nhập
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Phân bổ vải thành công"
 *                 data:
 *                   type: object
 *                   properties:
 *                     importFabricId:
 *                       type: integer
 *                       example: 5
 *                     fabricId:
 *                       type: integer
 *                       example: 12
 *                     allocatedShelves:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           shelfId:
 *                             type: integer
 *                             example: 7
 *                           quantity:
 *                             type: integer
 *                             example: 30
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc vượt quá số lượng trong đơn nhập
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền
 *       404:
 *         description: Không tìm thấy vải hoặc đơn nhập tương ứng
 */
router.post(
  '/:fabricId/allocate-to-shelves',
  authenticateToken,
  requirePermission(PERMISSIONS.FABRICS.ALLOCATE_TO_SHELF),
  validate(fabricIdParamSchema, 'params'),
  validate(allocateFabricSchema,'body'),
  allocateFabricToShelves
);

export default router;
