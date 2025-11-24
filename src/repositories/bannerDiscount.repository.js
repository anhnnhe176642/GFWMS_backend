import { PrismaClient } from '@prisma/client';
import { withPrismaErrorHandling } from '../utils/prisma-error-handler.js';
import { buildPagination, formatPaginatedResponse } from '../utils/query-builder.js';

const prisma = new PrismaClient();

class BannerDiscountRepository {
  // Các field cần select
  #selectOptions = {
    id: true,
    code: true,
    bannerId: true,
    fabricId: true,
    discountType: true,
    discountValue: true,
    minQuantity: true,
    banner: {
      select: {
        id: true,
        title: true,
        imageUrl: true,
      }
    },
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
      color: { select: { id: true, name: true } },
      supplier: { select: { id: true, name: true } },
    }
  }

  };

  /** Lấy tất cả */
  async findAll() {
    return prisma.bannerDiscount.findMany({ select: this.#selectOptions });
  }

  /** Lấy theo ID */
  async findById(id) {
    return prisma.bannerDiscount.findUnique({
      where: { id: Number(id) },
      select: this.#selectOptions
    });
  }

  /** Lấy theo code */
  async findByCode(code) {
    return prisma.bannerDiscount.findUnique({
      where: { code },
      select: this.#selectOptions
    });
  }

  /** Tạo mới */
  async create(data) {
    return withPrismaErrorHandling(
      () => prisma.bannerDiscount.create({
        data,
        select: this.#selectOptions
      }),
      { code: 'Banner discount với code này đã tồn tại' }
    );
  }

  /** Cập nhật theo ID */
  async updateById(id, data) {
    return withPrismaErrorHandling(
      () => prisma.bannerDiscount.update({
        where: { id: Number(id) },
        data,
        select: this.#selectOptions
      }),
      { code: 'Banner discount với code này đã tồn tại' }
    );
  }

  /** Xóa theo ID */
  async deleteById(id) {
    return prisma.bannerDiscount.delete({
      where: { id: Number(id) }
    });
  }

  /** Filter + Pagination nâng cao */
  async findWithAdvancedQuery({ page = 1, limit = 10, bannerId, fabricId }) {
    const where = {};

    if (bannerId) where.bannerId = Number(bannerId);
    if (fabricId) where.fabricId = Number(fabricId);

    const { skip, take } = buildPagination(page, limit);

    const [items, total] = await Promise.all([
      prisma.bannerDiscount.findMany({
        where,
        skip,
        take,
        select: this.#selectOptions,
        orderBy: { id: 'desc' }
      }),
      prisma.bannerDiscount.count({ where })
    ]);

    return formatPaginatedResponse(items, total, page, take);
  }
}

export default new BannerDiscountRepository();
