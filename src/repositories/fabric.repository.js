import { PrismaClient } from '@prisma/client';
import { withPrismaErrorHandling } from '../utils/prisma-error-handler.js';
import { buildWhereClause, buildPagination, buildSort, formatPaginatedResponse } from '../utils/query-builder.js';

const prisma = new PrismaClient();

export class FabricRepository {
  // Chỉ định các field cần lấy, bao gồm các quan hệ liên quan
  #fabricSelectOptions = {
    id: true,
    thickness: true,
    glossId: true,
    gloss: { select: { id: true, description: true } },
    length: true,
    width: true,
    weight: true,
    sellingPrice: true,
    quantityInStock: true,
    categoryId: true,
    category: { select: { id: true, name: true } },
    colorId: true,
    color: { select: { id: true, name: true } },
    supplierId: true,
    supplier: { select: { id: true, name: true } },
    createdAt: true,
    updatedAt: true,
  };

  /** 🔹 Lấy tất cả Fabric */
  async findAll() {
    return await prisma.fabric.findMany({
      select: this.#fabricSelectOptions,
      orderBy: { createdAt: 'desc' }
    });
  }

  /** 🔹 Lấy Fabric theo ID */
  async findById(id) {
    return await prisma.fabric.findUnique({
      where: { id },
      select: this.#fabricSelectOptions
    });
  }



  /** 🔹 Đếm tổng số Fabric */
  async count(filters = {}) {
    return await prisma.fabric.count({
      where: filters
    });
  }

  /** 🔹 Lấy danh sách có phân trang */
  async findWithPagination(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [fabrics, total] = await Promise.all([
      prisma.fabric.findMany({
        skip,
        take: limit,
        select: this.#fabricSelectOptions,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.fabric.count()
    ]);

    return {
      fabrics,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /** 🔹 Tìm kiếm nâng cao với filter, sort, pagination */
  async findWithAdvancedQuery(queryOptions = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'createdAt',
      order = 'desc',
      filters = {},
    } = queryOptions;

    const searchableFields = [
      'category.name',
      'color.name',
      'supplier.name'
    ];

    // Build where clause (case-sensitive search)
    const where = buildWhereClause({ search, ...filters }, searchableFields);

    const skip = (page - 1) * limit;
    const orderBy = buildSort(sortBy, order);

    // Lấy dữ liệu và đếm tổng số
    const [fabrics, total] = await Promise.all([
      prisma.fabric.findMany({
        where,
        select: this.#fabricSelectOptions,
        skip,
        take: limit,
        orderBy,
      }),
      prisma.fabric.count({ where }), 
    ]);

    return formatPaginatedResponse(fabrics, total, page, limit);
  }
}

export const fabricRepository = new FabricRepository();
