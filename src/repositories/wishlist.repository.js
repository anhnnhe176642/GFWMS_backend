import { PrismaClient } from '@prisma/client';
import { withPrismaErrorHandling } from '../utils/prisma-error-handler.js';
import { buildWhereClause, buildPagination, buildSort, formatPaginatedResponse } from '../utils/query-builder.js';

const prisma = new PrismaClient();

export class WishlistRepository {
  #selectOptions = {
    id: true,
    userId: true,
    fabricId: true,
    createdAt: true,
    updatedAt: true,
    fabric: {
      select: {
        id: true,
        thickness: true,
        length: true,
        width: true,
        weight: true,
        sellingPrice: true,
        quantityInStock: true,
        category: {
          select: {
            id: true,
            name: true
          }
        },
        color: {
          select: {
            id: true,
            name: true
          }
        },
        gloss: {
          select: {
            id: true, 
            description: true
          }
        }
      }
    }
  };

  async findByUser(userId, queryOptions = {}) {
    const { 
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      order = 'desc'
    } = queryOptions;

    const where = { userId };
    const { skip, take } = buildPagination(page, limit);
    const orderBy = buildSort(sortBy, order);

    const [items, total] = await Promise.all([
      prisma.wishlist.findMany({
        where,
        skip,
        take,
        orderBy,
        select: this.#selectOptions
      }),
      prisma.wishlist.count({ where })
    ]);

    return formatPaginatedResponse(items, total, page, take);
  }

  async addItem(userId, fabricId) {
    return await withPrismaErrorHandling(
      () => prisma.wishlist.create({
        data: { userId, fabricId },
        select: this.#selectOptions
      }),
      {
        unique: 'Sản phẩm đã có trong danh sách yêu thích'
      }
    );
  }

  async removeItem(userId, fabricId) {
    return await prisma.wishlist.delete({
      where: {
        userId_fabricId: {
          userId,
          fabricId
        }
      }
    });
  }

  async checkExists(userId, fabricId) {
    const count = await prisma.wishlist.count({
      where: {
        userId,
        fabricId
      }
    });
    return count > 0;
  }
}

export const wishlistRepository = new WishlistRepository();