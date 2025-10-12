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

  //warehouse ACTIVE
  async findActiveById(id) {
    return await prisma.warehouse.findFirst({
      where: { 
        id: parseInt(id),
        status: 'ACTIVE'
      },
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
        data: warehouseData,
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
      status,                  
      createdFrom,
      createdTo
    } = queryOptions;

    const where = {};

    // Status: có thì lọc theo, không có thì lấy tất cả
    if (status === 'ACTIVE' || status === 'INACTIVE') {
      where.status = status;
    }

    // Search trong name, address
    if (search) {
      const searchLower = search.toLowerCase();
      where.OR = [
        { name: { contains: searchLower } },
        { address: { contains: searchLower } }
      ];
    }

    // Date range
    if (createdFrom || createdTo) {
      where.createdAt = {};
      if (createdFrom) where.createdAt.gte = new Date(createdFrom);
      if (createdTo) where.createdAt.lte = new Date(createdTo);
    }

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



  async exists(id) {
    const count = await prisma.warehouse.count({
      where: { 
        id: parseInt(id),
        status: 'ACTIVE'
      }
    });
    return count > 0;
  }

  // Check exists cả INACTIVE
  async existsIncludingInactive(id) {
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

  async changeStatus(id, status) {
    return await withPrismaErrorHandling(
      () => prisma.warehouse.update({
        where: { id: parseInt(id) },
        data: { 
          status, 
          updatedAt: new Date() 
        },
        select: this.#warehouseSelectOptions
      }),
      {}
    );
  }
}

export const warehouseRepository = new WarehouseRepository();