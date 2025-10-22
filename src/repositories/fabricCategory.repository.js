import { PrismaClient } from '@prisma/client';
import { withPrismaErrorHandling } from '../utils/prisma-error-handler.js';
import { buildWhereClause, buildPagination, buildSort, formatPaginatedResponse } from '../utils/query-builder.js';

const prisma = new PrismaClient();

class FabricCategoryRepository {
  // Common select options
  #selectOptions = {
    id: true,
    name: true,
    description: true,
    createdAt: true,
    updatedAt: true,
  };

  async findAll() {
    return await prisma.fabricCategory.findMany({
      select: this.#selectOptions
    });
  }

  async findById(id) {
    return await prisma.fabricCategory.findUnique({
      where: { id },
      select: this.#selectOptions
    });
  }

  async create(categoryData) {
    return await withPrismaErrorHandling(
  () => prisma.fabricCategory.create({
    data: categoryData,
    select: this.#selectOptions
  }),
  {
    fabric_category_name_key: 'Tên loại vải đã tồn tại'
  }
);

  }

  async updateById(id, categoryData) {
    return await withPrismaErrorHandling(
      () => prisma.fabricCategory.update({
        where: { id },
        data: categoryData,
        select: this.#selectOptions
      }),
      {
        name: 'Name đã tồn tại'
      }
    );
  }

  async count(where = {}) {
    return await prisma.fabricCategory.count({ where });
  }

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

// Default export singleton instance
export default new FabricCategoryRepository();
