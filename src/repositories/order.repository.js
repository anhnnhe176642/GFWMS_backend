import { PrismaClient } from '@prisma/client';

import { buildWhereClause, buildPagination, buildSort, formatPaginatedResponse } from '../utils/query-builder.js';

const prisma = new PrismaClient();

export class OrderRepository {
  #orderSelectOptions = {
    id: true,
    userId: true,
    orderDate: true,
    status: true,
    totalAmount: true,
    notes: true,
    createdAt: true,
    updatedAt: true,
    orderItems: {
      select: {
        id: true,
        fabricId: true,
        quantity: true,
        price: true,
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
            gloss: { select: { id: true, description: true } }
          }
        }
      }
    },
    invoice: {
      select: {
        id: true,
        invoiceDate: true,
        invoiceStatus: true,
        totalAmount: true
      }
    }
  };

  async findByCustomer(customerId, queryOptions = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'createdAt',
      order = 'desc',
      filters = {}
    } = queryOptions;

    const searchableFields = ['user.username', 'user.email'];
    const where = buildWhereClause({ search, ...filters }, searchableFields);

    // ensure filtering by customer
    where.userId = customerId;

    // status filter normalization
    if (Array.isArray(filters.status)) {
      where.status = { in: filters.status };
    } else if (filters.status) {
      where.status = filters.status;
    }

    const { skip, take } = buildPagination(page, limit);
    const orderBy = buildSort(sortBy, order);

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take,
        orderBy,
        select: this.#orderSelectOptions
      }),
      prisma.order.count({ where })
    ]);

    return formatPaginatedResponse(orders, total, page, take);
  }

  async getStatusSummaryByCustomer(customerId) {
    const groups = await prisma.order.groupBy({
      by: ['status'],
      where: { userId: customerId },
      _count: { _all: true }
    });

    // convert to { STATUS: count, ... }
    return groups.reduce((acc, g) => {
      acc[g.status] = g._count._all;
      return acc;
    }, {});
  }
}

export const orderRepository = new OrderRepository();
