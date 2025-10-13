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

    // Build where clause (case-sensitive search)
    const where = this.buildWhereClause({ search, filters });

    const skip = (page - 1) * limit;
    const orderBy = this.buildOrderBy(sortBy, order);

    // Lấy dữ liệu và đếm tổng số
    const [fabrics, total] = await Promise.all([
      prisma.fabric.findMany({
        where,
        select: this.#fabricSelectOptions,
        skip,
        take: limit,
        orderBy,
      }),
      prisma.fabric.count({ where }), // mode: 'insensitive' đã bỏ
    ]);

    return formatPaginatedResponse(fabrics, total, page, limit);
  }

 buildWhereClause = ({ search, filters }) => {
  const where = {};

  // ✅ Xác định kiểu dữ liệu cho từng field
  const fieldTypeMap = {
    colorId: 'string',
    categoryId: 'int',
    glossId: 'int',
    supplierId: 'int',
  };

  const addFilter = (field, value) => {
    if (value === undefined || value === null) return;

    const type = fieldTypeMap[field];
    const toCorrectType = (v) => {
      const trimmed = v.trim();
      if (type === 'int') {
        if (!/^\d+$/.test(trimmed)) {
          // Nếu user nhập chữ mà field là Int → báo lỗi
          throw new Error(`${field} không hợp lệ: phải là số`);
        }
        return Number(trimmed);
      }
      return trimmed; // string giữ nguyên
    };

    if (Array.isArray(value)) {
      const processed = value.map(v => toCorrectType(v));
      where[field] = processed.length > 1 ? { in: processed } : processed[0];
    } else {
      where[field] = toCorrectType(value);
    }
  };

  // 🔹 Áp dụng filter theo kiểu dữ liệu từng field
  addFilter('colorId', filters.colorId);
  addFilter('categoryId', filters.categoryId);
  addFilter('glossId', filters.glossId);
  addFilter('supplierId', filters.supplierId);

  // 🔍 Search text trong các quan hệ
  if (search) {
    where.OR = [
      { color: { name: { contains: search } } },
      { category: { name: { contains: search } } },
      { gloss: { description: { contains: search } } },
      { supplier: { name: { contains: search } } },
    ];
  }

  return where;
};



  buildOrderBy(sortBy, order) {
    const sortMapping = {
      thickness: 'thickness',
      price: 'sellingPrice',
      stock: 'quantityInStock',
      created: 'createdAt',
    };

    const field = sortMapping[sortBy] || 'createdAt';
    return { [field]: order };
  }
}

export const fabricRepository = new FabricRepository();
