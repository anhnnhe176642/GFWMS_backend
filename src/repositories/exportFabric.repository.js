import { PrismaClient } from '@prisma/client';
import { buildWhereClause, buildSort, formatPaginatedResponse } from '../utils/query-builder.js';
import { userRepository } from './user.repository.js';
import { PERMISSIONS } from '../constants/permissions.js';

const prisma = new PrismaClient();

export class ExportFabricRepository {
  //  Select rút gọn cho danh sách (get all)
  #exportFabricListSelect = {
    id: true,
    warehouse: { select: { id: true, name: true } },
    store: { select: { id: true, name: true } },
    status: true,
    note: true,
    createdAt: true,
    createdBy: { select: { username: true } },
  };

  //  Select chi tiết (get detail)
  #exportFabricDetailSelect = {
    id: true,
    warehouseId: true,
    storeId: true,
    status: true,
    note: true,
    batchId: true,
    createdAt: true,
    updatedAt: true,
    createdById: true,
    receivedById: true,
    warehouse: {
      select: {
        id: true,
        name: true,
        address: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    },
    store: {
      select: {
        id: true,
        name: true,
        address: true,
        createdAt: true,
        updatedAt: true
      }
    },
    createdBy: {
      select: {
        id: true,
        username: true,
        email: true,
        fullname: true,
        createdAt: true
      }
    },
    receivedBy: {
      select: {
        id: true,
        username: true,
        email: true,
        fullname: true,
        createdAt: true
      }
    },
    exportItems: {
      select: {
        id: true,
        exportFabricId: true,
        fabricId: true,
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
            quantityInStock: true,
            sellingPrice: true,
            colorId: true,
            categoryId: true,
            supplierId: true,
            color: {
              select: {
                id: true,
                name: true,
                hexCode: true
              }
            },
            category: {
              select: {
                id: true,
                name: true,
                description: true,
                sellingPricePerMeter: true,
                sellingPricePerRoll: true
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
                address: true,
                phone: true
              }
            }
          }
        }
      },
      orderBy: [
        { fabric: { categoryId: 'asc' } },
        { fabric: { colorId: 'asc' } },
        { fabric: { glossId: 'asc' } }
      ]
    }
  };

  /**  Lấy tất cả (ít trường, không chi tiết exportItems) */
  async findAll() {
    return await prisma.exportFabric.findMany({
      select: this.#exportFabricListSelect,
      orderBy: { createdAt: 'desc' }
    });
  }

  /**  Lấy chi tiết theo ID (đầy đủ quan hệ) */
  async findById(id) {
    return await prisma.exportFabric.findUnique({
      where: { id },
      select: this.#exportFabricDetailSelect
    });
  }

  /**  Lấy danh sách có phân trang (dùng select rút gọn) */
  async findWithPagination(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [exportFabrics, total] = await Promise.all([
      prisma.exportFabric.findMany({
        skip,
        take: limit,
        select: this.#exportFabricListSelect,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.exportFabric.count()
    ]);

    return {
      exportFabrics,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**  Lấy danh sách nâng cao (lọc, tìm kiếm, sắp xếp, phân trang) */
  async findWithAdvancedQuery(queryOptions = {}, userId = null) {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'createdAt',
      order = 'desc',
      filters = {}
    } = queryOptions;

    const searchableFields = [
      'note',
      'warehouse.name',
      'store.name',
      'createdBy.username',
      'receivedBy.username'
    ];

    const where = buildWhereClause({ search, ...filters }, searchableFields);
    
    // If userId provided, check warehouse access
    if (userId) {
      const hasGlobalAccess = await userRepository.hasPermission(userId, PERMISSIONS.WAREHOUSES_MANAGER.MANAGER_ALL.key);
      if (!hasGlobalAccess) {
        // User can only see export records for warehouses they manage
        where.warehouse = {
          warehouseManages: {
            some: {
              userId: userId
            }
          }
        };
      }
    }
    
    const skip = (page - 1) * limit;
    const orderBy = buildSort(sortBy, order);

    const [exportFabrics, total] = await Promise.all([
      prisma.exportFabric.findMany({
        where,
        select: this.#exportFabricListSelect,
        skip,
        take: limit,
        orderBy
      }),
      prisma.exportFabric.count({ where })
    ]);

    return formatPaginatedResponse(exportFabrics, total, page, limit);
  }

  async create(data) {
    const { warehouseId, storeId, note, createdById, exportItems, batchId } = data;

    // Tạo phiếu xuất và nested exportItems cùng lúc
    const newExport = await prisma.exportFabric.create({
      data: {
        warehouseId,
        storeId,
        note,
        status: 'PENDING',
        createdById,
        batchId,
        exportItems: {
          create: exportItems.map(item => ({
            fabricId: item.fabricId,
            quantity: item.quantity
          }))
        }
      },
      select: this.#exportFabricDetailSelect  
    });

    return newExport;
  }

  /**
   * Tạo batch nhiều ExportFabric (1 per warehouse) trong 1 transaction
   * batchId = id của phiếu xuất đầu tiên
   * @param {Object} params
   * @param {number} params.storeId
   * @param {string} params.note
   * @param {string} params.createdById
   * @param {Array<{warehouseId: number, items: Array<{fabricId: number, quantity: number}>}>} params.warehouseAllocations
   * @returns {Promise<{batchId: number, exports: Array}>}
   */
  async createBatch({ storeId, note, createdById, warehouseAllocations }) {
    return await prisma.$transaction(async (tx) => {
      const createdExports = [];
      let batchId = null;
      
      // Tính tổng số lượng cần trừ theo fabricId
      const fabricQuantities = new Map();
      for (const allocation of warehouseAllocations) {
        for (const item of allocation.items) {
          const current = fabricQuantities.get(item.fabricId) || 0;
          fabricQuantities.set(item.fabricId, current + item.quantity);
        }
      }
      
      // Trừ quantityInStock cho mỗi fabric
      for (const [fabricId, totalQuantity] of fabricQuantities) {
        await tx.fabric.update({
          where: { id: fabricId },
          data: { quantityInStock: { decrement: totalQuantity } }
        });
      }
      
      // Tạo các ExportFabric
      for (const allocation of warehouseAllocations) {
        const newExport = await tx.exportFabric.create({
          data: {
            warehouseId: allocation.warehouseId,
            storeId,
            note,
            status: 'PENDING',
            createdById,
            batchId, // Null khi tạo lần đầu, sẽ update sau
            exportItems: {
              create: allocation.items.map(item => ({
                fabricId: item.fabricId,
                quantity: item.quantity
              }))
            }
          },
          select: this.#exportFabricDetailSelect
        });
        
        // Set batchId = id của phiếu xuất đầu tiên
        if (batchId === null) {
          batchId = newExport.id;
          // Update tất cả các phiếu trong batch có batchId = id phiếu đầu tiên
          await tx.exportFabric.update({
            where: { id: newExport.id },
            data: { batchId }
          });
        } else {
          // Update các phiếu sau cùng batchId
          await tx.exportFabric.update({
            where: { id: newExport.id },
            data: { batchId }
          });
        }
        
        // Fetch lại để có đầy đủ dữ liệu
        const updatedExport = await tx.exportFabric.findUnique({
          where: { id: newExport.id },
          select: this.#exportFabricDetailSelect
        });
        createdExports.push(updatedExport);
      }
      
      return { batchId, exports: createdExports };
    });
  }

  /**
   * Hoàn trả quantityInStock khi REJECTED
   */
  async restoreQuantityForExport(exportFabricId) {
    const exportFabric = await prisma.exportFabric.findUnique({
      where: { id: exportFabricId },
      include: { exportItems: true }
    });

    if (!exportFabric) return null;

    await prisma.$transaction(async (tx) => {
      for (const item of exportFabric.exportItems) {
        await tx.fabric.update({
          where: { id: item.fabricId },
          data: { quantityInStock: { increment: item.quantity } }
        });
      }
    });

    return exportFabric;
  }

  async updateStatus(id, status, approvedById, itemShelfSelections = [], note = null) {
    const updateData = {
      status,
      receivedById: approvedById,
      exportItems: {
        updateMany: itemShelfSelections.map(item => ({
          where: { exportFabricId: id, fabricId: item.fabricId },
          data: {}
        }))
      }
    };

    // Thêm note nếu có (khi REJECTED)
    if (note) {
      updateData.note = note;
    }

    const updatedExport = await prisma.exportFabric.update({
      where: { id },
      data: updateData,
      select: this.#exportFabricDetailSelect
    });

    return updatedExport;
  }

  /**
   * Cập nhật giá cho item cụ thể theo ID
   * @param {number} itemId - ID của ExportFabricItem
   * @param {number} price - Giá nhập
   */
  async updateItemPrice(itemId, price) {
    return await prisma.exportFabricItem.update({
      where: { id: itemId },
      data: { price }
    });
  }

  /**
   * Tạo nhiều ExportFabricItem cho 1 phiếu xuất
   * Dùng khi approve và cần tách các batch khác giá
   * @param {number} exportFabricId
   * @param {Array<{fabricId: number, quantity: number, price: number}>} items
   */
  async createManyItems(exportFabricId, items) {
    return await prisma.exportFabricItem.createMany({
      data: items.map(item => ({
        exportFabricId,
        fabricId: item.fabricId,
        quantity: item.quantity,
        price: item.price
      }))
    });
  }

  /**
   * Xóa tất cả items của 1 phiếu xuất (dùng trước khi tạo lại)
   * @param {number} exportFabricId
   */
  async deleteAllItems(exportFabricId) {
    return await prisma.exportFabricItem.deleteMany({
      where: { exportFabricId }
    });
  }
}

export const exportFabricRepository = new ExportFabricRepository();
