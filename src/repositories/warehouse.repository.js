import { PrismaClient } from '@prisma/client';
import { withPrismaErrorHandling } from '../utils/prisma-error-handler.js';
import { buildWhereClause, buildPagination, buildSort, formatPaginatedResponse } from '../utils/query-builder.js';
import { UserRepository } from './user.repository.js';
import { PERMISSIONS } from '../constants/permissions.js';

const prisma = new PrismaClient();
const userRepository = new UserRepository();

export class WarehouseRepository {
  #warehouseSelectOptions = {
    id: true,
    name: true,
    address: true,
    latitude: true,
    longitude: true,
    status: true,
    createdAt: true,
    updatedAt: true,
  };

  /**
   * Kiểm tra xem người dùng có quyền truy cập kho hay không
   */
  async checkUserWarehouseAccess(userId, warehouseId) {
    const access = await prisma.warehouseManage.findUnique({
      where: {
        userId_warehouseId: {
          userId,
          warehouseId: parseInt(warehouseId)
        }
      }
    });
    return !!access;
  }

  async findById(id) {
    return await prisma.warehouse.findUnique({
      where: { id: parseInt(id) },
      select: this.#warehouseSelectOptions
    });
  }

  async create(warehouseData) {
    return await withPrismaErrorHandling(
      () => prisma.warehouse.create({
        data: {
          ...warehouseData,
          status: 'ACTIVE'
        },
        select: this.#warehouseSelectOptions
      }),
      {
        name: 'Tên kho đã tồn tại'
      }
    );
  }

  async updateById(id, warehouseData) {
    return await withPrismaErrorHandling(
      () => prisma.warehouse.update({
        where: { id: parseInt(id) },
        data: {
          ...warehouseData,
          updatedAt: new Date()
        },
        select: this.#warehouseSelectOptions
      }),
      {
        name: 'Tên kho đã tồn tại'
      }
    );
  }

  async findWithAdvancedQuery(queryOptions = {}, userId = null) {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      sortBy = 'createdAt', 
      order = 'desc',
      filters = {}
    } = queryOptions;
    const searchableFields = ['name', 'address'];
    const where = buildWhereClause(
      { search, ...filters },
      searchableFields
    );

    // If userId provided, check if user has manager_all permission
    // Only filter by assigned warehouses if they don't have global access
    if (userId) {
      const hasGlobalAccess = await userRepository.hasPermission(userId, PERMISSIONS.WAREHOUSES_MANAGER.MANAGER_ALL.key);
      if (!hasGlobalAccess) {
        where.warehouseManages = {
          some: {
            userId: userId
          }
        };
      }
    }

    const { skip, take } = buildPagination(page, limit);
    
    const orderBy = buildSort(sortBy, order);


    const [warehouses, total] = await Promise.all([
      prisma.warehouse.findMany({
        where,
        skip,
        take,
        select: this.#warehouseSelectOptions,
        orderBy
      }),
      prisma.warehouse.count({ where })
    ]);

    return formatPaginatedResponse(warehouses, total, page, take);
  }

  async nameExists(name, excludeId = null) {
    const where = { name };
    if (excludeId) {
      where.id = { not: parseInt(excludeId) };
    }
    
    const count = await prisma.warehouse.count({ where });
    return count > 0;
  }



  async deleteById(id) {
  return await withPrismaErrorHandling(
      () => prisma.warehouse.delete({
        where: { id: parseInt(id) }
      })
    );
}

  /**
   * Lấy danh sách kệ trong kho theo fabricId với chi tiết từng lô import
   * Trả về các kệ có chứa loại vải đó, chi tiết từng lô: ngày import, giá import, số lượng hiện tại
   * @param {number} warehouseId - ID kho
   * @param {number} fabricId - ID loại vải
   * @returns {Object} Object chứa fabric info và danh sách kệ
   */
  async findShelvesByFabricId(warehouseId, fabricId) {
    // Get all fabricShelf records for this warehouse and fabric with import details
    const fabricShelfRecords = await prisma.fabricShelf.findMany({
      where: {
        fabricId: parseInt(fabricId),
        shelf: {
          warehouseId: parseInt(warehouseId)
        },
        quantity: {
          gt: 0
        }
      },
      select: {
        shelfId: true,
        fabricId: true,
        quantity: true,
        importId: true,
        createdAt: true,
        updatedAt: true,
        shelf: {
          select: {
            id: true,
            code: true,
            currentQuantity: true,
            maxQuantity: true,
          }
        },
        import: {
          select: {
            id: true,
            importDate: true,
            importer: true,
            status: true,
            importItems: {
              where: {
                fabricId: parseInt(fabricId)
              },
              select: {
                price: true,
                quantity: true,
                status: true
              }
            },
            importUser: {
              select: {
                id: true,
                fullname: true,
                email: true
              }
            }
          }
        },
        fabric: {
          select: {
            id: true,
            thickness: true,
            length: true,
            width: true,
            weight: true,
            sellingPrice: true,
            categoryId: true,
            colorId: true,
            supplierId: true,
            category: {
              select: {
                id: true,
                name: true
              }
            },
            color: {
              select: {
                id: true,
                name: true
              }
            },
            supplier: {
              select: {
                id: true,
                name: true
              }
            },
            gloss: {
              select: {
                id: true,
                description: true
              }
            }
          }
        }
      },
      orderBy: [
        { shelfId: 'asc' },
        { import: { importDate: 'desc' } }
      ]
    });

    // Extract fabric info (lấy từ record đầu tiên, tất cả đều giống nhau)
    let fabricInfo = null;
    
    // Group by shelfId and include import batch details
    const shelfMap = new Map();
    fabricShelfRecords.forEach(record => {
      // Lưu fabric info từ record đầu tiên
      if (!fabricInfo) {
        fabricInfo = record.fabric;
      }
      
      const shelfId = record.shelfId;
      
      // Get import price for this fabric from importItems
      const importItem = record.import.importItems[0];
      const importPrice = importItem ? importItem.price : null;
      
      const batchDetail = {
        importId: record.importId,
        importDate: record.import.importDate,
        importStatus: record.import.status,
        importPrice: importPrice,
        currentQuantity: record.quantity,
        originalQuantity: importItem ? importItem.quantity : null,
        importedBy: record.import.importUser,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt
      };

      if (!shelfMap.has(shelfId)) {
        shelfMap.set(shelfId, {
          ...record.shelf,
          totalFabricQuantity: 0,
          batches: []
        });
      }
      
      const shelfData = shelfMap.get(shelfId);
      shelfData.totalFabricQuantity += record.quantity;
      shelfData.batches.push(batchDetail);
    });

    return {
      fabric: fabricInfo,
      shelves: Array.from(shelfMap.values())
    };
  }

  /**
   * Lấy danh sách tất cả các lô vải trong kho theo fabricId (flatten - không group theo shelf)
   * Dùng để tính toán phân bổ lấy hàng tối ưu
   * @param {number} warehouseId - ID kho
   * @param {number} fabricId - ID loại vải
   * @returns {Array} Danh sách các lô vải với thông tin kệ
   */
  async findAllBatchesByFabricId(warehouseId, fabricId) {
    const fabricShelfRecords = await prisma.fabricShelf.findMany({
      where: {
        fabricId: parseInt(fabricId),
        shelf: {
          warehouseId: parseInt(warehouseId)
        },
        quantity: {
          gt: 0
        }
      },
      select: {
        shelfId: true,
        fabricId: true,
        quantity: true,
        importId: true,
        createdAt: true,
        shelf: {
          select: {
            id: true,
            code: true,
            currentQuantity: true,
            maxQuantity: true,
          }
        },
        import: {
          select: {
            id: true,
            importDate: true,
            importItems: {
              where: {
                fabricId: parseInt(fabricId)
              },
              select: {
                price: true,
                quantity: true
              }
            }
          }
        },
        fabric: {
          select: {
            id: true,
            thickness: true,
            length: true,
            width: true,
            weight: true,
            sellingPrice: true,
            category: {
              select: {
                id: true,
                name: true
              }
            },
            color: {
              select: {
                id: true,
                name: true,
                hexCode: true
              }
            },
            supplier: {
              select: {
                id: true,
                name: true
              }
            },
            gloss: {
              select: {
                id: true,
                description: true
              }
            }
          }
        }
      }
    });

    // Flatten thành danh sách các lô
    let fabricInfo = null;
    const batches = fabricShelfRecords.map(record => {
      if (!fabricInfo) {
        fabricInfo = record.fabric;
      }
      
      const importItem = record.import.importItems[0];
      return {
        shelfId: record.shelfId,
        shelfCode: record.shelf.code,
        shelfCurrentQuantity: record.shelf.currentQuantity,
        shelfMaxQuantity: record.shelf.maxQuantity,
        importId: record.importId,
        importDate: record.import.importDate,
        importPrice: importItem ? importItem.price : null,
        availableQuantity: record.quantity,
        createdAt: record.createdAt
      };
    });

    return {
      fabric: fabricInfo,
      batches,
      totalAvailable: batches.reduce((sum, b) => sum + b.availableQuantity, 0)
    };
  }

  /**
   * Tìm kệ theo ID
   */
  async findShelfById(shelfId) {
    return await prisma.shelf.findUnique({
      where: { id: parseInt(shelfId) },
      select: {
        id: true,
        code: true,
        warehouseId: true,
        currentQuantity: true,
        maxQuantity: true
      }
    });
  }

  /**
   * Tìm lần nhập theo ID
   */
  async findImportById(importId) {
    return await prisma.importFabric.findUnique({
      where: { id: parseInt(importId) },
      select: {
        id: true,
        warehouseId: true,
        importDate: true,
        status: true,
        totalPrice: true
      }
    });
  }

  /**
   * Tìm FabricShelf record
   */
  async findFabricShelf(shelfId, fabricId, importId) {
    return await prisma.fabricShelf.findUnique({
      where: {
        shelfId_fabricId_importId: {
          shelfId: parseInt(shelfId),
          fabricId: parseInt(fabricId),
          importId: parseInt(importId)
        }
      },
      select: {
        shelfId: true,
        fabricId: true,
        importId: true,
        quantity: true,
        createdAt: true,
        updatedAt: true
      }
    });
  }

  /**
   * Điều chỉnh số lượng vải trên kệ
   */
  async adjustFabricQuantity(adjustmentData) {
    const { shelfId, fabricId, importId, newQuantity, type, reason, userId, oldQuantity } = adjustmentData;

    return await withPrismaErrorHandling(
      async () => {
        // Calculate quantity change based on type
        let quantityChange;
        if (type === 'IMPORT') {
          quantityChange = newQuantity - oldQuantity; // Positive number
        } else {
          quantityChange = -(oldQuantity - newQuantity); // Negative number
        }

        // Update FabricShelf quantity
        const updatedFabricShelf = await prisma.fabricShelf.update({
          where: {
            shelfId_fabricId_importId: {
              shelfId: parseInt(shelfId),
              fabricId: parseInt(fabricId),
              importId: parseInt(importId)
            }
          },
          data: {
            quantity: newQuantity,
            updatedAt: new Date()
          },
          select: {
            shelfId: true,
            fabricId: true,
            importId: true,
            quantity: true,
            shelf: {
              select: {
                id: true,
                code: true,
                warehouseId: true
              }
            },
            import: {
              select: {
                id: true,
                importDate: true,
                totalPrice: true
              }
            },
            updatedAt: true
          }
        });

        // Update Shelf.currentQuantity (handle both positive and negative changes)
        await prisma.shelf.update({
          where: { id: parseInt(shelfId) },
          data: {
            currentQuantity: {
              increment: quantityChange
            },
            updatedAt: new Date()
          }
        });

        // Update Fabric.quantityInStock (handle both positive and negative changes)
        await prisma.fabric.update({
          where: { id: parseInt(fabricId) },
          data: {
            quantityInStock: {
              increment: quantityChange
            },
            updatedAt: new Date()
          }
        });

        // Update or create WarehouseFabricStock
        const warehouseId = updatedFabricShelf.shelf.warehouseId;
        
        // Try to update existing record, if not exists, create new one
        await prisma.warehouseFabricStock.upsert({
          where: {
            warehouseId_fabricId: {
              warehouseId: parseInt(warehouseId),
              fabricId: parseInt(fabricId)
            }
          },
          update: {
            currentStock: {
              increment: quantityChange
            },
            updatedAt: new Date()
          },
          create: {
            warehouseId: parseInt(warehouseId),
            fabricId: parseInt(fabricId),
            currentStock: newQuantity
          }
        });

        // Create AdjustFabric record for audit
        const adjustRecord = await prisma.adjustFabric.create({
          data: {
            fabricId: parseInt(fabricId),
            shelfId: parseInt(shelfId),
            quantity: Math.abs(quantityChange),
            type,
            price: updatedFabricShelf.import.totalPrice || 0,
            reason,
            userId
          },
          select: {
            id: true,
            fabricId: true,
            shelfId: true,
            quantity: true,
            type: true,
            price: true,
            reason: true,
            userId: true,
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
          }
        });

        return {
          adjustment: adjustRecord,
          fabricShelf: {
            shelfId: updatedFabricShelf.shelfId,
            fabricId: updatedFabricShelf.fabricId,
            importId: updatedFabricShelf.importId,
            oldQuantity,
            newQuantity: updatedFabricShelf.quantity,
            change: quantityChange,
            type,
            shelf: {
              id: updatedFabricShelf.shelf.id,
              code: updatedFabricShelf.shelf.code,
              warehouseId: updatedFabricShelf.shelf.warehouseId
            },
            updatedAt: updatedFabricShelf.updatedAt
          }
        };
      },
      {
        'P2025': 'Không tìm thấy dữ liệu để điều chỉnh'
      }
    );
  }

  /**
   * Tìm lịch sử điều chỉnh vải với advanced query (filter, sort, pagination)
   */
  async findAdjustFabricWithAdvancedQuery(queryOptions = {}) {
    const { 
      page = 1, 
      limit = 10, 
      search = '',
      sortBy = 'createdAt', 
      order = 'desc',
      filters = {}
    } = queryOptions;

    // Searchable fields for adjust fabric history
    const searchableFields = ['reason', 'user.username', 'user.fullname', 'user.email', 'shelf.code'];

    // Filter mapping để map fabric fields và warehouse field vào nested relation
    const filterMapping = {
      categoryId: 'fabric.categoryId',
      colorId: 'fabric.colorId',
      supplierId: 'fabric.supplierId',
      warehouseId: 'shelf.warehouseId'
    };

    const where = buildWhereClause(
      { search, ...filters },
      searchableFields,
      filterMapping
    );

    const select = {
      id: true,
      fabricId: true,
      shelfId: true,
      quantity: true,
      type: true,
      price: true,
      reason: true,
      userId: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: {
          id: true,
          username: true,
          fullname: true,
          email: true,
          phone: true,
          avatar: true,
          address: true,
          gender: true,
          status: true
        }
      },
      fabric: {
        select: {
          id: true,
          thickness: true,
          length: true,
          width: true,
          weight: true,
          sellingPrice: true,
          quantityInStock: true,
          categoryId: true,
          colorId: true,
          supplierId: true,
          glossId: true,
          createdAt: true,
          updatedAt: true,
          category: {
            select: {
              id: true,
              name: true,
              description: true,
              sellingPricePerMeter: true,
              sellingPricePerRoll: true,
              image: true
            }
          },
          color: {
            select: {
              id: true,
              name: true,
              hexCode: true
            }
          },
          supplier: {
            select: {
              id: true,
              name: true,
              address: true,
              phone: true,
              isActive: true
            }
          },
          gloss: {
            select: {
              id: true,
              description: true
            }
          }
        }
      },
      shelf: {
        select: {
          id: true,
          code: true,
          warehouseId: true,
          currentQuantity: true,
          maxQuantity: true,
          warehouse: {
            select: {
              id: true,
              name: true,
              address: true,
              latitude: true,
              longitude: true,
              status: true
            }
          }
        }
      }
    };

    const { skip, take } = buildPagination(page, limit);
    const orderBy = buildSort(sortBy, order);

    const [data, total] = await Promise.all([
      prisma.adjustFabric.findMany({
        where,
        skip,
        take,
        select,
        orderBy
      }),
      prisma.adjustFabric.count({ where })
    ]);

    return formatPaginatedResponse(data, total, page, take);
  }
}

export const warehouseRepository = new WarehouseRepository();