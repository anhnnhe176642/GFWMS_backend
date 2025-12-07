import { PrismaClient } from '@prisma/client';
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
    creditUsed: true,
    approvedBy: true,
    approvalDate: true,
    status: true,
    note: true,
    createdAt: true,
    updatedAt: true,
    isLocked:true,
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

  // Tìm theo ID
  async findById(id) {
    return prisma.creditRegistration.findUnique({
      where: { id },
      select: this.#selectFields
    });
  }

  // Tìm theo userId
  async findByUserId(userId) {
    return prisma.creditRegistration.findUnique({
      where: { userId },
      select: this.#selectFields
    });
  }

  // Query nâng cao (search, filter, pagination, sort)
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

  // Cập nhật theo ID
  async updateById(id, data) {
    return prisma.creditRegistration.update({
      where: { id },
      data,
      select: this.#selectFields
    });
  }

  // Cập nhật theo userId
  async updateByUserId(userId, data) {
    return prisma.creditRegistration.update({
      where: { userId },
      data,
      select: this.#selectFields
    });
  }

  // Tạo mới (thường dùng khi duyệt CreditRequest lần đầu)
  async create(data) {
    return prisma.creditRegistration.create({
      data,
      select: this.#selectFields
    });
  }
}

export const creditRegistrationRepository = new CreditRegistrationRepository();
