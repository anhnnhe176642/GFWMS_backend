# Fabric Warehouse Management System

A fabric warehouse management system with features for user management, role-based access control, warehouse management, order management, and more.

## System Requirements

Before getting started, ensure your computer has the following installed:

- **Node.js** (version 18.x or higher) - [Download here](https://nodejs.org/)
- **MySQL** (version 8.x or higher) - [Download here](https://dev.mysql.com/downloads/mysql/)
- **pnpm** (package manager) - [Installation guide](https://pnpm.io/installation)

### Installing pnpm

After installing Node.js, run the following command to install pnpm:

```bash
npm install -g pnpm
```

## Installation Guide

### 1. Clone the project

```bash
git clone https://github.com/anhnnhe176642/GFWMS_backend.git
cd GFWMS_backend
```

### 2. Configure environment variables

Copy the `.env.example` file to `.env`:

```bash
cp .env.example .env
```

Then edit the `.env` file with your configuration:

```env
# Database configuration
DATABASE_URL="mysql://user:password@localhost:3306/databaseName"
```

**Note:** Replace `user` and `password` with your MySQL credentials.

### 4. Install dependencies and setup database

Run the following command to install all dependencies, merge Prisma schema, create migrations, and generate Prisma Client:

```bash
pnpm run init
```

This command will automatically:
- Install all packages
- Merge Prisma schema files
- Create and run migrations
- Generate Prisma Client

### 5. Seed sample data

Run the following command to add sample data to the database:

```bash
pnpm run seed
```

### 6. Run the application

#### Development mode (with nodemon - auto-restart on changes):

```bash
pnpm run dev
```

#### Production mode:

```bash
pnpm run start
```

The server will run at http://localhost:3000 (or the PORT configured in the `.env` file)

## Access API Documentation (Swagger)

After successfully starting the server, you can access Swagger UI to view and test API endpoints:

http://localhost:3000/api-docs

## Available Scripts

- `pnpm run init` - Install dependencies and setup database
- `pnpm run start` - Run server in production mode
- `pnpm run dev` - Run server in development mode with nodemon
- `pnpm run seed` - Seed sample data into database
- `pnpm run prisma:merge` - Merge Prisma schema files
- `pnpm run prisma:gen` - Generate Prisma Client
- `pnpm run prisma:migrate` - Create and run new migration
- `pnpm run prisma:all` - Execute all Prisma steps (merge, generate, migrate)

## Project Structure

```
├── prisma/               # Prisma schema and migrations
│   ├── models/          # Separated Prisma model files
│   ├── migrations/      # Database migrations
│   └── seed.js          # Sample data seeding file
├── src/
│   ├── config/          # Configuration (Swagger, etc.)
│   ├── constants/       # Constants and permissions
│   ├── controllers/     # Request handling controllers
│   ├── middlewares/     # Middlewares (auth, validation, etc.)
│   ├── repositories/    # Data access layer
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   └── validations/     # Validation schemas (Joi)
├── docs/                # Project documentation
└── tests/               # Unit tests and integration tests
```
