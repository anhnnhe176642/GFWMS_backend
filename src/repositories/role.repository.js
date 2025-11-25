import { PrismaClient } from '@prisma/client';
import { withPrismaErrorHandling } from '../utils/prisma-error-handler.js';
import { buildWhereClause, buildPagination, buildSort, formatPaginatedResponse } from '../utils/query-builder.js';

const prisma = new PrismaClient();

export class RoleRepository {
  async findAll() {
    return await prisma.role.findMany({
      select: {
        name: true,
        fullName: true,
        description: true,
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
        fullName: true,
        description: true,
        rolePermissions: {
          select: {
            permission: true
          }
        }
      }
    });
  }

  async create(data) {
    const { permissions, ...roleData } = data;

    return await withPrismaErrorHandling(
      async () => {
        // Nếu có permissions, tạo role và permissions cùng lúc
        if (permissions !== undefined && permissions.length > 0) {
          return await prisma.$transaction(async (tx) => {
            // Lấy hoặc tạo permissions từ keys
            const permissionRecords = await Promise.all(
              permissions.map(async (key) => {
                const existingPerm = await tx.permission.findUnique({
                  where: { key },
                  select: { id: true }
                });

                if (existingPerm) {
                  return existingPerm;
                }

                // Tạo permission mới nếu không tồn tại
                return await tx.permission.create({
                  data: { key },
                  select: { id: true }
                });
              })
            );

            // Tạo role
            const newRole = await tx.role.create({
              data: roleData
            });

            // Tạo role permissions
            await tx.rolePermission.createMany({
              data: permissionRecords.map(perm => ({
                role: newRole.name,
                permissionId: perm.id
              }))
            });

            // Lấy role với permissions
            return await tx.role.findUnique({
              where: { name: newRole.name },
              select: {
                name: true,
                fullName: true,
                description: true,
                rolePermissions: {
                  select: {
                    permission: true
                  }
                }
              }
            });
          });
        }

        // Nếu không có permissions, chỉ tạo role
        return await prisma.role.create({
          data: roleData,
          select: {
            name: true,
            fullName: true,
            description: true,
            rolePermissions: {
              select: {
                permission: true
              }
            }
          }
        });
      },
      {
        name: 'Tên role đã tồn tại',
        description: 'Description này đã được sử dụng cho role khác'
      }
    );
  }

  async countUsersWithRole(name) {
    return await prisma.user.count({
      where: { role: name }
    });
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

  // Update role
  async update(name, data) {
    const { permissions, ...roleData } = data;

    return await withPrismaErrorHandling(
      async () => {
        // Nếu có permissions, cập nhật cả role và permissions
        if (permissions !== undefined) {
          return await prisma.$transaction(async (tx) => {
            // Lấy hoặc tạo permissions từ keys
            const permissionRecords = await Promise.all(
              permissions.map(async (key) => {
                const existingPerm = await tx.permission.findUnique({
                  where: { key },
                  select: { id: true }
                });

                if (existingPerm) {
                  return existingPerm;
                }

                // Tạo permission mới nếu không tồn tại
                return await tx.permission.create({
                  data: { key },
                  select: { id: true }
                });
              })
            );

            // Cập nhật thông tin role
            await tx.role.update({
              where: { name },
              data: roleData,
            });

            // Xóa tất cả permissions cũ
            await tx.rolePermission.deleteMany({
              where: { role: name }
            });

            // Thêm permissions mới (nếu có)
            if (permissions.length > 0) {
              await tx.rolePermission.createMany({
                data: permissionRecords.map(perm => ({
                  role: name,
                  permissionId: perm.id
                }))
              });
            }

            // Lấy role với permissions mới
            return await tx.role.findUnique({
              where: { name },
              select: {
                name: true,
                fullName: true,
                description: true,
                rolePermissions: {
                  select: {
                    permission: true
                  }
                }
              }
            });
          });
        }

        // Nếu không có permissions, chỉ cập nhật role
        return await prisma.role.update({
          where: { name },
          data: roleData,
          select: {
            name: true,
            fullName: true,
            description: true,
            rolePermissions: {
              select: {
                permission: true
              }
            }
          }
        });
      },
      {
        description: 'Description này đã được sử dụng cho role khác'
      }
    );
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

    const searchableFields = ['name', 'fullName', 'description'];
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
          fullName: true,
          description: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.role.count({ where })
    ]);

    return formatPaginatedResponse(roles, total, page, take);
  }
}

export const roleRepository = new RoleRepository();