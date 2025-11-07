import { PrismaClient } from '@prisma/client';
import { withPrismaErrorHandling } from '../utils/prisma-error-handler.js';
import { buildWhereClause, buildPagination, buildSort, formatPaginatedResponse } from '../utils/query-builder.js';

const prisma = new PrismaClient();

export class SupplierRepository {
  // Common select options
  #selectOptions = {
    id: true,
    name: true,
    address: true,
    phone: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
  };

  /**  Lấy tất cả Supplier */
  async findAll() {
    return await prisma.supplier.findMany({
      select: this.#selectOptions
    });
  }

  /**  Tìm Supplier theo ID */
  async findById(id) {
    return await prisma.supplier.findUnique({
      where: { id },
      select: this.#selectOptions
    });
  }

  /**  Tạo mới Supplier */
  async create(supplierData) {
    return await withPrismaErrorHandling(
      () => prisma.supplier.create({
        data: supplierData,
        select: this.#selectOptions
      }),
      {
        name: 'Tên nhà cung cấp đã tồn tại',
        phone: 'Số điện thoại đã tồn tại',
      }
    );
  }

  /**  Cập nhật Supplier theo ID */
  async updateById(id, supplierData) {
    return await withPrismaErrorHandling(
      () => prisma.supplier.update({
        where: { id },
        data: supplierData,
        select: this.#selectOptions
      }),
      {
        name: 'Tên nhà cung cấp đã tồn tại',
        phone: 'Số điện thoại đã tồn tại',
      }
    );
  }

  async countFabricsWithSupplier(supplierId) {
    return await prisma.fabric.count({
      where: { supplierId },
    });
  }

  async deleteById(id) {
    return await prisma.supplier.delete({
      where: { id },
    });
  }


  /**  Đếm tổng số Supplier */
  async count(where = {}) {
    return await prisma.supplier.count({ where });
  }

  /**  Phân trang cơ bản */
  async findWithPagination(page = 1, limit = 10) {
    const { skip, take } = buildPagination(page, limit);

    const [items, total] = await Promise.all([
      prisma.supplier.findMany({
        skip,
        take,
        select: this.#selectOptions,
        orderBy: { createdAt: 'desc' }
      }),
      this.count()
    ]);

    return formatPaginatedResponse(items, total, page, take);
  }

  /**  Truy vấn nâng cao: search, sort, pagination, filter */
  async findWithAdvancedQuery(queryOptions = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'createdAt',
      order = 'desc',
      filters = {}
    } = queryOptions;

    // Build where clause (search + filter)
    const searchableFields = ['name', 'address', 'phone'];
    const where = buildWhereClause({ search, ...filters }, searchableFields);

    // Phân trang và sắp xếp
    const { skip, take } = buildPagination(page, limit);
    const orderBy = buildSort(sortBy, order, {
      name: 'name',
      createdAt: 'createdAt',
      updatedAt: 'updatedAt'
    });

    // Thực thi song song
    const [items, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        skip,
        take,
        select: this.#selectOptions,
        orderBy
      }),
      prisma.supplier.count({ where })
    ]);

    return formatPaginatedResponse(items, total, page, take);
  }
}

// Export singleton instance
export const supplierRepository = new SupplierRepository();
