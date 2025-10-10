# Swagger API Documentation Setup

## Giới thiệu

Dự án này đã được tích hợp Swagger UI để cung cấp tài liệu API tương tác. Swagger cho phép bạn xem, test và hiểu các API endpoints một cách dễ dàng.

## Truy cập Swagger UI

Sau khi khởi động server, bạn có thể truy cập Swagger UI tại:

```
http://localhost:3000/api-docs
```

## Tính năng

### 1. **Xem tất cả API Endpoints**
- Swagger UI hiển thị tất cả các endpoints được nhóm theo tags (Auth, Users, Roles)
- Mỗi endpoint có mô tả đầy đủ về:
  - Method (GET, POST, PUT, PATCH, DELETE)
  - Parameters (path, query, body)
  - Request body schema
  - Response schema
  - Status codes

### 2. **Test API trực tiếp**
- Click vào endpoint bất kỳ để xem chi tiết
- Click nút "Try it out" để test API
- Nhập parameters và request body
- Click "Execute" để gửi request
- Xem response trực tiếp trong UI

### 3. **Authentication**
- Các endpoints yêu cầu authentication có icon khóa 🔒
- Để test các endpoints cần authentication:
  1. Đăng nhập qua endpoint `/auth/login`
  2. Copy JWT token từ response
  3. Click nút "Authorize" ở đầu trang
  4. Nhập token theo format: `Bearer <your_token>`
  5. Click "Authorize"
  6. Bây giờ bạn có thể test các protected endpoints

## Cấu trúc dự án

### File cấu hình Swagger

**`src/config/swagger.js`**
- Chứa cấu hình Swagger và định nghĩa schemas
- Định nghĩa các components có thể tái sử dụng:
  - Security schemes (JWT Bearer token)
  - Schemas (User, Role, Error, etc.)
  - Responses (UnauthorizedError, NotFoundError, etc.)

### JSDoc comments trong routes

Mỗi route có JSDoc comment với format:

```javascript
/**
 * @swagger
 * /path:
 *   method:
 *     summary: Short description
 *     tags: [Tag Name]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path/query/header
 *         name: parameter_name
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               field: type
 *     responses:
 *       200:
 *         description: Success response
 */
```

## Thêm documentation cho endpoints mới

Khi thêm endpoint mới, hãy thêm JSDoc comment theo format trên:

```javascript
/**
 * @swagger
 * /your-new-endpoint:
 *   post:
 *     summary: Description of your endpoint
 *     tags: [YourTag]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - field1
 *             properties:
 *               field1:
 *                 type: string
 *                 example: example value
 *     responses:
 *       201:
 *         description: Created successfully
 *       400:
 *         $ref: '#/components/schemas/ValidationError'
 */
router.post('/your-new-endpoint', yourController);
```

## Thêm schemas mới

Để thêm schema mới trong `src/config/swagger.js`:

```javascript
components: {
  schemas: {
    YourNewSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          format: 'uuid'
        },
        name: {
          type: 'string'
        }
      }
    }
  }
}
```

## Testing với Swagger UI

### Ví dụ: Test flow đăng ký và đăng nhập

1. **Register** (`POST /auth/register`)
   - Click "Try it out"
   - Điền thông tin user
   - Click "Execute"
   - Xem response với user đã được tạo

2. **Login** (`POST /auth/login`)
   - Click "Try it out"
   - Điền email và password
   - Click "Execute"
   - Copy JWT token từ response

3. **Authorize**
   - Click nút "Authorize" ở đầu trang
   - Paste token vào field
   - Click "Authorize"

4. **Test protected endpoints**
   - Bây giờ bạn có thể test các endpoints như:
     - `GET /auth/profile`
     - `GET /users`
     - `GET /roles`

## Lợi ích của Swagger

1. **Tài liệu tự động**: Không cần maintain tài liệu riêng
2. **Testing dễ dàng**: Test API ngay trong browser
3. **Hiểu API nhanh**: Developers mới có thể hiểu API structure nhanh chóng
4. **Validation**: Xem được các validation rules và required fields
5. **Examples**: Có sẵn example values cho mọi field

## Troubleshooting

### Swagger UI không hiển thị endpoints

1. Kiểm tra JSDoc comments có đúng format không
2. Kiểm tra `apis` path trong `swagger.js` có đúng không
3. Restart server để Swagger load lại config

### Token authentication không hoạt động

1. Đảm bảo token được copy đầy đủ
2. Token phải còn valid (chưa expired)
3. Format phải là: `Bearer <token>` (có khoảng trắng)

### Schema không hiển thị

1. Kiểm tra syntax của schema definition
2. Đảm bảo schema được reference đúng: `$ref: '#/components/schemas/SchemaName'`

## Best Practices

1. **Luôn thêm example values** cho request body và parameters
2. **Document tất cả response codes** có thể có
3. **Sử dụng $ref** cho các schemas và responses được dùng nhiều lần
4. **Group endpoints theo tags** để dễ tìm kiếm
5. **Thêm description chi tiết** cho các trường phức tạp

## Tài liệu tham khảo

- [Swagger/OpenAPI Specification](https://swagger.io/specification/)
- [swagger-jsdoc Documentation](https://github.com/Surnet/swagger-jsdoc)
- [swagger-ui-express](https://github.com/scottie1984/swagger-ui-express)
