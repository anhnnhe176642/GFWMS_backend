import { PrismaClient } from '@prisma/client';
import { withPrismaErrorHandling } from '../utils/prisma-error-handler.js';
import { buildPagination, buildSort, formatPaginatedResponse } from '../utils/query-builder.js';

const prisma = new PrismaClient();

class BannerRepository {
  // Chỉ các field cơ bản, không lấy BannerDiscounts
  #basicSelectOptions = {
    id: true,
    title: true,
    imageUrl: true,
    imagePublicId: true,
    description: true,
    startDate: true,
    endDate: true,
    isActive: true,
    createdAt: true,
    updatedAt: true
  };

  // Chỉ dùng cho findById khi cần chi tiết
  #detailedSelectOptions = {
    ...this.#basicSelectOptions,
    BannerDiscounts: {
      select: {
        id: true,
        code: true,
        discountType: true,
        discountValue: true,
        minQuantity: true,
        fabric: {
          select: {
            id: true,
            thickness: true,
            length: true,
            width: true,
            weight: true,
            sellingPrice: true,
            quantityInStock: true,
            category: { select: { id: true, name: true } },
            color: { select: { id: true, name: true, hexCode: true } }
          }
        }
      }
    }
  };

  /** Lấy tất cả */
  async findAll() {
    return await prisma.banner.findMany({
      select: this.#basicSelectOptions
    });
  }

  /** Lấy theo ID */
  async findById(id) {
    return await prisma.banner.findUnique({
      where: { id: Number(id) },
      select: this.#detailedSelectOptions
    });
  }

  /** Tạo mới */
  async create(bannerData) {
    return await withPrismaErrorHandling(
      () =>
        prisma.banner.create({
          data: bannerData,
          select: this.#basicSelectOptions 
        }),
    );
  }

  /** Cập nhật theo ID */
  async updateById(id, bannerData) {
    return await withPrismaErrorHandling(
      () =>
        prisma.banner.update({
          where: { id: Number(id) },
          data: bannerData,
          select: this.#basicSelectOptions 
        }),
    );
  }

  /** Xóa theo ID */
  async deleteById(id) {
    return prisma.banner.delete({
      where: { id: Number(id) }
    });
  }

  /** Đếm tổng */
  async count(where = {}) {
    return await prisma.banner.count({ where });
  }

  /** Phân trang cơ bản */
  async findWithPagination(page = 1, limit = 10) {
    const { skip, take } = buildPagination(page, limit);

    const [items, total] = await Promise.all([
      prisma.banner.findMany({
        skip,
        take,
        select: this.#basicSelectOptions ,
        orderBy: { createdAt: 'desc' }
      }),
      this.count()
    ]);

    return formatPaginatedResponse(items, total, page, take);
  }

  /** Filter + Search + Sort + Pagination nâng cao */
  async findWithAdvancedQuery(queryOptions = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'createdAt',
      order = 'desc',
      filter = {}
    } = queryOptions;

    const where = {};

    // Filter theo search
    if (search) {
      where.title = { contains: search };
    }

    // Filter theo isActive
    if (filter?.isActive !== undefined) {
      where.isActive = filter.isActive;
    }

    const { skip, take } = buildPagination(page, limit);
    const orderBy = buildSort(sortBy, order, {
      title: 'title',
      startDate: 'startDate',
      endDate: 'endDate',
      createdAt: 'createdAt'
    });

    const [items, total] = await Promise.all([
      prisma.banner.findMany({
        where,
        skip,
        take,
        select: this.#basicSelectOptions ,
        orderBy
      }),
      prisma.banner.count({ where })
    ]);

    return formatPaginatedResponse(items, total, page, take);
  }

  async countDiscountsInBanner(bannerId) {
    return prisma.bannerDiscount.count({
      where: { bannerId: Number(bannerId) }
  });
}
}

export default new BannerRepository();
