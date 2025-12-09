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

  async findByUserId(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        roleRel: {
          select: {
            name: true,
            fullName: true,
            description: true,
            rolePermissions: {
              select: {
                permission: {
                  select: {
                    id: true,
                    key: true,
                    description: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      return null;
    }

    return {
      userId,
      roleName: user.role,
      roleFullName: user.roleRel?.fullName,
      roleDescription: user.roleRel?.description,
      permissions: user.roleRel?.rolePermissions?.map(rp => rp.permission) || []
    };
  }
}

export const permissionRepository = new PermissionRepository();
