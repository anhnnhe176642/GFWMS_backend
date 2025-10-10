# Fabric Warehouse Management System

Hệ thống quản lý kho vải với các tính năng quản lý người dùng, phân quyền, quản lý kho, đơn hàng và nhiều chức năng khác.

## Yêu cầu hệ thống

Trước khi bắt đầu, đảm bảo máy tính đã cài đặt:

- **Node.js** (phiên bản 18.x trở lên) - [Tải về tại đây](https://nodejs.org/)
- **MySQL** (phiên bản 8.x trở lên) - [Tải về tại đây](https://dev.mysql.com/downloads/mysql/)
- **pnpm** (package manager) - [Tài liệu cài đặt](https://pnpm.io/installation)

### Cài đặt pnpm

Sau khi cài đặt Node.js, chạy lệnh sau để cài đặt pnpm:

```bash
npm install -g pnpm
```

## Hướng dẫn cài đặt

### 1. Clone dự án

```bash
git clone https://github.com/anhnnhe176642/GFWMS_backend.git
cd GFWMS_backend
```

### 2. Cấu hình biến môi trường

Sao chép file `.env.example` thành `.env`:

```bash
cp .env.example .env
```

Sau đó chỉnh sửa file `.env` với thông tin cấu hình:

```env
# Database configuration
DATABASE_URL="mysql://user:password@localhost:3306/databaseName"
```

**Lưu ý:** Thay thế `user` và `password` bằng thông tin đăng nhập MySQL.

### 4. Cài đặt dependencies và thiết lập database

Chạy lệnh sau để cài đặt tất cả dependencies, merge schema Prisma, tạo migrations và generate Prisma Client:

```bash
pnpm run init
```

Lệnh này sẽ tự động thực hiện:
- Cài đặt tất cả packages
- Merge các file Prisma schema
- Tạo và chạy migrations
- Generate Prisma Client

### 5. Seed dữ liệu mẫu

Chạy lệnh sau để thêm dữ liệu mẫu vào database:

```bash
pnpm run seed
```

### 6. Chạy ứng dụng

#### Development mode (với nodemon - tự động restart khi có thay đổi):

```bash
pnpm run dev
```

#### Production mode:

```bash
pnpm run start
```

Server sẽ chạy tại `http://localhost:3000` (hoặc PORT đã cấu hình trong file `.env`)

## Truy cập API Documentation (Swagger)

Sau khi khởi động server thành công, có thể truy cập Swagger UI để xem và test các API endpoints:

```
http://localhost:3000/api-docs
```

## Scripts có sẵn

- `pnpm run init` - Cài đặt dependencies và setup database
- `pnpm run start` - Chạy server ở production mode
- `pnpm run dev` - Chạy server ở development mode với nodemon
- `pnpm run seed` - Seed dữ liệu mẫu vào database
- `pnpm run prisma:merge` - Merge các file Prisma schema
- `pnpm run prisma:gen` - Generate Prisma Client
- `pnpm run prisma:migrate` - Tạo và chạy migration mới
- `pnpm run prisma:all` - Thực hiện tất cả các bước Prisma (merge, generate, migrate)

## Cấu trúc dự án

```
├── prisma/               # Prisma schema và migrations
│   ├── models/          # Các file model Prisma được tách riêng
│   ├── migrations/      # Database migrations
│   └── seed.js          # File seed dữ liệu mẫu
├── src/
│   ├── config/          # Cấu hình (Swagger, etc.)
│   ├── constants/       # Constants và permissions
│   ├── controllers/     # Controllers xử lý request
│   ├── middlewares/     # Middlewares (auth, validation, etc.)
│   ├── repositories/    # Data access layer
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   └── validations/     # Validation schemas (Joi)
├── docs/                # Tài liệu dự án
└── tests/               # Unit tests và integration tests
```