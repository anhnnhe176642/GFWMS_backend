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
    gloss: {
      select: { id: true, description: true }
    },
    length: true,
    width: true,
    weight: true,
    sellingPrice: true,
    quantityInStock: true,
    categoryId: true,
    category: {
      select: { id: true, name: true }
    },
    colorId: true,
    color: {
      select: { id: true, name: true }
    },
    supplierId: true,
    supplier: {
      select: { id: true, name: true }
    },
    createdAt: true,
    updatedAt: true
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

  /** 🔹 Tạo mới Fabric */
  async create(fabricData) {
    return await withPrismaErrorHandling(
      () =>
        prisma.fabric.create({
          data: fabricData,
          select: this.#fabricSelectOptions
        }),
      {
        glossId: 'Độ bóng không hợp lệ',
        categoryId: 'Danh mục không hợp lệ',
        colorId: 'Màu sắc không hợp lệ',
        supplierId: 'Nhà cung cấp không hợp lệ'
      }
    );
  }

  /** 🔹 Cập nhật Fabric */
  async updateById(id, fabricData) {
    return await withPrismaErrorHandling(
      () =>
        prisma.fabric.update({
          where: { id },
          data: fabricData,
          select: this.#fabricSelectOptions
        }),
      {
        glossId: 'Độ bóng không hợp lệ',
        categoryId: 'Danh mục không hợp lệ',
        colorId: 'Màu sắc không hợp lệ',
        supplierId: 'Nhà cung cấp không hợp lệ'
      }
    );
  }

  /** 🔹 Xóa Fabric (cứng) */
  async deleteById(id) {
    return await prisma.fabric.delete({
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

  /** 🔹 Tìm kiếm nâng cao (lọc theo màu, loại, độ bóng, nhà cung cấp, ...) */
  async findWithAdvancedQuery(queryOptions = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'createdAt',
      order = 'desc',
      filters = {}
    } = queryOptions;

    // Các trường có thể search (ví dụ: theo tên màu, loại vải, nhà cung cấp)
    const searchableFields = [
      'color.name',
      'category.name',
      'gloss.name',
      'supplier.name'
    ];

    const where = buildWhereClause(
      { search, ...filters },
      searchableFields
    );

    const { skip, take } = buildPagination(page, limit);
    const orderBy = buildSort(sortBy, order, {
      thickness: 'thickness',
      price: 'sellingPrice',
      stock: 'quantityInStock',
      created: 'createdAt'
    });

    const [fabrics, total] = await Promise.all([
      prisma.fabric.findMany({
        where,
        skip,
        take,
        select: this.#fabricSelectOptions,
        orderBy
      }),
      prisma.fabric.count({ where })
    ]);

    return formatPaginatedResponse(fabrics, total, page, take);
  }
}

export const fabricRepository = new FabricRepository();
