// src/repositories/exportFabric.repository.js
import { PrismaClient } from '@prisma/client';
import { buildWhereClause, buildSort, formatPaginatedResponse } from '../utils/query-builder.js';

const prisma = new PrismaClient();

export class ExportFabricRepository {
  // 🔹 Chỉ định các field cần lấy, bao gồm quan hệ liên quan
  #exportFabricSelectOptions = {
    id: true,
    warehouseId: true,
    warehouse: { select: { id: true, name: true } },
    store: { select: { id: true, name: true } },
    status: true,
    note: true,
    createdAt: true,
    updatedAt: true,
    createdBy: { select: { id: true, username: true, email: true } },
    receivedBy: { select: { id: true, username: true, email: true } },
    exportItems: {
      select: {
        exportFabricId: true,
        fabricId: true,
        quantity: true,
        price: true,
        createdAt: true,
        updatedAt: true,
        fabric: {
          select: {
            id: true,
            colorId: true,
            categoryId: true,
            sellingPrice: true,
            supplierId: true
          }
        }
      }
    }
  };

  /** 🔹 Lấy tất cả ExportFabric */
  async findAll() {
    return await prisma.exportFabric.findMany({
      select: this.#exportFabricSelectOptions,
      orderBy: { createdAt: 'desc' }
    });
  }

  /** 🔹 Lấy ExportFabric theo ID */
  async findById(id) {
    return await prisma.exportFabric.findUnique({
      where: { id },
      select: this.#exportFabricSelectOptions
    });
  }

  /** 🔹 Đếm tổng số ExportFabric */
  async count(filters = {}) {
    return await prisma.exportFabric.count({
      where: filters
    });
  }

  /** 🔹 Lấy danh sách có phân trang cơ bản */
  async findWithPagination(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [exportFabrics, total] = await Promise.all([
      prisma.exportFabric.findMany({
        skip,
        take: limit,
        select: this.#exportFabricSelectOptions,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.exportFabric.count()
    ]);

    return {
      exportFabrics,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /** 🔹 Lấy danh sách nâng cao (lọc, sắp xếp, tìm kiếm, phân trang) */
  async findWithAdvancedQuery(queryOptions = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'createdAt',
      order = 'desc',
      filters = {}
    } = queryOptions;

    const searchableFields = ['note', 'warehouse.name', 'store.name', 'createdBy.username', 'receivedBy.username'];
    const where = buildWhereClause({ search, ...filters }, searchableFields);

    const skip = (page - 1) * limit;
    const orderBy = buildSort(sortBy, order);

    const [exportFabrics, total] = await Promise.all([
      prisma.exportFabric.findMany({
        where,
        select: this.#exportFabricSelectOptions,
        skip,
        take: limit,
        orderBy
      }),
      prisma.exportFabric.count({ where })
    ]);

    return formatPaginatedResponse(exportFabrics, total, page, limit);
  }
}

export const exportFabricRepository = new ExportFabricRepository();
