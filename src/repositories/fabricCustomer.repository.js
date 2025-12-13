import { PrismaClient } from '@prisma/client';
import { withPrismaErrorHandling } from '../utils/prisma-error-handler.js';
import { buildPagination, buildSort, formatPaginatedResponse } from '../utils/query-builder.js';
import { NotFoundError } from '../utils/errors.js';

const prisma = new PrismaClient();

export class FabricCustomerRepository {
  /**
   * Get all fabric customers with advanced filtering, sorting, and pagination
   */
  async findAll(queryParams = {}) {
    const {
      search,
      filters = {},
      sort,
      page = 1,
      limit = 20
    } = queryParams;

    // Build where clause for search and filters
    const where = {};

    // Filter by specific fields
    if (filters.categoryId) {
      where.categoryId = parseInt(filters.categoryId);
    }
    if (filters.colorId) {
      where.colorId = filters.colorId;
    }
    if (filters.glossId) {
      where.glossId = parseInt(filters.glossId);
    }
    if (filters.thickness) {
      where.thickness = parseFloat(filters.thickness);
    }
    if (filters.width) {
      where.width = parseFloat(filters.width);
    }
    if (filters.length) {
      where.length = parseFloat(filters.length);
    }

    // Search by category name or color name
    if (search) {
      where.OR = [
        { category: { name: { contains: search, mode: 'insensitive' } } },
        { color: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    // Build pagination
    const { skip, take } = buildPagination(page, limit);

    // Build sort
    const orderBy = buildSort(sort) || { createdAt: 'desc' };

    return await withPrismaErrorHandling(async () => {
      const [data, total] = await Promise.all([
        prisma.fabricCustomer.findMany({
          where,
          select: {
            id: true,
            thickness: true,
            glossId: true,
            gloss: { select: { id: true, description: true } },
            width: true,
            length: true,
            categoryId: true,
            category: { select: { id: true, name: true } },
            colorId: true,
            color: { select: { id: true, name: true, hexCode: true } },
            totalUncut: true,
            totalCuttingMeters: true,
            createdAt: true,
            updatedAt: true,
            fabricCustomerStores: {
              select: {
                storeId: true,
                store: { select: { id: true, name: true } },
                uncutRolls: true,
                cuttingRollMeters: true
              }
            }
          },
          skip,
          take,
          orderBy
        }),
        prisma.fabricCustomer.count({ where })
      ]);

      return formatPaginatedResponse(data, total, page, limit);
    });
  }

  /**
   * Get fabric customer detail by ID
   */
  async findById(id) {
    return await withPrismaErrorHandling(async () => {
      const fabricCustomer = await prisma.fabricCustomer.findUnique({
        where: { id: parseInt(id) },
        select: {
          id: true,
          thickness: true,
          glossId: true,
          gloss: { select: { id: true, description: true } },
          width: true,
          length: true,
          categoryId: true,
          category: { select: { id: true, name: true } },
          colorId: true,
          color: { select: { id: true, name: true, hexCode: true } },
          totalUncut: true,
          totalCuttingMeters: true,
          createdAt: true,
          updatedAt: true,
          fabricCustomerStores: {
            select: {
              storeId: true,
              store: { select: { id: true, name: true } },
              uncutRolls: true,
              cuttingRollMeters: true
            }
          }
        }
      });

      if (!fabricCustomer) {
        throw new NotFoundError('Vải khách hàng không tồn tại');
      }

      return fabricCustomer;
    });
  }

  /**
   * Get available filter options based on applied filters
   * Trả về các tùy chọn lọc có sẵn dựa trên các bộ lọc đã áp dụng
   */
  async getFilterOptions(appliedFilters = {}) {
    const where = {};

    // Apply existing filters
    if (appliedFilters.categoryId) {
      where.categoryId = parseInt(appliedFilters.categoryId);
    }
    if (appliedFilters.colorId) {
      where.colorId = appliedFilters.colorId;
    }
    if (appliedFilters.glossId) {
      where.glossId = parseInt(appliedFilters.glossId);
    }
    if (appliedFilters.thickness) {
      where.thickness = parseFloat(appliedFilters.thickness);
    }
    if (appliedFilters.width) {
      where.width = parseFloat(appliedFilters.width);
    }
    if (appliedFilters.length) {
      where.length = parseFloat(appliedFilters.length);
    }

    return await withPrismaErrorHandling(async () => {
      // Get distinct values for each filter using groupBy
      const [categories, colors, glosses, thicknesses, widths, lengths] = await Promise.all([
        // Get categories with their fabric counts
        prisma.fabricCustomer.groupBy({
          by: ['categoryId'],
          where,
          _count: { id: true },
          _sum: {
            totalUncut: true,
            totalMeters: true
          }
        }).then(async (results) => {
          const categoryIds = results.map(r => r.categoryId);
          const categories = await prisma.fabricCategory.findMany({
            where: { id: { in: categoryIds } },
            select: { id: true, name: true }
          });
          return results.map(r => {
            const category = categories.find(c => c.id === r.categoryId);
            return {
              id: r.categoryId,
              name: category?.name,
              count: r._count.id,
              totalUncut: r._sum.totalUncut || 0,
              totalMeters: parseFloat((r._sum.totalMeters || 0).toFixed(2))
            };
          });
        }),

        // Get colors with their fabric counts
        prisma.fabricCustomer.groupBy({
          by: ['colorId'],
          where,
          _count: { id: true },
          _sum: {
            totalUncut: true,
            totalMeters: true
          }
        }).then(async (results) => {
          const colorIds = results.map(r => r.colorId);
          const colors = await prisma.fabricColor.findMany({
            where: { id: { in: colorIds } },
            select: { id: true, name: true, hexCode: true }
          });
          return results.map(r => {
            const color = colors.find(c => c.id === r.colorId);
            return {
              id: r.colorId,
              name: color?.name,
              hexCode: color?.hexCode,
              count: r._count.id,
              totalUncut: r._sum.totalUncut || 0,
              totalMeters: parseFloat((r._sum.totalMeters || 0).toFixed(2))
            };
          });
        }),

        // Get glosses with their fabric counts
        prisma.fabricCustomer.groupBy({
          by: ['glossId'],
          where,
          _count: { id: true },
          _sum: {
            totalUncut: true,
            totalMeters: true
          }
        }).then(async (results) => {
          const glossIds = results.map(r => r.glossId);
          const glosses = await prisma.fabricGloss.findMany({
            where: { id: { in: glossIds } },
            select: { id: true, description: true }
          });
          return results.map(r => {
            const gloss = glosses.find(g => g.id === r.glossId);
            return {
              id: r.glossId,
              description: gloss?.description,
              count: r._count.id,
              totalUncut: r._sum.totalUncut || 0,
              totalMeters: parseFloat((r._sum.totalMeters || 0).toFixed(2))
            };
          });
        }),

        // Get distinct thicknesses
        prisma.fabricCustomer.groupBy({
          by: ['thickness'],
          where,
          _count: { id: true },
          _sum: {
            totalUncut: true,
            totalMeters: true
          }
        }).then(results => 
          results.map(r => ({
            value: r.thickness,
            count: r._count.id,
            totalUncut: r._sum.totalUncut || 0,
            totalMeters: parseFloat((r._sum.totalMeters || 0).toFixed(2))
          }))
        ),

        // Get distinct widths
        prisma.fabricCustomer.groupBy({
          by: ['width'],
          where,
          _count: { id: true },
          _sum: {
            totalUncut: true,
            totalMeters: true
          }
        }).then(results => 
          results.map(r => ({
            value: r.width,
            count: r._count.id,
            totalUncut: r._sum.totalUncut || 0,
            totalMeters: parseFloat((r._sum.totalMeters || 0).toFixed(2))
          }))
        ),

        // Get distinct lengths
        prisma.fabricCustomer.groupBy({
          by: ['length'],
          where,
          _count: { id: true },
          _sum: {
            totalUncut: true,
            totalMeters: true
          }
        }).then(results => 
          results.map(r => ({
            value: r.length,
            count: r._count.id,
            totalUncut: r._sum.totalUncut || 0,
            totalMeters: parseFloat((r._sum.totalMeters || 0).toFixed(2))
          }))
        )
      ]);

      // Get stores with their available quantities
      const storeDetails = await prisma.fabricCustomerStore.findMany({
        where: {
          fabricCustomer: where
        },
        select: {
          storeId: true,
          uncutRolls: true,
          cuttingRollMeters: true,
          fabricCustomer: {
            select: {
              length: true
            }
          }
        }
      });

      // Group stores and calculate total meters
      const storeMap = new Map();
      storeDetails.forEach(item => {
        if (!storeMap.has(item.storeId)) {
          storeMap.set(item.storeId, {
            fabricCount: 0,
            totalUncutRolls: 0,
            totalCuttingMeters: 0,
            totalMeters: 0
          });
        }
        const store = storeMap.get(item.storeId);
        store.fabricCount += 1;
        store.totalUncutRolls += item.uncutRolls;
        store.totalCuttingMeters += item.cuttingRollMeters;
        // Calculate: uncutRolls * length + cuttingRollMeters
        store.totalMeters += (item.uncutRolls * item.fabricCustomer.length) + item.cuttingRollMeters;
      });

      const storeIds = Array.from(storeMap.keys());
      const storeList = await prisma.store.findMany({
        where: { id: { in: storeIds } },
        select: { id: true, name: true, address: true, latitude: true, longitude: true }
      });

      const stores = storeIds.map(storeId => {
        const store = storeList.find(s => s.id === storeId);
        const data = storeMap.get(storeId);
        return {
          id: storeId,
          name: store?.name,
          address: store?.address,
          latitude: store?.latitude,
          longitude: store?.longitude,
          fabricCount: data.fabricCount,
          totalUncutRolls: data.totalUncutRolls,
          totalCuttingMeters: data.totalCuttingMeters,
          totalMeters: parseFloat(data.totalMeters.toFixed(2))
        };
      });

      return {
        categories,
        colors,
        glosses,
        thicknesses,
        widths,
        lengths,
        stores
      };
    });
  }

  /**
   * Get grouped fabric customer data by applied filters
   * Group các bản ghi theo các bộ lọc được chọn
   */
  async getGroupedData(appliedFilters = {}, groupBy = []) {
    const where = {};

    // Apply filters
    if (appliedFilters.categoryId) {
      where.categoryId = parseInt(appliedFilters.categoryId);
    }
    if (appliedFilters.colorId) {
      where.colorId = appliedFilters.colorId;
    }
    if (appliedFilters.glossId) {
      where.glossId = parseInt(appliedFilters.glossId);
    }
    if (appliedFilters.thickness) {
      where.thickness = parseFloat(appliedFilters.thickness);
    }
    if (appliedFilters.width) {
      where.width = parseFloat(appliedFilters.width);
    }
    if (appliedFilters.length) {
      where.length = parseFloat(appliedFilters.length);
    }

    return await withPrismaErrorHandling(async () => {
      const fabricCustomers = await prisma.fabricCustomer.findMany({
        where,
        select: {
          id: true,
          thickness: true,
          glossId: true,
          gloss: { select: { id: true, description: true } },
          width: true,
          length: true,
          categoryId: true,
          category: { select: { id: true, name: true } },
          colorId: true,
          color: { select: { id: true, name: true, hexCode: true } },
          totalUncut: true,
          totalCuttingMeters: true
        },
        orderBy: { createdAt: 'desc' }
      });

      // Group by applied filters if groupBy is specified
      if (groupBy.length === 0) {
        return fabricCustomers;
      }

      const grouped = {};
      fabricCustomers.forEach(fc => {
        const key = groupBy.map(field => {
          if (field === 'category') return fc.category.name;
          if (field === 'color') return fc.color.name;
          if (field === 'gloss') return fc.gloss.description;
          return fc[field];
        }).join(' | ');

        if (!grouped[key]) {
          grouped[key] = {
            groupKey: key,
            items: [],
            totalUncut: 0,
            totalMeters: 0
          };
        }

        grouped[key].items.push(fc);
        grouped[key].totalUncut += fc.totalUncut;
        grouped[key].totalMeters += fc.totalCuttingMeters;
      });

      return Object.values(grouped);
    });
  }
}

export const fabricCustomerRepository = new FabricCustomerRepository();
