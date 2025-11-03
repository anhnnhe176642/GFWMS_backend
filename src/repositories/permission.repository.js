import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class PermissionRepository {
  async findAll() {
    return await prisma.permission.findMany({
      select: {
        id: true,
        key: true,
        description: true
      },
      orderBy: {
        key: 'asc'
      }
    });
  }

  async findByIds(ids) {
    return await prisma.permission.findMany({
      where: {
        id: {
          in: ids
        }
      },
      select: {
        id: true,
        key: true,
        description: true
      }
    });
  }
}

export const permissionRepository = new PermissionRepository();
