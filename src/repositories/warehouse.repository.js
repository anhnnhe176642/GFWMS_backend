import { PrismaClient } from '@prisma/client';
import { withPrismaErrorHandling } from '../utils/prisma-error-handler.js';
import { buildWhereClause, buildPagination, buildSort, formatPaginatedResponse } from '../utils/query-builder.js';

const prisma = new PrismaClient();

export class WarehouseRepository {
  #warehouseSelectOptions = {
    id: true,
    name: true,
    address: true,
    status: true,
    createdAt: true,
    updatedAt: true,
  };

  async findById(id) {
    return await prisma.warehouse.findUnique({
      where: { id: parseInt(id) },
      select: this.#warehouseSelectOptions
    });
  }

  async create(warehouseData) {
    return await withPrismaErrorHandling(
      () => prisma.warehouse.create({
        data: {
          ...warehouseData,
          status: 'ACTIVE'
        },
        select: this.#warehouseSelectOptions
      }),
      {
        name: 'Tên kho đã tồn tại'
      }
    );
  }

  async updateById(id, warehouseData) {
    return await withPrismaErrorHandling(
      () => prisma.warehouse.update({
        where: { id: parseInt(id) },
        data: {
          ...warehouseData,
          updatedAt: new Date()
        },
        select: this.#warehouseSelectOptions
      }),
      {
        name: 'Tên kho đã tồn tại'
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
    const where = buildWhereClause(
      { search, ...filters },
      searchableFields
    );
    const { skip, take } = buildPagination(page, limit);
    
    const orderBy = buildSort(sortBy, order);


    const [warehouses, total] = await Promise.all([
      prisma.warehouse.findMany({
        where,
        skip,
        take,
        select: this.#warehouseSelectOptions,
        orderBy
      }),
      prisma.warehouse.count({ where })
    ]);

    return formatPaginatedResponse(warehouses, total, page, take);
  }

  async nameExists(name, excludeId = null) {
    const where = { name };
    if (excludeId) {
      where.id = { not: parseInt(excludeId) };
    }
    
    const count = await prisma.warehouse.count({ where });
    return count > 0;
  }



  async deleteById(id) {
  return await withPrismaErrorHandling(
      () => prisma.warehouse.delete({
        where: { id: parseInt(id) }
      })
    );
}
}

export const warehouseRepository = new WarehouseRepository();