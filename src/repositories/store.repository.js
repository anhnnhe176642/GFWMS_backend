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

}

export const storeRepository = new StoreRepository();
