import { PrismaClient } from '@prisma/client';
import { withPrismaErrorHandling } from '../utils/prisma-error-handler.js';

const prisma = new PrismaClient();

export class RoleRepository {
  async findAll() {
    return await prisma.role.findMany();
  }

  async findByName(name) {
    return await prisma.role.findUnique({
      where: { name },
      include: {
        rolePermissions: {
          include: {
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

  async update(name, data) {
    return await withPrismaErrorHandling(
      () => prisma.role.update({
        where: { name },
        data
      }),
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
}

export const roleRepository = new RoleRepository();