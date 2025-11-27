import { PrismaClient } from '@prisma/client';
import { buildWhereClause, buildSort, formatPaginatedResponse, buildPagination } from '../utils/query-builder.js';

const prisma = new PrismaClient();

export class FabricRepository {
  // Chỉ định các field cần lấy, bao gồm các quan hệ liên quan
  #fabricSelectOptions = {
    id: true,
    thickness: true,
    gloss: { select: { id: true, description: true } },
    length: true,
    width: true,
    weight: true,
    sellingPrice: true,
    quantityInStock: true,
    category: { select: { id: true, name: true } },
    color: { select: { id: true, name: true } },
    supplier: { select: { id: true, name: true } },
    createdAt: true,
    updatedAt: true,
  };

  /**  Lấy tất cả Fabric */
  async findAll() {
    return await prisma.fabric.findMany({
      select: this.#fabricSelectOptions,
      orderBy: { createdAt: 'desc' }
    });
  }

  /**  Lấy Fabric theo ID */
  async findById(id) {
    return await prisma.fabric.findUnique({
      where: { id },
      select: this.#fabricSelectOptions
    });
  }



  /**  Đếm tổng số Fabric */
  async count(filters = {}) {
    return await prisma.fabric.count({
      where: filters
    });
  }

  /**  Lấy danh sách có phân trang */
  async findWithPagination(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [fabrics, total] = await Promise.all([
      prisma.fabric.findMany({
        skip,
        take: limit,
        select: this.#fabricSelectOptions,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.fabric.count()
    ]);

    return {
      fabrics,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**  Tìm kiếm nâng cao với filter, sort, pagination */
  async findWithAdvancedQuery(queryOptions = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'createdAt',
      order = 'desc',
      filters = {},
    } = queryOptions;

    const searchableFields = [
      'gloss.description',
      'category.name',
      'color.name',
      'supplier.name'
    ];

    // Build where clause (case-sensitive search)
    const where = buildWhereClause({ search, ...filters }, searchableFields);

    const skip = (page - 1) * limit;
    const orderBy = buildSort(sortBy, order);

    // Lấy dữ liệu và đếm tổng số
    const [fabrics, total] = await Promise.all([
      prisma.fabric.findMany({
        where,
        select: this.#fabricSelectOptions,
        skip,
        take: limit,
        orderBy,
      }),
      prisma.fabric.count({ where }), 
    ]);

    return formatPaginatedResponse(fabrics, total, page, limit);
  }

  async decreaseQuantityInStock(fabricId, quantity) {
    const fabric = await this.findById(fabricId);
    if (!fabric) throw new Error(`Fabric ID ${fabricId} không tồn tại`);
    if (fabric.quantityInStock < quantity) {
      throw new Error(
        `Vải có ID ${fabricId} không đủ tồn kho (còn ${fabric.quantityInStock}, cần ${quantity})`
      );
    }

    return await prisma.fabric.update({
      where: { id: fabricId },
      data: { quantityInStock: { decrement: quantity } }
    });
  }


  //Lấy tổng số lượng vải theo từng kho

  async getFabricInventoryByWarehouse(fabricId) {
    const warehouseInventory = await prisma.fabricShelf.findMany({
      where: {
        fabricId,
        quantity: { gt: 0 }
      },
      select: {
        quantity: true,
        shelf: {
          select: {
            warehouseId: true,
            warehouse: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    // Gom nhóm theo kho
    const warehouseMap = new Map();
    let totalQuantity = 0;
    
    warehouseInventory.forEach(item => {
      const warehouseId = item.shelf.warehouseId;
      const warehouseName = item.shelf.warehouse.name;
      
      totalQuantity += item.quantity;
      
      if (warehouseMap.has(warehouseId)) {
        warehouseMap.get(warehouseId).quantity += item.quantity;
      } else {
        warehouseMap.set(warehouseId, {
          warehouseId,
          warehouseName,
          quantity: item.quantity
        });
      }
    });

    return {
      totalQuantity,
      inventoryByWarehouse: Array.from(warehouseMap.values())
    };
  }

  /**
   * Lấy danh sách vải có sẵn trong 1 kho với phân trang, filter, search và sort
   * @param {number} warehouseId
   * @param {Object} queryOptions - { page, limit, search, sortBy, order, filters }
   */
  async findAvailableFabricsInWarehouse(warehouseId, queryOptions = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'createdAt',
      order = 'desc',
      filters = {}
    } = queryOptions;

    // Build filters for fabric fields
    const searchableFields = [
      'gloss.description',
      'category.name',
      'color.name',
      'supplier.name'
    ];

    // Combine user filters and search
    const fabricWhere = buildWhereClause({ search, ...filters }, searchableFields);

    // Add warehouse-related constraint (fabric must exist in provided warehouse with qty > 0)
    const warehouseCondition = {
      fabricShelf: {
        some: {
          shelf: { warehouseId },
          quantity: { gt: 0 }
        }
      }
    };

    const finalWhere = { ...fabricWhere, ...warehouseCondition };

    const { skip, take } = buildPagination(page, limit);
    const orderBy = buildSort(sortBy, order);

    const [fabrics, total] = await Promise.all([
      prisma.fabric.findMany({
        where: finalWhere,
        skip,
        take,
        select: {
          ...this.#fabricSelectOptions,
          fabricShelf: {
            where: { shelf: { warehouseId }, quantity: { gt: 0 } },
            select: {
              shelfId: true,
              quantity: true,
              shelf: { select: { id: true, code: true, warehouseId: true } }
            }
          }
        },
        orderBy
      }),
      prisma.fabric.count({ where: finalWhere })
    ]);

    // Convert to desired response: attach availableQuantity and shelves summary
    const data = fabrics.map(f => {
      const availableQuantity = f.fabricShelf.reduce((sum, s) => sum + (s.quantity || 0), 0);
      return {
        ...f,
        availableQuantity,
        shelves: f.fabricShelf.map(s => ({ shelfId: s.shelfId, shelfCode: s.shelf.code, quantity: s.quantity }))
      };
    });

    return formatPaginatedResponse(data, total, page, limit);
  }
}

export const fabricRepository = new FabricRepository();
