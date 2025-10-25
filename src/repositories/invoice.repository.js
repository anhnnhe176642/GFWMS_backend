import { PrismaClient } from '@prisma/client';
import { withPrismaErrorHandling } from '../utils/prisma-error-handler.js';
import {
  buildWhereClause,
  buildPagination,
  buildSort,
  formatPaginatedResponse
} from '../utils/query-builder.js';

const prisma = new PrismaClient();

export class InvoiceRepository {
  // 🔹 Các field cần lấy, bao gồm quan hệ liên quan
#invoiceSelectOptions = {
  id: true,
  orderId: true,
  order: {
    select: {
      id: true,
      orderDate: true,
      status: true,
      totalAmount: true,
      notes: true,
      user: {
        select: {
          id: true,
          username: true,
          email: true
        }
      },
      orderItems: {
        select: {
          id: true,
          quantity: true,
          price: true,
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
              createdAt: true,
              updatedAt: true,
              gloss: {
                select: {
                  id: true,
                  description: true
                }
              },
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
              supplier: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                  address: true
                }
              }
            }
          }
        }
      }
    }
  },
  invoiceDate: true,
  dueDate: true,
  invoiceStatus: true,
  totalAmount: true,
  createdAt: true,
  updatedAt: true,
  payment: {
    select: {
      id: true,
      paymentDate: true,
      amount: true,
      paymentMethod: true,
      transactionId: true,
      notes: true
    }
  }
};


  /** 🔹 Lấy tất cả Invoice */
  async findAll() {
    return await prisma.invoice.findMany({
      select: this.#invoiceSelectOptions,
      orderBy: { createdAt: 'desc' }
    });
  }

  /** 🔹 Lấy Invoice theo ID */
  async findById(id) {
    return await prisma.invoice.findUnique({
      where: { id },
      select: this.#invoiceSelectOptions
    });
  }

  /** 🔹 Đếm tổng số Invoice */
  async count(filters = {}) {
    return await prisma.invoice.count({
      where: filters
    });
  }

  /** 🔹 Lấy danh sách có phân trang */
  async findWithPagination(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        skip,
        take: limit,
        select: this.#invoiceSelectOptions,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.invoice.count()
    ]);

    return {
      invoices,
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
      filters = {}
    } = queryOptions;

    const searchableFields = ['order.user.username', 'order.user.email'];

    const where = buildWhereClause({ search, ...filters }, searchableFields);
  if (filters.invoiceStatus) {
    where.invoiceStatus = filters.invoiceStatus;
  }
    const skip = (page - 1) * limit;
    const orderBy = buildSort(sortBy, order);

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        select: this.#invoiceSelectOptions,
        skip,
        take: limit,
        orderBy
      }),
      prisma.invoice.count({ where })
    ]);

    return formatPaginatedResponse(invoices, total, page, limit);
  }
}

export const invoiceRepository = new InvoiceRepository();
