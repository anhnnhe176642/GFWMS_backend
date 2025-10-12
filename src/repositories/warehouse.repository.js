import { PrismaClient } from '@prisma/client';
import { withPrismaErrorHandling } from '../utils/prisma-error-handler.js';
import { buildWhereClause, buildPagination, buildSort, formatPaginatedResponse } from '../utils/query-builder.js';

const prisma = new PrismaClient();

export class WarehouseRepository {
  #warehouseSelectOptions = {
    id: true,
    name: true,
    address: true,  
    createdAt: true,
    updatedAt: true,
    // shelf: {
    //   select: {
    //     id: true,
    //     code: true,
    //     
    //     createdAt: true,
    //     updatedAt: true
    //   }
    // },
    // warehouseManages: {
    //   select: {
    //     id: true,
    //     user: {
    //       select: {
    //         id: true,
    //         username: true,
    //         fullname: true
    //       }
    //     }
    //   }
    // }
  };

  async findAll() {
    return await prisma.warehouse.findMany({
      select: this.#warehouseSelectOptions
    });
  }

  async findById(id) {
    return await prisma.warehouse.findUnique({
      where: { id: parseInt(id) },
      select: this.#warehouseSelectOptions
    });
  }

  async create(warehouseData) {
    return await withPrismaErrorHandling(
      () => prisma.warehouse.create({
        data: warehouseData,
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
        data: warehouseData,
        select: this.#warehouseSelectOptions
      }),
      {
        name: 'Tên kho đã tồn tại'
      }
    );
  }

  async count() {
    return await prisma.warehouse.count();
  }

  async findWithPagination(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    
    const [warehouses, total] = await Promise.all([
      prisma.warehouse.findMany({
        skip,
        take: limit,
        select: this.#warehouseSelectOptions,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      this.count()
    ]);

    return {
      data: warehouses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
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

  async deleteById(id) {
    return await withPrismaErrorHandling(
      () => prisma.warehouse.delete({
        where: { id: parseInt(id) }
      }),
      {}
    );
  }

  async exists(id) {
    const count = await prisma.warehouse.count({
      where: { id: parseInt(id) }
    });
    return count > 0;
  }

  async nameExists(name, excludeId = null) {
    const where = { name };
    if (excludeId) {
      where.id = { not: parseInt(excludeId) };
    }
    
    const count = await prisma.warehouse.count({ where });
    return count > 0;
  }
}

export const warehouseRepository = new WarehouseRepository();