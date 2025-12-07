import { PrismaClient } from '@prisma/client';
import { withPrismaErrorHandling } from '../utils/prisma-error-handler.js';
import {
  buildWhereClause,
  buildPagination,
  buildSort,
  formatPaginatedResponse
} from '../utils/query-builder.js';

const prisma = new PrismaClient();

export class StoreRepository {
  #storeSelectOptions = {
    id: true,
    name: true,
    address: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
  };

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
    role: true,
    storeId: true,
    createdAt: true,
    updatedAt: true
  };
  
  async findById(storeId) {
    return prisma.store.findUnique({
      where: { id: parseInt(storeId) },
      select: {
        id: true,
        name: true,
        address: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        fabrics: {
          select: {
            quantity: true,
            fabric: {
              select: {
                id: true,
                thickness: true,
                length: true,
                width: true,
                weight: true,
                gloss: {
                  select: {
                    id: true,
                    description: true
                  }
                },
                category: {
                  select: {
                    id: true,
                    name: true
                  }
                },
                color: {
                  select: {
                    id: true,
                    name: true
                  }
                },
                supplier: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    });
  }


  async create(storeData) {
    return withPrismaErrorHandling(
      () =>
        prisma.store.create({
          data: {
            ...storeData,
            isActive: true
          },
          select: this.#storeSelectOptions
        }),
      {
        name: 'Tên cửa hàng đã tồn tại'
      }
    );
  }

  async updateById(id, storeData) {
    return withPrismaErrorHandling(
      () =>
        prisma.store.update({
          where: { id: parseInt(id) },
          data: {
            ...storeData,
            updatedAt: new Date()
          },
          select: this.#storeSelectOptions
        }),
      {
        name: 'Tên cửa hàng đã tồn tại'
      }
    );
  }

  async findWithAdvancedQuery(queryOptions = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'createdAt',
      order = 'desc',
      filters = {}
    } = queryOptions;

    const searchableFields = ['name', 'address'];
    const where = buildWhereClause({ search, ...filters }, searchableFields);
    if (filters.isActive !== undefined) {
        if (Array.isArray(filters.isActive)) {
            where.isActive = filters.isActive[0] === 'true';
        } else {
            where.isActive = filters.isActive === 'true';
        }
    }
    const { skip, take } = buildPagination(page, limit);
    const orderBy = buildSort(sortBy, order);

    const [stores, total] = await Promise.all([
      prisma.store.findMany({
        where,
        skip,
        take,
        select: this.#storeSelectOptions,
        orderBy
      }),
      prisma.store.count({ where })
    ]);

    return formatPaginatedResponse(stores, total, page, take);
  }

  async deleteById(id) {
    return withPrismaErrorHandling(() =>
      prisma.store.delete({
        where: { id: parseInt(id) }
      })
    );
  }

  async countFabricsInStore(storeId) {
    return prisma.fabricStore.count({
      where: { storeId: parseInt(storeId) }
    });
  }

  async findStaffsByStoreId(storeId, queryOptions = {}) {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      sortBy = 'createdAt', 
      order = 'desc',
      filters = {}
    } = queryOptions;

    const searchableFields = ['fullname', 'email', 'phone'];
    
    const filterWhere = buildWhereClause(
      { search, ...filters },
      searchableFields
    );

    const where = {
      storeId: parseInt(storeId),
      role: 'STAFF',
      status: { not: 'DELETED' },
      ...filterWhere
    };

    const { skip, take } = buildPagination(page, limit);
    const orderBy = buildSort(sortBy, order);

    const [staffs, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        select: this.#userSelectOptions,
        orderBy
      }),
      prisma.user.count({ where })
    ]);

    return formatPaginatedResponse(staffs, total, page, take);
  }

  /**
   * Lấy thông tin user theo ID
   */
  async findUserById(userId) {
    return await prisma.user.findFirst({
      where: { 
        id: userId,
        status: { not: 'DELETED' }
      },
      select: this.#userSelectOptions
    });
  }

  /**
   * Phân công staff cho store
   */
  async assignStaffToStore(staffId, storeId) {
    return await withPrismaErrorHandling(
      () => prisma.user.update({
        where: { id: staffId },
        data: { 
          storeId: parseInt(storeId),
          updatedAt: new Date()
        },
        select: this.#userSelectOptions
      })
    );
  }

  /**
   * Hủy phân công staff khỏi store
   */
  async unassignStaffFromStore(staffId) {
    return await withPrismaErrorHandling(
      () => prisma.user.update({
        where: { id: staffId },
        data: { 
          storeId: null,
          updatedAt: new Date()
        },
        select: this. #userSelectOptions
      })
    );
  }
}


export const storeRepository = new StoreRepository();
