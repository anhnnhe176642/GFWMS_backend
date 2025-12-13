import { PrismaClient } from '@prisma/client';
import { withPrismaErrorHandling } from '../utils/prisma-error-handler.js';
import { buildWhereClause, buildPagination, buildSort, formatPaginatedResponse } from '../utils/query-builder.js';

const prisma = new PrismaClient();

class FabricStoreRepository {
  // Common select options để include các relation cần thiết
  #fabricStoreSelectOptions = {
    fabricId: true,
    storeId: true,
    totalValue: true,
    totalMeters: true,
    uncutRolls: true,
    cuttingRollMeters: true,
    createdAt: true,
    updatedAt: true,
    fabric: {
      select: {
        id: true,
        length: true,
        width: true,
        weight: true,
        thickness: true,
        sellingPrice: true,
        quantityInStock: true,
        category: {
          select: {
            id: true,
            name: true,
            description: true,
            sellingPricePerMeter: true,
            sellingPricePerRoll: true
          }
        },
        color: {
          select: {
            id: true,
            name: true,
            hexCode: true
          }
        },
        gloss: {
          select: {
            id: true,
            description: true
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
    },
    store: {
      select: {
        id: true,
        name: true,
        address: true
      }
    }
  };

  /**
   * Lấy thông tin fabric store theo fabricId và storeId
   */
  async findByFabricAndStore(fabricId, storeId) {
    return await withPrismaErrorHandling(
      () => prisma.fabricStore.findUnique({
        where: {
          fabricId_storeId: {
            fabricId,
            storeId
          }
        },
        select: this.#fabricStoreSelectOptions
      })
    );
  }

  /**
   * Lấy danh sách tất cả fabric trong một store với advanced query
   */
  async findAllByStoreWithAdvancedQuery(storeId, queryOptions = {}) {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      sortBy = 'updatedAt', 
      order = 'desc',
      filters = {}
    } = queryOptions;

    // Build where clause với search và filters - hỗ trợ nested fields
    const searchableFields = [
      'fabric.category.name',
      'fabric.color.name', 
      'fabric.gloss.description',
      'fabric.supplier.name'
    ];
    
    const baseWhere = { storeId };
    
    const filterMapping = {
      glossId: 'fabric.glossId',
      categoryId: 'fabric.categoryId',
      colorId: 'fabric.colorId',
      supplierId: 'fabric.supplierId'
    };
    
    const filterWhere = buildWhereClause(
      { search, ...filters },
      searchableFields,
      filterMapping
    );

    const where = {
      AND: [baseWhere, filterWhere]
    };

    // Build pagination
    const { skip, take } = buildPagination(page, limit);

    // Build sort - hỗ trợ nested sort
    const sortMapping = {
      'categoryName': 'fabric.category.name',
      'colorName': 'fabric.color.name',
      'glossDescription': 'fabric.gloss.description',
      'supplierName': 'fabric.supplier.name'
    };
    const orderBy = buildSort(sortBy, order, sortMapping);

    // Execute queries
    const [data, total] = await Promise.all([
      withPrismaErrorHandling(
        () => prisma.fabricStore.findMany({
          where,
          skip,
          take,
          select: this.#fabricStoreSelectOptions,
          orderBy
        })
      ),
      withPrismaErrorHandling(
        () => prisma.fabricStore.count({ where })
      )
    ]);

    return formatPaginatedResponse(data, total, page, take);
  }

  /**
   * Nhập vải vào cửa hàng (thêm cuộn mới)
   * @param {Object} params - { fabricId, storeId, totalValue, totalMeters, uncutRolls, cuttingRollMeters }
   */
  async importFabricRolls({ fabricId, storeId, totalValue, totalMeters, uncutRolls, cuttingRollMeters = 0 }, tx = prisma) {
    return await withPrismaErrorHandling(
      () => tx.fabricStore.upsert({
        where: {
          fabricId_storeId: {
            fabricId,
            storeId
          }
        },
        update: {
          totalValue: { increment: totalValue },
          totalMeters: { increment: totalMeters },
          uncutRolls: { increment: uncutRolls }
        },
        create: {
          fabricId,
          storeId,
          totalValue,
          totalMeters,
          uncutRolls,
          cuttingRollMeters
        },
        select: this.#fabricStoreSelectOptions
      })
    );
  }

  /**
   * Cắt vải từ cửa hàng
   */
  async cutFabric(fabricId, storeId, metersToCut, tx = prisma) {
    // Lấy thông tin hiện tại
    const currentStore = await withPrismaErrorHandling(
      () => tx.fabricStore.findUnique({
        where: {
          fabricId_storeId: {
            fabricId,
            storeId
          }
        },
        select: this.#fabricStoreSelectOptions
      })
    );

    if (!currentStore) {
      throw new Error('Không tìm thấy vải trong cửa hàng');
    }

    // Tính giá trị trung bình mỗi mét
    const pricePerMeter = currentStore.totalMeters > 0 
      ? currentStore.totalValue / currentStore.totalMeters 
      : 0;
    
    const valueToDeduct = metersToCut * pricePerMeter;
    
    // Lấy thông tin fabric để biết độ dài mỗi cuộn
    const metersPerRoll = currentStore.fabric.length;
    
    let newCuttingRollMeters = currentStore.cuttingRollMeters;
    let newUncutRolls = currentStore.uncutRolls;
    
    let remainingMeters = metersToCut;
    
    // Nếu có cuộn đang cắt dở
    if (newCuttingRollMeters > 0) {
      if (remainingMeters <= newCuttingRollMeters) {
        // Cắt hết từ cuộn đang cắt dở
        newCuttingRollMeters -= remainingMeters;
        remainingMeters = 0;
      } else {
        // Cắt hết cuộn đang cắt dở và tiếp tục sang cuộn mới
        remainingMeters -= newCuttingRollMeters;
        newCuttingRollMeters = 0;
      }
    }
    
    // Nếu còn mét cần cắt, lấy từ cuộn chưa cắt
    while (remainingMeters > 0 && newUncutRolls > 0) {
      newUncutRolls -= 1;
      
      if (remainingMeters >= metersPerRoll) {
        // Cắt hết cả cuộn
        remainingMeters -= metersPerRoll;
      } else {
        // Cắt một phần cuộn, cuộn này trở thành cuộn đang cắt dở
        newCuttingRollMeters = metersPerRoll - remainingMeters;
        remainingMeters = 0;
      }
    }
    
    if (remainingMeters > 0) {
      throw new Error(`Không đủ vải để cắt. Còn thiếu ${remainingMeters.toFixed(2)} mét`);
    }

    // Cập nhật database
    return await withPrismaErrorHandling(
      () => tx.fabricStore.update({
        where: {
          fabricId_storeId: {
            fabricId,
            storeId
          }
        },
        data: {
          totalValue: Math.max(0, currentStore.totalValue - valueToDeduct),
          totalMeters: Math.max(0, currentStore.totalMeters - metersToCut),
          uncutRolls: newUncutRolls,
          cuttingRollMeters: newCuttingRollMeters
        },
        select: this.#fabricStoreSelectOptions
      })
    );
  }


  /**
   * Đếm tổng số fabric store records
   */
  async count(storeId) {
    return await withPrismaErrorHandling(
      () => prisma.fabricStore.count({
        where: { storeId }
      })
    );
  }

  /**
   * Tìm fabrics trong store theo categoryId và optional filters
   * Dùng cho greedy allocation algorithm
   * @param {number} storeId - ID của store
   * @param {number} categoryId - ID category (required)
   * @param {Object} filters - Optional filters {colorId, glossId, thickness, width, length}
   * @returns {Promise<Array>} - Array các FabricStore records
   */
  async findFabricsInStoreByFilters(storeId, categoryId, filters = {}) {
    const whereClause = {
      storeId,
      fabric: {
        categoryId
      }
    };

    // Thêm optional filters vào where clause
    if (filters.colorId) {
      whereClause.fabric.colorId = filters.colorId;
    }
    if (filters.glossId) {
      whereClause.fabric.glossId = filters.glossId;
    }
    if (filters.thickness !== undefined) {
      whereClause.fabric.thickness = filters.thickness;
    }
    if (filters.width !== undefined) {
      whereClause.fabric.width = filters.width;
    }
    if (filters.length !== undefined) {
      whereClause.fabric.length = filters.length;
    }

    return await withPrismaErrorHandling(
      () => prisma.fabricStore.findMany({
        where: whereClause,
        select: this.#fabricStoreSelectOptions
      })
    );
  }
}

export default new FabricStoreRepository();
