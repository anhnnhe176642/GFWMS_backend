# Hướng dẫn sử dụng Query Parameters

## Tổng quan

Hệ thống hỗ trợ phân trang, tìm kiếm, lọc và sắp xếp thống nhất cho tất cả endpoints.

**Core utilities:**
- `query-builder.js`: Build Prisma queries
- `filter-builder.js`: Parse query params
- `common.validation.js`: Validation schemas

## Query Parameters cơ bản

### Phân trang
```bash
GET /api/users?page=1&limit=10
```
- `page`: Số trang (mặc định: 1)
- `limit`: Items/trang (mặc định: 10, max: 100)

### Tìm kiếm
```bash
GET /api/users?search=john
```
- Không phân biệt hoa thường
- Tìm trên nhiều fields (OR logic)
- Users: `username`, `email`, `fullname`, `phone`
- Roles: `name`

### Sắp xếp
```bash
GET /api/users?sortBy=createdAt&order=desc
GET /api/users?sortBy=status,createdAt&order=asc,desc
```
- `sortBy`: Field(s) để sort (comma-separated)
- `order`: `asc` | `desc` (comma-separated)

## API Endpoints

### GET /api/users
**Auth:** Required | **Permission:** `users.view_list`

**Query Params:**
- `page`, `limit`: Phân trang
- `search`: Tìm kiếm (username, email, fullname, phone)
- `sortBy`, `order`: Sắp xếp
- `status`: ACTIVE, INACTIVE, SUSPENDED (multi-value)
- `role`: Lọc theo role (multi-value)
- `gender`: MALE, FEMALE, OTHER (multi-value)
- `createdFrom`, `createdTo`: Lọc theo ngày

**Examples:**
```bash
GET /api/users?page=1&limit=20
GET /api/users?search=john
GET /api/users?status=ACTIVE,INACTIVE&role=admin
GET /api/users?createdFrom=2025-01-01&createdTo=2025-12-31
GET /api/users?search=nguyen&status=ACTIVE&sortBy=createdAt&order=desc
```

---

### GET /api/roles
**Auth:** Required | **Permission:** `roles.view_list`

**Query Params:**
- `page`, `limit`: Phân trang
- `search`: Tìm theo tên role
- `sortBy`, `order`: Sắp xếp

**Examples:**
```bash
GET /api/roles
GET /api/roles?search=admin&sortBy=name&order=asc
```

---

## Áp dụng cho Module mới

5 bước để thêm query support cho module mới:

### 1. Repository
```javascript
import { buildWhereClause, buildPagination, buildSort, formatPaginatedResponse } from '../utils/query-builder.js';

async findWithAdvancedQuery(queryOptions = {}) {
  const { page = 1, limit = 10, search = '', sortBy = 'createdAt', order = 'desc', filters = {} } = queryOptions;
  
  const searchableFields = ['name', 'code'];
  const where = buildWhereClause({ search, ...filters }, searchableFields);
  const { skip, take } = buildPagination(page, limit);
  const orderBy = buildSort(sortBy, order);

  const [items, total] = await Promise.all([
    prisma.fabric.findMany({ where, skip, take, orderBy }),
    prisma.fabric.count({ where })
  ]);

  return formatPaginatedResponse(items, total, page, take);
}
```

### 2. Validation
```javascript
import { querySchema, createMultiValueFilterSchema } from './common.validation.js';

export const fabricQuerySchema = querySchema.keys({
  status: createMultiValueFilterSchema(Joi.string().valid('AVAILABLE', 'OUT_OF_STOCK'), 'Status'),
  createdFrom: Joi.date().optional(),
  createdTo: Joi.date().optional()
});
```

### 3. Controller
```javascript
import { buildQueryParams } from '../utils/filter-builder.js';

export const getAllFabrics = async (req, res, next) => {
  try {
    const queryParams = buildQueryParams(req.query, {
      filterFields: ['status'],
      dateRangeConfig: { fromField: 'createdFrom', toField: 'createdTo', targetField: 'createdAt' }
    });
    const result = await fabricService.getAllFabricsAdvanced(queryParams);
    res.json({ message: 'Success', ...result });
  } catch (error) {
    next(error);
  }
};
```

### 4. Routes
```javascript
router.get('/', 
  authenticateToken,
  requirePermission(PERMISSIONS.FABRICS.VIEW_LIST),
  validate(fabricQuerySchema, 'query'),
  getAllFabrics
);
```

### 5. Permissions
```javascript
FABRICS: {
  VIEW_LIST: 'fabrics.view_list',
  CREATE: 'fabrics.create'
}
```