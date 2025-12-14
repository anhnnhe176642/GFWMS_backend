import express from 'express';
import {
  getAllFabricCustomers,
  getFabricCustomerDetail,
  getFilterOptions,
  getGroupedFabricCustomers
} from '../../controllers/fabricCustomer.controller.js';
import { optionalAuth } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validation.middleware.js';
import {
  fabricCustomerQuerySchema,
  fabricCustomerIdParamSchema,
  filterOptionsQuerySchema,
  groupedDataQuerySchema
} from '../../validations/fabricCustomer.validation.js';

const router = express.Router();

// Optional authentication for customer viewing
router.use(optionalAuth);

/**
 * @swagger
 * /fabric-customers/filter-options:
 *   get:
 *     summary: Get available filter options for fabric customers
 *     description: |
 *       Lấy các tùy chọn lọc có sẵn dựa trên các bộ lọc đã áp dụng.
 *       Ví dụ: Nếu bạn áp dụng categoryId=1, API sẽ trả về các màu, độ bóng, v.v.
 *       có sẵn trong danh mục đó.
 *       Bạn có thể áp dụng nhiều filters cùng lúc: ?categoryId=1&colorId=red&glossId=2
 *     tags: [Fabric Customers]
 *     parameters:
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: colorId
 *         schema:
 *           type: string
 *       - in: query
 *         name: glossId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: thickness
 *         schema:
 *           type: number
 *       - in: query
 *         name: width
 *         schema:
 *           type: number
 *       - in: query
 *         name: length
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Available filter options
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
 *                     categories:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                           count:
 *                             type: integer
 *                           totalUncut:
 *                             type: integer
 *                           totalMeters:
 *                             type: number
 *                     colors:
 *                       type: array
 *                     glosses:
 *                       type: array
 *                     thicknesses:
 *                       type: array
 *                     widths:
 *                       type: array
 *                     lengths:
 *                       type: array
 */
router.get('/filter-options', 
  validate(filterOptionsQuerySchema, 'query'),
  getFilterOptions
);

/**
 * @swagger
 * /fabric-customers/grouped:
 *   get:
 *     summary: Get fabric customers grouped by applied filters
 *     description: |
 *       Lấy dữ liệu vải khách hàng được nhóm theo các bộ lọc đã áp dụng.
 *       Ví dụ: Nếu bạn áp dụng categoryId=1, dữ liệu sẽ được nhóm theo colorId.
 *       Hỗ trợ lọc nhiều fields cùng lúc: ?categoryId=1&colorId=red&glossId=2
 *     tags: [Fabric Customers]
 *     parameters:
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: colorId
 *         schema:
 *           type: string
 *       - in: query
 *         name: glossId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: thickness
 *         schema:
 *           type: number
 *       - in: query
 *         name: width
 *         schema:
 *           type: number
 *       - in: query
 *         name: length
 *         schema:
 *           type: number
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *         description: Fields to group by (comma-separated, e.g., "categoryId,colorId")
 *     responses:
 *       200:
 *         description: Grouped fabric customers
 */
router.get('/grouped', 
  validate(groupedDataQuerySchema, 'query'),
  getGroupedFabricCustomers
);

/**
 * @swagger
 * /fabric-customers:
 *   get:
 *     summary: Get all fabric customers with advanced filtering, sorting, and pagination
 *     description: |
 *       Lấy danh sách vải khách hàng với các tùy chọn lọc nâng cao.
 *       Hỗ trợ lọc nhiều fields cùng lúc: ?categoryId=1&colorId=red&glossId=2&thickness=1.5
 *       
 *       API sẽ trả về:
 *       - Danh sách vải khách hàng phù hợp với tất cả filters
 *       - Các tùy chọn lọc khả dụng cho các fields khác (chỉ những giá trị có sẵn)
 *       - Dữ liệu được nhóm lại theo các bộ lọc
 *     tags: [Fabric Customers]
 *     parameters:
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *         description: Filter by category ID
 *       - in: query
 *         name: colorId
 *         schema:
 *           type: string
 *         description: Filter by color ID
 *       - in: query
 *         name: glossId
 *         schema:
 *           type: integer
 *         description: Filter by gloss ID
 *       - in: query
 *         name: thickness
 *         schema:
 *           type: number
 *         description: Filter by thickness
 *       - in: query
 *         name: width
 *         schema:
 *           type: number
 *         description: Filter by width
 *       - in: query
 *         name: length
 *         schema:
 *           type: number
 *         description: Filter by length
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by category name or color name
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Sort field (e.g., "createdAt", "-createdAt" for descending)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Records per page
 *     responses:
 *       200:
 *         description: Successfully retrieved fabric customers with filter options
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - message
 *                 - data
 *                 - pagination
 *                 - filters
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Lấy danh sách vải khách hàng thành công
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       thickness:
 *                         type: number
 *                       glossId:
 *                         type: integer
 *                       gloss:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           description:
 *                             type: string
 *                       width:
 *                         type: number
 *                       length:
 *                         type: number
 *                       categoryId:
 *                         type: integer
 *                       category:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                       colorId:
 *                         type: string
 *                       color:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           hexCode:
 *                             type: string
 *                       totalUncut:
 *                         type: integer
 *                         description: Tổng số lượng cuộn chưa cắt
 *                       totalCuttingMeters:
 *                         type: number
 *                         description: Tổng số mét còn lại sau khi cắt dở
 *                       fabricCustomerStores:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             storeId:
 *                               type: integer
 *                             store:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: integer
 *                                 name:
 *                                   type: string
 *                             uncutRolls:
 *                               type: integer
 *                             cuttingRollMeters:
 *                               type: number
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     hasNext:
 *                       type: boolean
 *                     hasPrev:
 *                       type: boolean
 *                 filters:
 *                   type: object
 *                   description: Available filter options based on applied filters (only shows available values)
 *                   properties:
 *                     categories:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                           count:
 *                             type: integer
 *                           totalUncut:
 *                             type: integer
 *                           totalMeters:
 *                             type: number
 *                     colors:
 *                       type: array
 *                     glosses:
 *                       type: array
 *                     thicknesses:
 *                       type: array
 *                     widths:
 *                       type: array
 *                     lengths:
 *                       type: array
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.get('/', 
  validate(fabricCustomerQuerySchema, 'query'),
  getAllFabricCustomers
);

/**
 * @swagger
 * /fabric-customers/{fabricCustomerId}:
 *   get:
 *     summary: Get fabric customer detail
 *     tags: [Fabric Customers]
 *     parameters:
 *       - in: path
 *         name: fabricCustomerId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Fabric Customer ID
 *     responses:
 *       200:
 *         description: Fabric customer detail
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       404:
 *         description: Fabric customer not found
 */
router.get('/:fabricCustomerId', 
  validate(fabricCustomerIdParamSchema, 'params'),
  getFabricCustomerDetail
);
export default router;