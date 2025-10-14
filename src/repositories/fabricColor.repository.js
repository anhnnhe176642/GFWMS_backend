import { PrismaClient } from '@prisma/client';
import { withPrismaErrorHandling } from '../utils/prisma-error-handler.js';
import { buildWhereClause, buildPagination, buildSort, formatPaginatedResponse } from '../utils/query-builder.js';

const prisma = new PrismaClient();

export class FabricColorRepository {
  // Common select options
  #selectOptions = {
    id: true,
    name: true,
    createdAt: true,
    updatedAt: true,
  };

  async findAll() {
    return await prisma.fabricColor.findMany({
      select: this.#selectOptions
    });
  }

  async findById(id) {
    return await prisma.fabricColor.findUnique({
      where: { id },
      select: this.#selectOptions
    });
  }

  async create(colorData) {
    return await withPrismaErrorHandling(
      () => prisma.fabricColor.create({
        data: colorData,
        select: this.#selectOptions
      }),
      {
        name: 'Name đã tồn tại'
      }
    );
  }

  async updateById(id, colorData) {
    return await withPrismaErrorHandling(
      () => prisma.fabricColor.update({
        where: { id },
        data: colorData,
        select: this.#selectOptions
      }),
      {
        name: 'Name đã tồn tại'
      }
    );
  }

  async count(where = {}) {
    return await prisma.fabricColor.count({ where });
  }

  async findWithPagination(page = 1, limit = 10) {
    const { skip, take } = buildPagination(page, limit);
    
    const [items, total] = await Promise.all([
      prisma.fabricColor.findMany({
        skip,
        take,
        select: this.#selectOptions,
        orderBy: { createdAt: 'desc' }
      }),
      this.count()
    ]);

    return formatPaginatedResponse(items, total, page, take);
  }

  async findWithAdvancedQuery(queryOptions = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'createdAt',
      order = 'desc',
    } = queryOptions;
  
    // Tạo điều kiện where
    const where = {};
  
    // Tìm kiếm theo cột "name"
    if (search) {
      where.name = { contains: search };
    }
  
    // Xây dựng phân trang và sắp xếp
    const { skip, take } = buildPagination(page, limit);
    const orderBy = buildSort(sortBy, order, {
      name: 'name',
      createdAt: 'createdAt'
    });
  
    // Thực thi truy vấn song song
    const [items, total] = await Promise.all([
      prisma.fabricColor.findMany({
        where,
        skip,
        take,
        select: this.#selectOptions,
        orderBy
      }),
      prisma.fabricColor.count({ where })
    ]);
  
    return formatPaginatedResponse(items, total, page, take);
  }
}

// Export singleton instance
export const fabricColorRepository = new FabricColorRepository();
