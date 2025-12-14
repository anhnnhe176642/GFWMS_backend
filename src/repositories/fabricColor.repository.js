import { PrismaClient } from '@prisma/client';
import { withPrismaErrorHandling } from '../utils/prisma-error-handler.js';
import {  buildPagination, buildSort, formatPaginatedResponse } from '../utils/query-builder.js';
import { getColorFamilyFromHex } from '../utils/color-family.js';
import { colorDistance, getMaxDistanceFromRange } from '../utils/hex-similarity.js';

const prisma = new PrismaClient();

export class FabricColorRepository {
  // Common select options
  #selectOptions = {
    id: true,
    name: true,
    hexCode: true,
    createdAt: true,
    updatedAt: true,
  };

  async findAll() {
    return await prisma.fabricColor.findMany({
      select: this.#selectOptions
    });
  }

  async findById(id) {
    return await prisma.fabricColor.findUnique({
      where: { id },
      select: this.#selectOptions
    });
  }

async create(colorData) {
  return await withPrismaErrorHandling(
    () => prisma.fabricColor.create({
      data: colorData,
      select: this.#selectOptions
    }),
    {
      id: 'ID màu đã tồn tại',
      name: 'Tên màu đã tồn tại',
    }
  );
}


  async updateById(id, colorData) {
    return await withPrismaErrorHandling(
      () => prisma.fabricColor.update({
        where: { id },
        data: colorData,
        select: this.#selectOptions
      }),
      {
        name: 'Tên màu đã tồn tại',
      }
    );
  }

  async deleteById(id) {
    return withPrismaErrorHandling(() =>
      prisma.fabricColor.delete({
        where: { id}
      })
    );
  }

  async countFabricsWithColor(colorId) {
    return await prisma.fabric.count({
      where: { colorId } 
    });
  }


  async count(where = {}) {
    return await prisma.fabricColor.count({ where });
  }

  async findWithPagination(page = 1, limit = 10) {
    const { skip, take } = buildPagination(page, limit);
    
    const [items, total] = await Promise.all([
      prisma.fabricColor.findMany({
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
      colorFamily = null,
      hexSearchColor = null,
      hexSearchRange = null
    } = queryOptions;
  
    const { skip, take } = buildPagination(page, limit);
    
    // Sử dụng buildSort để tạo orderBy
    const orderBy = buildSort(sortBy, order, {
      name: 'name',
      createdAt: 'createdAt',
      hexCode: 'hexCode',
      id: 'id',
      updatedAt: 'updatedAt'
    });

    // Build Prisma where clause
    const where = {};
    
    if (search) {
      where.name = { contains: search };
    }

    try {
      // Lấy tất cả items (để filter color family và hex similarity)
      let allItems = await prisma.fabricColor.findMany({
        where,
        select: this.#selectOptions
      });

      // Filter by color family nếu có
      if (colorFamily) {
        allItems = allItems.filter(item => {
          const family = getColorFamilyFromHex(item.hexCode);
          return family === colorFamily;
        });
      }

      // Filter by hex similarity nếu có
      if (hexSearchColor && hexSearchRange !== null && hexSearchRange !== undefined) {
        const maxDistance = getMaxDistanceFromRange(hexSearchRange);
        allItems = allItems.filter(item => {
          if (!item.hexCode) return false;
          const distance = colorDistance(hexSearchColor, item.hexCode);
          return distance <= maxDistance;
        });
      }

      // Tính tổng sau khi filter
      const total = allItems.length;

      // Sắp xếp
      let sortedItems = [...allItems];
      
      // Nếu có hex search, ưu tiên sort theo similarity (closest first)
      if (hexSearchColor && hexSearchRange !== null && hexSearchRange !== undefined) {
        sortedItems.sort((a, b) => {
          const distA = colorDistance(hexSearchColor, a.hexCode);
          const distB = colorDistance(hexSearchColor, b.hexCode);
          return distA - distB;
        });
      } else {
        // Nếu không có hex search, dùng buildSort
        if (Array.isArray(orderBy)) {
          orderBy.forEach(orderObj => {
            const [field, direction] = Object.entries(orderObj)[0];
            sortedItems.sort((a, b) => {
              const aVal = a[field];
              const bVal = b[field];
              
              if (aVal === bVal) return 0;
              const comparison = aVal < bVal ? -1 : 1;
              return direction === 'asc' ? comparison : -comparison;
            });
          });
        } else {
          const [field, direction] = Object.entries(orderBy)[0];
          sortedItems.sort((a, b) => {
            const aVal = a[field];
            const bVal = b[field];
            
            if (aVal === bVal) return 0;
            const comparison = aVal < bVal ? -1 : 1;
            return direction === 'asc' ? comparison : -comparison;
          });
        }
      }

      // Phân trang
      const items = sortedItems.slice(skip, skip + take);

      return formatPaginatedResponse(items, total, page, take);
    } catch (error) {
      console.error('Advanced query error:', error.message);
      throw error;
    }
  }
}

// Export singleton instance
export const fabricColorRepository = new FabricColorRepository();
