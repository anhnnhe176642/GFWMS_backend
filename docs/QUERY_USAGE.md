# Query Parameters Usage Guide

## Overview

The system supports unified pagination, search, filtering, and sorting for all endpoints.

**Core utilities:**
- `query-builder.js`: Build Prisma queries
- `filter-builder.js`: Parse query params
- `common.validation.js`: Validation schemas

## Basic Query Parameters

### Pagination
```bash
GET /api/users?page=1&limit=10
```
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

### Search
```bash
GET /api/users?search=john
```
- Case-insensitive
- Search across multiple fields (OR logic)
- Users: `username`, `email`, `fullname`, `phone`
- Roles: `name`

### Sorting
```bash
GET /api/users?sortBy=createdAt&order=desc
GET /api/users?sortBy=status,createdAt&order=asc,desc
```
- `sortBy`: Field(s) to sort by (comma-separated)
- `order`: `asc` | `desc` (comma-separated)

## API Endpoints

### GET /api/users
**Auth:** Required | **Permission:** `users.view_list`

**Query Params:**
- `page`, `limit`: Pagination
- `search`: Search (username, email, fullname, phone)
- `sortBy`, `order`: Sorting
- `status`: ACTIVE, INACTIVE, SUSPENDED (multi-value)
- `role`: Filter by role (multi-value)
- `gender`: MALE, FEMALE, OTHER (multi-value)
- `createdFrom`, `createdTo`: Filter by date

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
- `page`, `limit`: Pagination
- `search`: Search by role name
- `sortBy`, `order`: Sorting

**Examples:**
```bash
GET /api/roles
GET /api/roles?search=admin&sortBy=name&order=asc
```

---

## Apply to New Modules

5 steps to add query support for a new module:

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