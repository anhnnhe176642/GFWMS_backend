import { PrismaClient } from '@prisma/client';
import { buildWhereClause, buildSort, formatPaginatedResponse } from '../utils/query-builder.js';

const prisma = new PrismaClient();

export class ExportFabricRepository {
  // 🔹 Select rút gọn cho danh sách (get all)
  #exportFabricListSelect = {
    id: true,
    warehouse: { select: { id: true, name: true } },
    store: { select: { id: true, name: true } },
    status: true,
    note: true,
    createdAt: true,
    createdBy: { select: { username: true } },
  };

  // 🔹 Select chi tiết (get detail)
  #exportFabricDetailSelect = {
    id: true,
    warehouseId: true,
    warehouse: { select: { id: true, name: true } },
    storeId: true,
    store: { select: { id: true, name: true } },
    status: true,
    note: true,
    createdAt: true,
    updatedAt: true,
    createdById: true,
    createdBy: { select: { id: true, username: true, email: true } },
    receivedById: true,
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

  /** 🔹 Lấy tất cả (ít trường, không chi tiết exportItems) */
  async findAll() {
    return await prisma.exportFabric.findMany({
      select: this.#exportFabricListSelect,
      orderBy: { createdAt: 'desc' }
    });
  }

  /** 🔹 Lấy chi tiết theo ID (đầy đủ quan hệ) */
  async findById(id) {
    return await prisma.exportFabric.findUnique({
      where: { id },
      select: this.#exportFabricDetailSelect
    });
  }

  /** 🔹 Lấy danh sách có phân trang (dùng select rút gọn) */
  async findWithPagination(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [exportFabrics, total] = await Promise.all([
      prisma.exportFabric.findMany({
        skip,
        take: limit,
        select: this.#exportFabricListSelect,
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

  /** 🔹 Lấy danh sách nâng cao (lọc, tìm kiếm, sắp xếp, phân trang) */
  async findWithAdvancedQuery(queryOptions = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'createdAt',
      order = 'desc',
      filters = {}
    } = queryOptions;

    const searchableFields = [
      'note',
      'warehouse.name',
      'store.name',
      'createdBy.username',
      'receivedBy.username'
    ];

    const where = buildWhereClause({ search, ...filters }, searchableFields);
    const skip = (page - 1) * limit;
    const orderBy = buildSort(sortBy, order);

    const [exportFabrics, total] = await Promise.all([
      prisma.exportFabric.findMany({
        where,
        select: this.#exportFabricListSelect,
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
