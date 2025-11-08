import { PrismaClient } from '@prisma/client';
import { withPrismaErrorHandling } from '../utils/prisma-error-handler.js';
import { buildWhereClause, buildPagination, buildSort, formatPaginatedResponse } from '../utils/query-builder.js';

const prisma = new PrismaClient();

export class ShelfRepository {
  #shelfSelectOptions = {
    id: true,
    code: true,
    currentQuantity: true,
    maxQuantity: true,
    warehouseId: true,
    createdAt: true,
    updatedAt: true
  };

  async findById(id) {
    return await prisma.shelf.findUnique({
      where: { id: parseInt(id) },
      select: {
        ...this.#shelfSelectOptions,
        fabricShelf: {
          select: {
            fabricId: true,
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
                    name: true,
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
                    name: true,
                  }
                }
              }
            }
          }
        }
      }
    });
  }


  async create(shelfData) {
    return await withPrismaErrorHandling(
      () => prisma.shelf.create({
        data: {
          ...shelfData,
          currentQuantity: 0
        },
        select: this.#shelfSelectOptions
      }),
      {
        code: 'Mã kệ đã tồn tại'
      }
    );
  }


  async updateById(id, shelfData) {
    return await withPrismaErrorHandling(
      () => prisma.shelf.update({
        where: { id: parseInt(id) },
        data: {
          ...shelfData,
          updatedAt: new Date()
        },
        select: this.#shelfSelectOptions
      }),
      {
        code: 'Mã kệ đã tồn tại'
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

    const searchableFields = ['code'];
    const where = buildWhereClause(
      { search, ...filters },
      searchableFields
    );

    const { skip, take } = buildPagination(page, limit);
    const orderBy = buildSort(sortBy, order);

    const [shelves, total] = await Promise.all([
      prisma.shelf.findMany({
        where,
        skip,
        take,
        select: this.#shelfSelectOptions,
        orderBy
      }),
      prisma.shelf.count({ where })
    ]);

    return formatPaginatedResponse(shelves, total, page, take);
  }


  async codeExists(code, excludeId = null) {
    const where = { code };
    if (excludeId) {
      where.id = { not: parseInt(excludeId) };
    }

    const count = await prisma.shelf.count({ where });
    return count > 0;
  }


  async deleteById(id) {
    return await withPrismaErrorHandling(
      () => prisma.shelf.delete({
        where: { id: parseInt(id) }
      })
    );
  }

  async countFabricsOnShelf(shelfId) {
    const result = await prisma.fabricShelf.aggregate({
      _sum: { quantity: true },
      where: { shelfId: Number(shelfId) }
    });

    return result._sum.quantity || 0;
  }

}

export const shelfRepository = new ShelfRepository();
