import { PrismaClient } from '@prisma/client';
import { withPrismaErrorHandling } from '../utils/prisma-error-handler.js';

const prisma = new PrismaClient();

export class UserRepository {
    // Common select options để exclude password
  #userSelectOptions = {
    id: true,
    username: true,
    phone: true,
    email: true,
    avatar: true,
    gender: true,
    address: true,
    dob: true,
    fullname: true,
    status: true,
    createdAt: true,
    updatedAt: true,
    role: true,
    creditRegistration: true
  };

  async findAll() {
    return await prisma.user.findMany({
      where: {
        status: {
          not: 'DELETED'
        }
      },
      select: this.#userSelectOptions
    });
  }

  async findById(id) {
    return await prisma.user.findFirst({
      where: { 
        id,
        status: {
          not: 'DELETED'
        }
      },
      select: this.#userSelectOptions
    });
  }

  async findByIdWithPermissions(id) {
    const user = await prisma.user.findFirst({
      where: { 
        id,
        status: {
          not: 'DELETED'
        }
      },
      select: {
        ...this.#userSelectOptions,
        roleRel: {
          select: {
            rolePermissions: {
              select: {
                permission: {
                  select: {
                    key: true
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

    const permissionKeys = user.roleRel?.rolePermissions?.map(rp => rp.permission.key) || [];
    
    delete user.roleRel;
    user.permissions = permissionKeys;
    return user;
  }

  async findByUsername(username) {
    return await prisma.user.findFirst({
      where: { 
        username,
        status: {
          not: 'DELETED'
        }
      },
      select: this.#userSelectOptions
    });
  }

  async findByEmail(email) {
    return await prisma.user.findFirst({
      where: { 
        email,
        status: {
          not: 'DELETED'
        }
      },
      select: this.#userSelectOptions
    });
  }

  async findByUsernameOrEmailWithPassword(usernameOrEmail) {
    return await prisma.user.findFirst({
      where: {
        OR: [
          { username: usernameOrEmail },
          { email: usernameOrEmail }
        ]
      }
    });
  }

  // Method để lấy user với password cho change password
  async findByIdWithPassword(id) {
    return await prisma.user.findFirst({
      where: { 
        id,
        status: {
          not: 'DELETED'
        }
      }
    });
  }

  async findByUsernameOrEmail(usernameOrEmail) {
    return await prisma.user.findFirst({
      where: {
        AND: [
          {
            OR: [
              { username: usernameOrEmail },
              { email: usernameOrEmail }
            ]
          },
          {
            status: {
              not: 'DELETED'
            }
          }
        ]
      },
      select: this.#userSelectOptions
    });
  }

  async create(userData) {
    return await withPrismaErrorHandling(
      () => prisma.user.create({
        data: userData,
        select: this.#userSelectOptions
      }),
      {
        email: 'Email đã được sử dụng',
        username: 'Tên đăng nhập đã tồn tại'
      }
    );
  }

  async updateById(id, userData) {
    return await withPrismaErrorHandling(
      () => prisma.user.update({
        where: { id },
        data: userData,
        select: this.#userSelectOptions
      }),
      {
        email: 'Email đã được sử dụng',
        username: 'Tên đăng nhập đã tồn tại'
      }
    );
  }

  // Soft delete
  async softDelete(id) {
    return await this.updateById(id, { status: 'DELETED' });
  }

  async count() {
    return await prisma.user.count({
      where: {
        status: {
          not: 'DELETED'
        }
      }
    });
  }

  async findWithPagination(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: {
          status: {
            not: 'DELETED'
          }
        },
        skip,
        take: limit,
        select: this.#userSelectOptions,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      this.count()
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // Lấy danh sách tất cả permissions của user theo role
  async getUserPermissions(userId) {
    const result = await prisma.user.findUnique({
      where: {
        id: userId,
        status: {
          not: 'DELETED'
        }
      },
      select: {
        role: true,
        roleRel: {
          select: {
            rolePermissions: {
              select: {
                permission: {
                  select: {
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

    if (!result) {
      return [];
    }

    return result.roleRel?.rolePermissions?.map(rp => rp.permission) || [];
  }

  // Lấy danh sách permission keys của user (chỉ trả về array string)
  async getUserPermissionKeys(userId) {
    const permissions = await this.getUserPermissions(userId);
    return permissions.map(p => p.key);
  }

  // Kiểm tra user có permission cụ thể không
  async hasPermission(userId, permissionKey) {
    const result = await prisma.user.findFirst({
      where: {
        id: userId,
        status: {
          not: 'DELETED'
        }
      },
      select: {
        role: true,
        roleRel: {
          select: {
            rolePermissions: {
              where: {
                permission: {
                  key: permissionKey
                }
              },
              select: {
                permissionId: true
              }
            }
          }
        }
      }
    });

    return result?.roleRel?.rolePermissions?.length > 0 || false;
  }

  // Kiểm tra user có bất kỳ permission nào trong danh sách không (OR logic)
  async hasAnyPermission(userId, permissionKeys) {
    const result = await prisma.user.findFirst({
      where: {
        id: userId,
        status: {
          not: 'DELETED'
        }
      },
      select: {
        roleRel: {
          select: {
            rolePermissions: {
              where: {
                permission: {
                  key: {
                    in: permissionKeys
                  }
                }
              },
              select: {
                permissionId: true
              }
            }
          }
        }
      }
    });

    return result?.roleRel?.rolePermissions?.length > 0 || false;
  }

  // Kiểm tra user có tất cả permissions trong danh sách không (AND logic)
  async hasAllPermissions(userId, permissionKeys) {
    const result = await prisma.user.findFirst({
      where: {
        id: userId,
        status: {
          not: 'DELETED'
        }
      },
      select: {
        roleRel: {
          select: {
            rolePermissions: {
              where: {
                permission: {
                  key: {
                    in: permissionKeys
                  }
                }
              },
              select: {
                permission: {
                  select: {
                    key: true
                  }
                }
              }
            }
          }
        }
      }
    });

    const userPermissions = result?.roleRel?.rolePermissions?.map(rp => rp.permission.key) || [];
    return permissionKeys.every(permission => userPermissions.includes(permission));
  }
}

// Export singleton instance
export const userRepository = new UserRepository();