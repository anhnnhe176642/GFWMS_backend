import { PrismaClient, RegistrationStatus } from '@prisma/client';
import { withPrismaErrorHandling } from '../utils/prisma-error-handler.js';
import { 
  buildWhereClause, 
  buildPagination, 
  buildSort, 
  formatPaginatedResponse 
} from '../utils/query-builder.js';

const prisma = new PrismaClient();

class CreditRegistrationRepository {

  // Select fields chuẩn
  #selectFields = {
    id: true,
    userId: true,
    creditLimit: true,
    approvedBy: true,
    approvalDate: true,
    status: true,
    createdAt: true,
    updatedAt: true,
    user: {
      select: {
        id: true,
        username: true,
        fullname: true,
        email: true
      }
    },
    approver: {
      select: {
        id: true,
        username: true,
        fullname: true
      }
    }
  };

  async create(data) {
    return await withPrismaErrorHandling(
      () =>
        prisma.creditRegistration.create({
          data,
          select: this.#selectFields
        }),
      {
        userId: 'User này đã có Credit Registration trước đó'
      }
    );
  }

  async findById(id) {
    return prisma.creditRegistration.findUnique({
      where: { id },
      select: this.#selectFields
    });
  }

  async findByUserId(userId) {
    return prisma.creditRegistration.findUnique({
      where: { userId },
      select: this.#selectFields
    });
  }

  async findWithAdvancedQuery(queryOptions = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'createdAt',
      order = 'desc',
      filters = {}
    } = queryOptions;

    // search cho user.fullname, user.email, user.username
    const searchableFields = [
      'user.fullname',
      'user.email',
      'user.username'
    ];

    const where = buildWhereClause(
      { search, ...filters },
      searchableFields
    );

    const { skip, take } = buildPagination(page, limit);
    const orderBy = buildSort(sortBy, order);

    const [items, total] = await Promise.all([
      prisma.creditRegistration.findMany({
        where,
        skip,
        take,
        select: this.#selectFields,
        orderBy
      }),
      prisma.creditRegistration.count({ where })
    ]);

    return formatPaginatedResponse(items, total, page, take);
  }

    async updateStatus(id, data) {
        return await prisma.creditRegistration.update({
            where: { id },
            data: {
            status: data.status,
            approvedBy: data.approvedBy ?? null,
            approvalDate: data.approvalDate ?? null,
            creditLimit: data.creditLimit ?? undefined 
            },
            select: this.#selectFields
        });
    }


  async approve(id, approverId) {
    return prisma.creditRegistration.update({
      where: { id },
      data: {
        status: RegistrationStatus.APPROVED,
        approvedBy: approverId,
        approvalDate: new Date()
      },
      select: this.#selectFields
    });
  }

  async reject(id, approverId) {
    return prisma.creditRegistration.update({
      where: { id },
      data: {
        status: RegistrationStatus.REJECTED,
        approvedBy: approverId,
        approvalDate: new Date()
      },
      select: this.#selectFields
    });
  }

  async getInvoicesByUser(userId) {
    return prisma.invoice.findMany({
      where: {
        order: { userId }
      },
      select: {
        invoiceStatus: true,
        dueDate: true,
        totalAmount: true,
        creditAmount: true,
        paidAmount: true
      }
    });
  }

  async findLatestByUserId(userId) {
  return prisma.creditRegistration.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" }
  });
}


  async getOrdersByUser(userId) {
    return prisma.order.findMany({
      where: { userId },
      select: {
        totalAmount: true
      }
    });
  }
}

export const creditRegistrationRepository = new CreditRegistrationRepository();
