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

    // Extract fabricId filter before passing to buildWhereClause
    const { fabricId, ...otherFilters } = filters;

    const searchableFields = ['code'];
    const where = buildWhereClause(
      { search, ...otherFilters },
      searchableFields
    );

    // Add fabricId filter if provided
    if (fabricId && fabricId.length > 0) {
      where.fabricShelf = {
        some: {
          fabricId: {
            in: fabricId.map(id => parseInt(id))
          }
        }
      };
    }

    const { skip, take } = buildPagination(page, limit);
    const orderBy = buildSort(sortBy, order);

    const [shelves, total] = await Promise.all([
      prisma.shelf.findMany({
        where,
        skip,
        take,
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
        },
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

  /**
   * Helper method to format shelves with grouped fabrics (compact format)
   * Returns only group information + total quantity, without fabric details
   * @private
   */
  #formatShelvesWithGroupedFabricsCompact(shelves, groupByFields, total, page, take) {
    const formattedData = shelves.map(shelf => {
      const fabricGroupsMap = new Map();

      shelf.fabricShelf.forEach(fs => {
        // Create group key from fabric attributes
        const groupKey = groupByFields
          .map(field => {
            if (field === 'categoryId') return `categoryId:${fs.fabric.category?.id || 'null'}`;
            if (field === 'colorId') return `colorId:${fs.fabric.color?.id || 'null'}`;
            if (field === 'glossId') return `glossId:${fs.fabric.gloss?.id || 'null'}`;
            if (field === 'supplierId') return `supplierId:${fs.fabric.supplier?.id || 'null'}`;
            return '';
          })
          .join('|');

        if (!fabricGroupsMap.has(groupKey)) {
          const groupObj = {
            totalQuantity: 0
          };

          // Add fabric group attributes only
          groupByFields.forEach(field => {
            if (field === 'categoryId') groupObj.category = fs.fabric.category;
            if (field === 'colorId') groupObj.color = fs.fabric.color;
            if (field === 'glossId') groupObj.gloss = fs.fabric.gloss;
            if (field === 'supplierId') groupObj.supplier = fs.fabric.supplier;
          });

          fabricGroupsMap.set(groupKey, groupObj);
        }

        const group = fabricGroupsMap.get(groupKey);
        group.totalQuantity += fs.quantity;
      });

      return {
        id: shelf.id,
        code: shelf.code,
        currentQuantity: shelf.currentQuantity,
        maxQuantity: shelf.maxQuantity,
        warehouseId: shelf.warehouseId,
        createdAt: shelf.createdAt,
        updatedAt: shelf.updatedAt,
        fabricGroups: Array.from(fabricGroupsMap.values())
      };
    });

    return {
      data: formattedData,
      pagination: { page, limit: take, total, totalPages: Math.ceil(total / take) }
    };
  }

  /**
   * Get shelves grouped by fabric attributes
   * Trả về kệ + vải được gom nhóm theo thuộc tính + thông tin vải chi tiết
   * @param {Object} queryOptions - Query options (page, limit, search, sortBy, order, filters)
   * @param {Array<string>} groupByFields - Fields to group by (categoryId, colorId, glossId, supplierId)
   * @param {number|null} warehouseId - Optional warehouse ID filter
   */
  async getShelvesGroupedByFabric(queryOptions = {}, groupByFields = [], warehouseId = null) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        search = '', 
        sortBy = 'createdAt', 
        order = 'desc',
        filters = {}
      } = queryOptions;

      // Extract fabricId filter before passing to buildWhereClause
      const { fabricId, ...otherFilters } = filters;

      const searchableFields = ['code'];
      let filterParams = { search, ...otherFilters };
      
      // Add warehouseId filter if provided
      if (warehouseId) {
        filterParams.warehouseId = parseInt(warehouseId);
      }

      const where = buildWhereClause(filterParams, searchableFields);

      // Add fabricId filter if provided (must be handled separately due to relationship)
      if (fabricId && fabricId.length > 0) {
        where.fabricShelf = {
          some: {
            fabricId: {
              in: fabricId.map(id => parseInt(id))
            }
          }
        };
      }

      const { skip, take } = buildPagination(page, limit);
      const orderBy = buildSort(sortBy, order);

      const [shelves, total] = await Promise.all([
        prisma.shelf.findMany({
          where,
          skip,
          take,
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
          },
          orderBy
        }),
        prisma.shelf.count({ where })
      ]);

      return this.#formatShelvesWithGroupedFabricsCompact(shelves, groupByFields, total, page, take);
    } catch (error) {
      console.error('Error in getShelvesGroupedByFabric:', error);
      throw error;
    }
  }

  /**
   * Get shelves in a warehouse grouped by fabric attributes 
   * Trả về kệ + vải được gom nhóm theo thuộc tính + thông tin vải chi tiết
   * @param {number} warehouseId - ID của kho
   * @param {Array<string>} groupByFields - Fields to group by
   * @param {Object} options - Query options (page, limit, search, etc)
   * @deprecated Use getShelvesGroupedByFabric with warehouseId parameter instead
   */
  async getShelvesInWarehouseGroupedByFabric(warehouseId, groupByFields = [], options = {}) {
    return await this.getShelvesGroupedByFabric(options, groupByFields, warehouseId);
  }

}

export const shelfRepository = new ShelfRepository();
