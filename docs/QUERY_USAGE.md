# Hướng dẫn sử dụng Query Parameters

## Tổng quan

Hệ thống hỗ trợ phân trang, tìm kiếm và lọc dữ liệu thống nhất cho tất cả các API endpoints.

## Query Parameters chung

### 1. Phân trang (Pagination)

```
GET /api/users?page=1&limit=10
```

- `page`: Số trang (mặc định: 1, min: 1)
- `limit`: Số lượng items mỗi trang (mặc định: 10, min: 1, max: 100)

**Response format:**
```json
{
  "message": "Success",
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### 2. Tìm kiếm (Search)

```
GET /api/users?search=john
```

- `search`: Từ khóa tìm kiếm (max: 100 ký tự)
- Tìm kiếm không phân biệt hoa thường
- Tìm kiếm trên nhiều trường (fields) được định nghĩa sẵn

**Ví dụ - User search:**
Tìm kiếm trên: `username`, `email`, `fullname`, `phone`

**Ví dụ - Role search:**
Tìm kiếm trên: `name`

### 3. Sắp xếp (Sorting)

```
GET /api/users?sortBy=createdAt&order=desc
```

- `sortBy`: Trường để sắp xếp (mặc định: createdAt)
  - Hỗ trợ sắp xếp **nhiều trường** bằng cách sử dụng dấu phẩy: `sortBy=status,createdAt`
- `order`: Thứ tự sắp xếp
  - `asc` hoặc `ASC`: Tăng dần
  - `desc` hoặc `DESC`: Giảm dần (mặc định)
  - Hỗ trợ nhiều thứ tự tương ứng với nhiều trường: `order=asc,desc`

**Ví dụ sắp xếp nhiều trường:**
```bash
# Sắp xếp theo status tăng dần, sau đó theo createdAt giảm dần
GET /api/users?sortBy=status,createdAt&order=asc,desc

# Sắp xếp theo role và username, cả hai đều tăng dần
GET /api/users?sortBy=role,username&order=asc
```

## API Endpoints cụ thể

### Users API

#### GET /api/users - Lấy danh sách users

**Query Parameters:**
- `page`: Số trang
- `limit`: Số lượng mỗi trang
- `search`: Tìm kiếm theo username, email, fullname, phone
- `sortBy`: Sắp xếp theo (createdAt, username, email, fullname) - hỗ trợ nhiều trường cách nhau bởi dấu phẩy
- `order`: asc hoặc desc - hỗ trợ nhiều giá trị cách nhau bởi dấu phẩy
- `status`: Lọc theo trạng thái (ACTIVE, INACTIVE, SUSPENDED) - hỗ trợ nhiều giá trị cách nhau bởi dấu phẩy
- `role`: Lọc theo role - hỗ trợ nhiều giá trị cách nhau bởi dấu phẩy
- `gender`: Lọc theo giới tính (MALE, FEMALE, OTHER) - hỗ trợ nhiều giá trị cách nhau bởi dấu phẩy
- `createdFrom`: Lọc từ ngày tạo (ISO date)
- `createdTo`: Lọc đến ngày tạo (ISO date)

**Ví dụ:**

```bash
# Lấy trang 1, mỗi trang 20 users
GET /api/users?page=1&limit=20

# Tìm kiếm users có từ "john"
GET /api/users?search=john

# Lọc users theo role "admin"
GET /api/users?role=admin

# Lọc users active
GET /api/users?status=ACTIVE

# Lọc users theo nhiều trạng thái (checkbox style)
GET /api/users?status=ACTIVE,INACTIVE

# Lọc users theo nhiều role
GET /api/users?role=admin,manager

# Lọc users theo giới tính
GET /api/users?gender=MALE

# Lọc users theo nhiều giới tính
GET /api/users?gender=MALE,FEMALE

# Lọc users được tạo từ ngày 01/01/2025
GET /api/users?createdFrom=2025-01-01T00:00:00.000Z

# Sắp xếp theo nhiều trường
GET /api/users?sortBy=status,createdAt&order=asc,desc

# Kết hợp nhiều filters và multiple sorting
GET /api/users?search=john&role=admin,manager&status=ACTIVE,INACTIVE&page=1&limit=10&sortBy=status,createdAt&order=asc,desc

# Lọc users theo khoảng thời gian
GET /api/users?createdFrom=2025-01-01T00:00:00.000Z&createdTo=2025-12-31T23:59:59.999Z
```

**Response:**
```json
{
  "message": "Lấy danh sách users thành công",
  "data": [
    {
      "id": "uuid",
      "username": "john_doe",
      "email": "john@example.com",
      "fullname": "John Doe",
      "phone": "0123456789",
      "status": "ACTIVE",
      "role": "admin",
      "gender": "MALE",
      "createdAt": "2025-01-01T00:00:00.000Z",
      ...
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Roles API

#### GET /api/roles - Lấy danh sách roles

**Query Parameters:**
- `page`: Số trang
- `limit`: Số lượng mỗi trang
- `search`: Tìm kiếm theo tên role
- `sortBy`: Sắp xếp theo (name)
- `order`: asc hoặc desc

**Ví dụ:**

```bash
# Lấy tất cả roles (không phân trang)
GET /api/roles

# Lấy danh sách roles có phân trang
GET /api/roles?page=1&limit=10

# Tìm kiếm role có chứa "admin"
GET /api/roles?search=admin

# Sắp xếp theo tên tăng dần
GET /api/roles?sortBy=name&order=asc

# Kết hợp tìm kiếm và phân trang
GET /api/roles?search=manager&page=1&limit=5&sortBy=name&order=asc
```

**Response:**
```json
{
  "message": "Lấy danh sách roles thành công",
  "data": [
    {
      "name": "admin",
      "rolePermissions": [
        {
          "permission": {
            "key": "users.view_list",
            "description": "Xem danh sách users"
          }
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

## Áp dụng cho Module mới

Để áp dụng query builder cho module mới, làm theo các bước sau:

### 1. Repository

```javascript
import { buildWhereClause, buildPagination, buildSort, formatPaginatedResponse } from '../utils/query-builder.js';

async findWithAdvancedQuery(queryOptions = {}) {
  const { 
    page = 1, 
    limit = 10, 
    search = '', 
    sortBy = 'createdAt', 
    order = 'desc',
    filters = {}
  } = queryOptions;

  // Định nghĩa các trường có thể search
  const searchableFields = ['name', 'description', 'code'];
  
  // Build where clause
  const where = buildWhereClause(
    { search, ...filters },
    searchableFields
  );

  // Build pagination
  const { skip, take } = buildPagination(page, limit);

  // Build sort với mapping (optional)
  const orderBy = buildSort(sortBy, order, {
    name: 'name',
    created: 'createdAt'
  });

  // Execute queries
  const [items, total] = await Promise.all([
    prisma.yourModel.findMany({
      where,
      skip,
      take,
      orderBy
    }),
    prisma.yourModel.count({ where })
  ]);

  return formatPaginatedResponse(items, total, page, take);
}
```

### 2. Validation Schema

```javascript
import { querySchema } from './common.validation.js';

export const yourModelQuerySchema = querySchema.keys({
  // Thêm các filter fields cụ thể
  status: Joi.string().valid('ACTIVE', 'INACTIVE').optional(),
  category: Joi.string().optional(),
  // Date range filters
  createdFrom: Joi.date().optional(),
  createdTo: Joi.date().optional()
});
```

### 3. Service

```javascript
export const getAllYourModelsAdvanced = async (queryOptions) => {
  return await yourModelRepository.findWithAdvancedQuery(queryOptions);
};
```

### 4. Controller

```javascript
export const getAllYourModels = async (req, res, next) => {
  try {
    const { page, limit, search, sortBy, order, status, category, createdFrom, createdTo } = req.query;
    
    // Build filters
    const filters = {};
    if (status) filters.status = status;
    if (category) filters.category = category;
    if (createdFrom || createdTo) {
      filters.createdAt = {};
      if (createdFrom) filters.createdAt.gte = new Date(createdFrom);
      if (createdTo) filters.createdAt.lte = new Date(createdTo);
    }

    const result = await yourModelService.getAllYourModelsAdvanced({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      search,
      sortBy,
      order,
      filters
    });
    
    res.json({
      message: 'Success',
      ...result
    });
  } catch (error) {
    next(error);
  }
};
```

### 5. Routes

```javascript
router.get('/', 
  authenticateToken,
  requirePermission(PERMISSIONS.YOUR_MODEL.VIEW_LIST),
  validate(yourModelQuerySchema, 'query'),
  getAllYourModels
);
```

## Best Practices

1. **Searchable Fields**: Chỉ định nghĩa các trường thực sự cần thiết để search
2. **Default Values**: Luôn set giá trị mặc định cho page, limit, sortBy, order
3. **Max Limit**: Giới hạn limit tối đa là 100 để tránh performance issues
4. **Validation**: Luôn validate query params trước khi xử lý
5. **Error Handling**: Sử dụng try-catch và error middleware để xử lý lỗi
6. **Documentation**: Document rõ ràng các query params được hỗ trợ cho từng endpoint

## Performance Tips

1. **Indexing**: Đảm bảo các trường được search/filter/sort có index trong database
2. **Limit Results**: Luôn sử dụng pagination thay vì lấy toàn bộ dữ liệu
3. **Select Fields**: Chỉ select các fields cần thiết
4. **Caching**: Cân nhắc caching cho các queries thường xuyên

## Error Responses

```json
{
  "error": "Validation Error",
  "message": "Invalid query parameters",
  "details": [
    {
      "field": "page",
      "message": "Page phải lớn hơn 0"
    }
  ]
}
```
