import { PrismaClient } from '@prisma/client';
import { withPrismaErrorHandling } from '../utils/prisma-error-handler.js';
import { buildWhereClause, buildPagination, buildSort, formatPaginatedResponse } from '../utils/query-builder.js';

const prisma = new PrismaClient();

export class RoleRepository {
  async findAll() {
    return await prisma.role.findMany({
      select: {
        name: true,
        rolePermissions: {
          select: {
            permission: true
          }
        }
      }
    });
  }

  async findByName(name) {
    return await prisma.role.findUnique({
      where: { name },
      select: {
        name: true,
        rolePermissions: {
          select: {
            permission: true
          }
        }
      }
    });
  }

  async create(data) {
    return await withPrismaErrorHandling(
      () => prisma.role.create({ data }),
      {
        name: 'Tên role đã tồn tại'
      }
    );
  }

  async delete(name) {
    return await withPrismaErrorHandling(
      () => prisma.role.delete({
        where: { name }
      }),
      {
        name: 'Role không tồn tại hoặc đang được sử dụng'
      }
    );
  }

  // Kiểm tra xem role có đang được sử dụng bởi user nào không
  async isRoleInUse(name) {
    const userCount = await prisma.user.count({
      where: {
        role: name,
        status: {
          not: 'DELETED'
        }
      }
    });
    
    return userCount > 0;
  }

  // Lấy danh sách user đang sử dụng role 
  async getUsersUsingRole(name) {
    return await prisma.user.findMany({
      where: {
        role: name,
        status: {
          not: 'DELETED'
        }
      },
      select: {
        id: true,
        username: true,
        email: true,
        fullname: true
      }
    });
  }

  // Advanced query method với search, filter, sort
  async findWithAdvancedQuery(queryOptions = {}) {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      sortBy = 'name', 
      order = 'asc'
    } = queryOptions;

    const searchableFields = ['name'];
    const where = buildWhereClause({ search }, searchableFields);
    const { skip, take } = buildPagination(page, limit);
    const orderBy = buildSort(sortBy, order);

    const [roles, total] = await Promise.all([
      prisma.role.findMany({
        where,
        skip,
        take,
        orderBy,
        select: {
          name: true,
          rolePermissions: {
            select: {
              permission: true
            }
          }
        }
      }),
      prisma.role.count({ where })
    ]);

    return formatPaginatedResponse(roles, total, page, take);
  }
}

export const roleRepository = new RoleRepository();