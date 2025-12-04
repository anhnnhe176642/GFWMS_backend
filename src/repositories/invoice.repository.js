import { PrismaClient } from '@prisma/client';
import {
  buildWhereClause,
  buildSort,
  formatPaginatedResponse
} from '../utils/query-builder.js';

const prisma = new PrismaClient();

export class InvoiceRepository {
  //  Select options cho danh sách (GET ALL)
  #invoiceListSelectOptions = {
    id: true,
    orderId: true,
    order: {
      select: {
        id: true,
        orderDate: true,
        status: true,
        totalAmount: true,
        user: {
          select: {
            id: true,
            username: true
          }
        }
      }
    },
    invoiceDate: true,
    dueDate: true,
    invoiceStatus: true,
    totalAmount: true,
    createdAt: true,
    updatedAt: true
  };

  //  Select options cho chi tiết (GET DETAIL)
  #invoiceDetailSelectOptions = {
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
                  select: { id: true, description: true }
                },
                category: { select: { id: true, name: true } },
                color: { select: { id: true, name: true } },
                supplier: { select: { id: true, name: true, phone: true, address: true } }
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

  /**  Lấy tất cả Invoice (danh sách) */
  async findAll() {
    return await prisma.invoice.findMany({
      select: this.#invoiceListSelectOptions,
      orderBy: { createdAt: 'desc' }
    });
  }

  /**  Lấy Invoice theo ID (chi tiết) */
  async findById(id) {
    return await prisma.invoice.findUnique({
      where: { id },
      select: this.#invoiceDetailSelectOptions
    });
  }

  /**  Đếm tổng số Invoice */
  async count(filters = {}) {
    const where = { ...filters };
    if (filters.invoiceStatus && Array.isArray(filters.invoiceStatus)) {
      where.invoiceStatus = { in: filters.invoiceStatus };
    }
    return await prisma.invoice.count({ where });
  }

  /**  Lấy danh sách có phân trang */
  async findWithPagination(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        skip,
        take: limit,
        select: this.#invoiceListSelectOptions,
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

  /**
   *  Tìm kiếm nâng cao với filter, sort, pagination
   * @param {object} queryOptions
   * @param {boolean} detail - true nếu muốn lấy chi tiết, false lấy danh sách
   */
  async findWithAdvancedQuery(queryOptions = {}, detail = false) {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'createdAt',
      order = 'desc',
      filters = {}
    } = queryOptions;

    // Chọn select options: list hoặc detail
    const selectOptions = detail ? this.#invoiceDetailSelectOptions : this.#invoiceListSelectOptions;

    // Các field có thể search
    const searchableFields = ['order.user.username', 'order.user.email'];

    // Xây dựng where clause từ search + filters
    const where = buildWhereClause({ search, ...filters }, searchableFields);

    // Multi-value filter cho invoiceStatus
    if (filters.invoiceStatus) {
      if (Array.isArray(filters.invoiceStatus)) {
        where.invoiceStatus = { in: filters.invoiceStatus };
      } else {
        where.invoiceStatus = filters.invoiceStatus;
      }
    }

    // Pagination
    const skip = (page - 1) * limit;

    // Sort
    const orderBy = buildSort(sortBy, order);

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        select: selectOptions,
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
