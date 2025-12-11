import { PrismaClient } from '@prisma/client';
import { withPrismaErrorHandling } from '../utils/prisma-error-handler.js';
import {
  buildWhereClause,
  buildPagination,
  buildSort,
  formatPaginatedResponse
} from '../utils/query-builder.js';
import { UserRepository } from './user.repository.js';
import { PERMISSIONS } from '../constants/permissions.js';

const prisma = new PrismaClient();
const userRepository = new UserRepository();

export class StoreRepository {
  #storeSelectOptions = {
    id: true,
    name: true,
    address: true,
    latitude: true,
    longitude: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
  };
  
  async findById(storeId) {
    return prisma.store.findUnique({
      where: { id: parseInt(storeId) },
      select: {
        id: true,
        name: true,
        address: true,
        latitude: true,
        longitude: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        fabrics: {
          select: {
            totalValue: true,
            totalMeters: true,
            uncutRolls: true,
            cuttingRollMeters: true,
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
                    name: true,
                    hexCode: true
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

  async findWithAdvancedQuery(queryOptions = {}, userId = null) {
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

    // If userId provided, check if user has manager_all permission
    // Only filter by assigned stores if they don't have global access
    if (userId) {
      const hasGlobalAccess = await userRepository.hasPermission(userId, PERMISSIONS.STORES.MANAGER_ALL.key);
      if (!hasGlobalAccess) {
        where.managers = {
          some: {
            userId: userId
          }
        };
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

  async findByIds(storeIds) {
    return prisma.store.findMany({
      where: {
        id: { in: storeIds }
      },
      select: this.#storeSelectOptions
    });
  }
}

export const storeRepository = new StoreRepository();
