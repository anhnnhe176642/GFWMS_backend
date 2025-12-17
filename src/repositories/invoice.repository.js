import { PrismaClient } from '@prisma/client';
import {
  buildWhereClause,
  buildPagination,
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
  invoiceStatus: true,
  totalAmount: true,
  notes: true,          
  paymentType: true,
  paymentDeadline: true,
  creditAmount: true,
  paidAmount: true,
  createdAt: true,
  updatedAt: true
};

// Lấy chi tiết đầy đủ (GET DETAIL)
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
          saleUnit: true,
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
              gloss: { select: { id: true, description: true } },
              category: { select: { id: true, name: true } },
              color: { select: { id: true, name: true, hexCode: true } },
              supplier: { select: { id: true, name: true, phone: true, address: true } }
            }
          }
        }
      }
    }
  },
  invoiceDate: true,
  invoiceStatus: true,
  totalAmount: true,
  notes: true,
  paymentType: true,
  paymentDeadline: true,
  creditAmount: true,
  paidAmount: true,
  payment: { select: { id: true, paymentDate: true, amount: true, paymentMethod: true, transactionId: true, notes: true } },
  creditInvoiceId: true,
  creditInvoice: { select: { id: true, totalCreditAmount: true, dueDate: true } },
  createdAt: true,
  updatedAt: true
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

  /**
   *  Tìm kiếm nâng cao với filter, sort, pagination
   */
  async findWithAdvancedQuery(queryOptions = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'createdAt',
      order = 'desc',
      filters = {}
    } = queryOptions;

    // Các field có thể search
    const searchableFields = ['order.user.username', 'order.user.email', 'order.user.fullname'];

    // Xây dựng where clause từ search + filters
    const filterWhere = buildWhereClause({ search, ...filters }, searchableFields);

    const where = filterWhere;

    // Multi-value filter cho invoiceStatus
    if (filters.invoiceStatus) {
      if (Array.isArray(filters.invoiceStatus)) {
        where.invoiceStatus = { in: filters.invoiceStatus };
      } else {
        where.invoiceStatus = filters.invoiceStatus;
      }
    }

    // Pagination
    const { skip, take } = buildPagination(page, limit);

    // Sort
    const orderBy = buildSort(sortBy, order);

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        select: this.#invoiceListSelectOptions,
        skip,
        take,
        orderBy
      }),
      prisma.invoice.count({ where })
    ]);

    return formatPaginatedResponse(invoices, total, page, take);
  }

  async findByUserId(userId) {
    return await prisma.invoice.findMany({
      where: {
        order: {
          userId
        }
      },
      select: this.#invoiceDetailSelectOptions,
      orderBy: { invoiceDate: 'desc' }
    });
  }

  /**
   *  Lấy danh sách Invoice của user hiện tại với filter, sort, pagination
   */
  async findByUserIdAdvanced(userId, queryOptions = {}) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      order = 'desc',
      filters = {}
    } = queryOptions;

    // Xây dựng where clause
    const where = {
      order: {
        userId
      }
    };

    // Lọc theo trạng thái hóa đơn
    if (filters.invoiceStatus) {
      if (Array.isArray(filters.invoiceStatus)) {
        where.invoiceStatus = { in: filters.invoiceStatus };
      } else {
        where.invoiceStatus = filters.invoiceStatus;
      }
    }

    // Lọc theo date range (createdAt)
    if (filters.createdAt) {
      where.createdAt = filters.createdAt;
    }

    // Pagination
    const { skip, take } = buildPagination(page, limit);

    // Sort
    const orderBy = buildSort(sortBy, order);

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        select: this.#invoiceListSelectOptions,
        skip,
        take,
        orderBy
      }),
      prisma.invoice.count({ where })
    ]);

    return formatPaginatedResponse(invoices, total, page, take);
  }
}
export const invoiceRepository = new InvoiceRepository();
