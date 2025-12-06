import { PrismaClient } from '@prisma/client';
import { 
  buildWhereClause, 
  buildPagination, 
  buildSort, 
  formatPaginatedResponse 
} from '../utils/query-builder.js';

const prisma = new PrismaClient();

class CreditRequestRepository {

  // Select fields chuẩn
  #selectFields = {
    id: true,
    userId: true,
    requestLimit: true,
    status: true,
    type: true,
    note: true,
    createdAt: true,
    updatedAt: true,
    user: {
      select: {
        id: true,
        username: true,
        fullname: true,
        email: true
      }
    }
  };

  /** ------------------------------------------------------------------
   *  FIND BY ID
   * ------------------------------------------------------------------ */
  async findById(id) {
    return prisma.creditRequest.findUnique({
      where: { id },
      select: this.#selectFields
    });
  }

  /** ------------------------------------------------------------------
   *  CREATE REQUEST
   * ------------------------------------------------------------------ */
  async create(data) {
    return prisma.creditRequest.create({
      data,
      select: this.#selectFields
    });
  }

  /** ------------------------------------------------------------------
   *  UPDATE REQUEST (status, note,...)
   * ------------------------------------------------------------------ */
  async update(id, data) {
    return prisma.creditRequest.update({
      where: { id },
      data,
      select: this.#selectFields
    });
  }

  /** ------------------------------------------------------------------
   *  FIND ALL REQUESTS OF A USER
   * ------------------------------------------------------------------ */
  async findByUserId(userId) {
    return prisma.creditRequest.findMany({
      where: { userId },
      select: this.#selectFields,
      orderBy: { createdAt: 'desc' }
    });
  }

  /** ------------------------------------------------------------------
   *  ADVANCED QUERY FOR ADMIN PAGE
   * ------------------------------------------------------------------ */
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
      'user.username',
      'user.fullname',
      'user.email'
    ];

    const where = buildWhereClause(
      { search, ...filters },
      searchableFields
    );

    const { skip, take } = buildPagination(page, limit);
    const orderBy = buildSort(sortBy, order);

    const [items, total] = await Promise.all([
      prisma.creditRequest.findMany({
        where,
        skip,
        take,
        select: this.#selectFields,
        orderBy
      }),
      prisma.creditRequest.count({ where })
    ]);

    return formatPaginatedResponse(items, total, page, take);
  }
}

export const creditRequestRepository = new CreditRequestRepository();
