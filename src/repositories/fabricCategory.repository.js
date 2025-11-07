import { PrismaClient } from '@prisma/client';
import { withPrismaErrorHandling } from '../utils/prisma-error-handler.js';
import { buildPagination, buildSort, formatPaginatedResponse } from '../utils/query-builder.js';

const prisma = new PrismaClient();

class FabricCategoryRepository {
  //  Các field cần select
  #selectOptions = {
    id: true,
    name: true,
    description: true,
    sellingPricePerMeter: true,
    sellingPricePerRoll: true,
    createdAt: true,
    updatedAt: true,
  };

  /**  Lấy tất cả */
  async findAll() {
    return await prisma.fabricCategory.findMany({
      select: this.#selectOptions
    });
  }

  /**  Lấy theo ID */
  async findById(id) {
    return await prisma.fabricCategory.findUnique({
      where: { id: Number(id) },
      select: this.#selectOptions
    });
  }

  /**  Tạo mới */
  async create(categoryData) {
    return await withPrismaErrorHandling(
      () =>
        prisma.fabricCategory.create({
          data: categoryData,
          select: this.#selectOptions
        }),
      {
        name: 'Loại vải này đã tồn tại trong hệ thống'
      }
    );
  }

  /**  Cập nhật theo ID */
  async updateById(id, categoryData) {
    return await withPrismaErrorHandling(
      () =>
        prisma.fabricCategory.update({
          where: { id: Number(id) },
          data: categoryData,
          select: this.#selectOptions
        }),
      {
        name: 'Loại vải này đã tồn tại trong hệ thống'
      }
    );
  }
  async countFabricsInCategory(categoryId) {
    return prisma.fabric.count({
      where: { categoryId}
    });
  }

  async deleteById(id) {
    return prisma.fabricCategory.delete({
      where: { id }
    });
  }

  /**  Đếm tổng */
  async count(where = {}) {
    return await prisma.fabricCategory.count({ where });
  }

  /**  Phân trang cơ bản */
  async findWithPagination(page = 1, limit = 10) {
    const { skip, take } = buildPagination(page, limit);

    const [items, total] = await Promise.all([
      prisma.fabricCategory.findMany({
        skip,
        take,
        select: this.#selectOptions,
        orderBy: { createdAt: 'desc' }
      }),
      this.count()
    ]);

    return formatPaginatedResponse(items, total, page, take);
  }

  /**  Filter + Search + Sort + Pagination nâng cao */
  async findWithAdvancedQuery(queryOptions = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'createdAt',
      order = 'desc',
    } = queryOptions;

    const where = {};

    // Tìm kiếm theo name hoặc description
  if (search) {
    where.name = { contains: search };
  }

    const { skip, take } = buildPagination(page, limit);
    const orderBy = buildSort(sortBy, order, {
      name: 'name',
      createdAt: 'createdAt',
      sellingPricePerMeter: 'sellingPricePerMeter',
      sellingPricePerRoll: 'sellingPricePerRoll'
    });

    const [items, total] = await Promise.all([
      prisma.fabricCategory.findMany({
        where,
        skip,
        take,
        select: this.#selectOptions,
        orderBy
      }),
      prisma.fabricCategory.count({ where })
    ]);

    return formatPaginatedResponse(items, total, page, take);
  }
}

export default new FabricCategoryRepository();
