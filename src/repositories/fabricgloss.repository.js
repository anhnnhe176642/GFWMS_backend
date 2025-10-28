import { PrismaClient } from '@prisma/client';
import { withPrismaErrorHandling } from '../utils/prisma-error-handler.js';
import {  buildPagination, buildSort, formatPaginatedResponse } from '../utils/query-builder.js';

const prisma = new PrismaClient();

export class FabricGlossRepository {
  // Common select options
  #selectOptions = {
    id: true,
    description: true,
    createdAt: true,
    updatedAt: true,
  };

  async findAll() {
    return await prisma.fabricGloss.findMany({
      select: this.#selectOptions
    });
  }

  async findById(id) {
    return await prisma.fabricGloss.findUnique({
      where: { id },
      select: this.#selectOptions
    });
  }

  async create(glossData) {
    return await withPrismaErrorHandling(
      () => prisma.fabricGloss.create({
        data: glossData,
        select: this.#selectOptions
      }),
      {
        fabric_gloss_description_key: 'Độ bóng này đã tồn tại trong hệ thống'
      }
    );
  }

  async updateById(id, glossData) {
    return await withPrismaErrorHandling(
      () => prisma.fabricGloss.update({
        where: { id },
        data: glossData,
        select: this.#selectOptions
      }),
      {
        fabric_gloss_description_key: 'Độ bóng này đã tồn tại trong hệ thống'
      }
    );
  }


  async count() {
    return await prisma.fabricGloss.count();
  }

  async findWithPagination(page = 1, limit = 10) {
    const { skip, take } = buildPagination(page, limit);
    
    const [items, total] = await Promise.all([
      prisma.fabricGloss.findMany({
        skip,
        take,
        select: this.#selectOptions,
        orderBy: { createdAt: 'desc' }
      }),
      this.count()
    ]);

    return formatPaginatedResponse(items, total, page, take);
  }

  async findWithAdvancedQuery(queryOptions = {}) {
  const {
    page = 1,
    limit = 10,
    search = '',
    sortBy = 'createdAt',
    order = 'desc',
  } = queryOptions;

  // ----- WHERE CLAUSE -----
  const where = {};

  // Tìm kiếm theo description
  if (search && search.trim() !== '') {
    where.description = { contains: search };
  }

  // ----- PAGINATION & SORT -----
  const { skip, take } = buildPagination(page, limit);
  const orderBy = buildSort(sortBy, order, {
    description: 'description',
    createdAt: 'createdAt'
  });

  // ----- EXECUTE -----
  const [items, total] = await Promise.all([
    prisma.fabricGloss.findMany({
      where,
      skip,
      take,
      select: this.#selectOptions,
      orderBy
    }),
    prisma.fabricGloss.count({ where })
  ]);

  return formatPaginatedResponse(items, total, page, take);
}

}

// Export singleton instance
export const fabricGlossRepository = new FabricGlossRepository();
