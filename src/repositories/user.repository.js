import { PrismaClient, UserStatus } from '@prisma/client';
import { withPrismaErrorHandling } from '../utils/prisma-error-handler.js';
import { buildWhereClause, buildPagination, buildSort, formatPaginatedResponse } from '../utils/query-builder.js';

const prisma = new PrismaClient();

export class UserRepository {
    // Common select options để exclude password
  #userSelectOptions = {
    id: true,
    username: true,
    phone: true,
    email: true,
    avatar: true,
    avatarPublicId: true,
    gender: true,
    address: true,
    dob: true,
    fullname: true,
    status: true,
    emailVerified: true,
    emailVerifiedAt: true,
    createdAt: true,
    updatedAt: true,
    role: true,
    creditRegistration: true
  };

  #notDeletedWhere = {
    status: {
      not: UserStatus.DELETED
    }
  };

  async findAll() {
    return await prisma.user.findMany({
      where: this.#notDeletedWhere,
      select: this.#userSelectOptions
    });
  }

  async findById(id) {
    return await prisma.user.findFirst({
      where: { id, ...this.#notDeletedWhere },
      select: this.#userSelectOptions
    });
  }

  async findByIdWithPermissions(id) {
    const user = await prisma.user.findFirst({
      where: { id, ...this.#notDeletedWhere },
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
        ...this.#notDeletedWhere
      },
      select: this.#userSelectOptions
    });
  }

  async findByEmail(email) {
    return await prisma.user.findFirst({
      where: { 
        email,
        ...this.#notDeletedWhere
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
      where: { id, ...this.#notDeletedWhere }
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
          this.#notDeletedWhere
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
        username: 'Tên đăng nhập đã tồn tại',
        phone: 'Số điện thoại đã được sử dụng',
      }
    );
  }

  // Soft delete
  async softDelete(id) {
  return await this.updateById(id, { status: UserStatus.DELETED });
  }


  // Hard delete user row (may fail if FK constraints exist)
  async deleteById(id) {
    return await withPrismaErrorHandling(
      () => prisma.user.delete({ where: { id } }),
      {
        id: 'Người dùng không tồn tại'
      }
    );
  }

  async markEmailVerified(id) {
    return await withPrismaErrorHandling(
      () => prisma.user.update({
        where: { id },
        data: {
          emailVerified: true,
          emailVerifiedAt: new Date(),
          status: UserStatus.ACTIVE,
          updatedAt: new Date()
        },
        select: this.#userSelectOptions
      })
    );
  }

  async count() {
    return await prisma.user.count({
      where: this.#notDeletedWhere
    });
  }

  // Advanced query method với search, filter, sort
  async findWithAdvancedQuery(queryOptions = {}) {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      sortBy = 'createdAt', 
      order = 'desc',
      filters = {}
    } = queryOptions;

    // Build where clause với search và filters
    const searchableFields = ['username', 'email', 'fullname', 'phone'];
    const baseWhere = this.#notDeletedWhere;
    
    const filterWhere = buildWhereClause(
      { search, ...filters },
      searchableFields
    );

    const where = {
      AND: [baseWhere, filterWhere]
    };

    // Build pagination
    const { skip, take } = buildPagination(page, limit);

    // Build sort
    const orderBy = buildSort(sortBy, order);

    // Execute queries
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        select: this.#userSelectOptions,
        orderBy
      }),
      prisma.user.count({ where })
    ]);

    return formatPaginatedResponse(users, total, page, take);
  }

  // Lấy danh sách tất cả permissions của user theo role
  async getUserPermissions(userId) {
    const result = await prisma.user.findUnique({
      where: { id: userId, ...this.#notDeletedWhere },
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
        ...this.#notDeletedWhere
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
        ...this.#notDeletedWhere
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
        ...this.#notDeletedWhere
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

  // Check user có quản lý bất kỳ store nào không (manager cửa hàng cố định)
  async isStoreManager(userId) {
    const userStores = await prisma.userStore.findFirst({
      where: {
        userId: userId,
        user: this.#notDeletedWhere
      },
      select: {
        id: true
      }
    });

    return !!userStores;
  }

  // Check user có quản lý tất cả stores không (manager toàn bộ)
  async isStoreManagerAll(userId) {
    return await this.hasPermission(userId, 'store:manager_all');
  }

  // Lấy danh sách storeIds mà user quản lý
  async getUserStoreIds(userId) {
    const userStores = await prisma.userStore.findMany({
      where: {
        userId: userId,
        user: this.#notDeletedWhere
      },
      select: {
        storeId: true
      }
    });

    return userStores.map(us => us.storeId);
  }

  // Lấy danh sách stores đầy đủ thông tin mà user quản lý
  async getUserStores(userId) {
    return await prisma.userStore.findMany({
      where: {
        userId: userId,
        user: this.#notDeletedWhere
      },
      select: {
        store: {
          select: {
            id: true,
            name: true,
            address: true,
            isActive: true,
            createdAt: true,
            updatedAt: true
          }
        }
      }
    }).then(results => results.map(r => r.store));
  }

  // Check user có quyền manage store cụ thể không
  async canManageStore(userId, storeId) {
    const userStore = await prisma.userStore.findUnique({
      where: {
        userId_storeId: {
          userId: userId,
          storeId: storeId
        }
      },
      select: {
        userId: true
      }
    });

    return !!userStore;
  }

  // Check user có manage_managers permission cho store (có thể thêm/xóa người quản lý khác)
  async canManageStoreManagers(userId, storeId) {
    // Nếu user là admin hoặc có permission store:manage_managers thì có thể quản lý
    const hasGlobalPermission = await this.hasPermission(userId, 'store:manage_managers');
    
    if (hasGlobalPermission) {
      return true;
    }

    // Hoặc nếu user manage store đó, mặc định cũng có thể quản lý managers
    return await this.canManageStore(userId, storeId);
  }

  // Check user có quyền manage warehouse cụ thể không
  async canManageWarehouse(userId, warehouseId) {
    const warehouseManage = await prisma.warehouseManage.findUnique({
      where: {
        userId_warehouseId: {
          userId: userId,
          warehouseId: warehouseId
        }
      },
      select: {
        userId: true
      }
    });

    return !!warehouseManage;
  }

  // Check user có manage_managers permission cho warehouse (có thể thêm/xóa người quản lý khác)
  async canManageWarehouseManagers(userId, warehouseId) {
    // Nếu user là admin hoặc có permission warehouse:manage_managers thì có thể quản lý
    const hasGlobalPermission = await this.hasPermission(userId, 'warehouse:manage_managers');
    
    if (hasGlobalPermission) {
      return true;
    }

    // Hoặc nếu user manage warehouse đó, mặc định cũng có thể quản lý managers
    return await this.canManageWarehouse(userId, warehouseId);
  }
}

// Export singleton instance
export const userRepository = new UserRepository();