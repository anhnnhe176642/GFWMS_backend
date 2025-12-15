import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

class FabricShelfRepository {

  async assignToShelf(tx, { fabricId, shelfId, quantity, importId }) {
    //  Lấy thông tin kệ
    const shelf = await tx.shelf.findUnique({
      where: { id: shelfId },
      select: {
        id: true,
        code: true,
        currentQuantity: true,
        maxQuantity: true
      }
    });
    if (!shelf) throw new Error('Shelf not found');

    // Kiểm tra còn chỗ trống không
    const remainingCapacity = shelf.maxQuantity - shelf.currentQuantity;
    if (remainingCapacity < quantity) {
        throw new Error(
            `Kệ ${shelf.code} không đủ chỗ trống (còn ${remainingCapacity}, cần ${quantity})`
        );
    }

    // Tìm xem đã có record FabricShelf với cùng shelfId, fabricId, importId chưa
    const existing = await tx.fabricShelf.findUnique({
      where: { shelfId_fabricId_importId: { shelfId, fabricId, importId } }
    });

    // Nếu đã có thì cộng dồn, chưa có thì tạo mới
    let fabricShelf;
    if (existing) {
      fabricShelf = await tx.fabricShelf.update({
        where: { shelfId_fabricId_importId: { shelfId, fabricId, importId } },
        data: { quantity: existing.quantity + quantity },
        include: {
          shelf: { select: { id: true, code: true, warehouseId: true } }
        }
      });
    } else {
      fabricShelf = await tx.fabricShelf.create({
        data: { fabricId, shelfId, quantity, importId },
        include: {
          shelf: { select: { id: true, code: true, warehouseId: true } }
        }
      });
    }

    //Cập nhật currentQuantity của kệ
    await tx.shelf.update({
      where: { id: shelfId },
      data: { currentQuantity: { increment: quantity } }
    });

    return fabricShelf;
  }

  /**
   * Lấy danh sách phân bổ của 1 vải (gom nhóm theo fabricId)
   * Trả về tổng quantity của từng loại vải trên mỗi kệ
   */
  async findByFabricId(fabricId) {
    const records = await prisma.fabricShelf.findMany({
      where: { fabricId },
      include: {
        shelf: { select: { id: true, code: true, warehouseId: true } }
      }
    });

    // Gom nhóm theo shelfId và tính tổng quantity
    const grouped = records.reduce((acc, record) => {
      const key = record.shelfId;
      if (!acc[key]) {
        acc[key] = {
          shelfId: record.shelfId,
          fabricId: record.fabricId,
          shelf: record.shelf,
          totalQuantity: 0,
          importCount: 0
        };
      }
      acc[key].totalQuantity += record.quantity;
      acc[key].importCount += 1;
      return acc;
    }, {});

    return Object.values(grouped);
  }

  /**
   * Lấy chi tiết phân bổ của 1 vải trên 1 kệ (bao gồm thông tin từng lần nhập)
   */
  async findDetailByShelfIdAndFabricId(shelfId, fabricId) {
    return await prisma.fabricShelf.findMany({
      where: { shelfId, fabricId },
      include: {
        shelf: { select: { id: true, code: true, warehouseId: true } },
        import: {
          select: {
            id: true,
            importDate: true,
            totalPrice: true,
            status: true,
            importUser: {
              select: { id: true, fullname: true, username: true }
            },
            importItems: {
              where: { fabricId },
              select: { price: true, quantity: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findByFabricIdInWarehouse(fabricId, warehouseId) {
    const records = await prisma.fabricShelf.findMany({
      where: {
        fabricId,
        shelf: { warehouseId },
        quantity: { gt: 0 }
      },
      select: {
        shelfId: true,
        quantity: true,
        importId: true,
        shelf: {
          select: {
            id: true,
            code: true,
            createdAt: true   
          }
        }
      },
      orderBy: [
        { shelf: { createdAt: 'asc' }}, 
        { quantity: 'desc' }           
      ]
    });

    // Gom nhóm theo shelfId và tính tổng quantity
    const grouped = records.reduce((acc, record) => {
      const key = record.shelfId;
      if (!acc[key]) {
        acc[key] = {
          shelfId: record.shelfId,
          quantity: 0,
          shelf: record.shelf
        };
      }
      acc[key].quantity += record.quantity;
      return acc;
    }, {});

    return Object.values(grouped);
  }

  /**
   * Lấy 1 record FabricShelf theo shelfId + fabricId (gom nhóm - tính tổng)
   */
  async findByShelfIdAndFabricId(shelfId, fabricId) {
    const records = await prisma.fabricShelf.findMany({
      where: { shelfId, fabricId },
      include: {
        shelf: { select: { id: true, code: true, warehouseId: true } }
      }
    });

    if (records.length === 0) return null;

    // Tính tổng quantity từ tất cả các lần nhập
    const totalQuantity = records.reduce((sum, r) => sum + r.quantity, 0);
    
    return {
      shelfId,
      fabricId,
      quantity: totalQuantity,
      shelf: records[0].shelf,
      importCount: records.length
    };
  }

  /**
   * Lấy các record FabricShelf theo shelfId + fabricId có quantity > 0
   * Sử dụng cho việc xuất kho theo FIFO (nhập trước xuất trước)
   */
  async findRecordsForExport(shelfId, fabricId) {
    return await prisma.fabricShelf.findMany({
      where: { shelfId, fabricId, quantity: { gt: 0 } },
      include: {
        shelf: { select: { id: true, code: true, warehouseId: true } },
        import: { select: { id: true, importDate: true } }
      },
      orderBy: { import: { importDate: 'asc' } } // FIFO
    });
  }

  /**
   * Trừ số lượng vải trên kệ (theo FIFO - nhập trước xuất trước)
   */
  async decreaseQuantity(shelfId, fabricId, quantity) {
    const records = await this.findRecordsForExport(shelfId, fabricId);
    
    if (records.length === 0) {
      throw new Error(`Kệ ID ${shelfId} không có vải ${fabricId}`);
    }

    const totalAvailable = records.reduce((sum, r) => sum + r.quantity, 0);
    if (totalAvailable < quantity) {
      throw new Error(
        `Kệ ${records[0].shelf.code} không đủ số lượng (còn ${totalAvailable}, cần ${quantity})`
      );
    }

    let remainingToDeduct = quantity;

    // Trừ theo FIFO
    for (const record of records) {
      if (remainingToDeduct <= 0) break;

      const deductAmount = Math.min(record.quantity, remainingToDeduct);
      
      await prisma.fabricShelf.update({
        where: { 
          shelfId_fabricId_importId: { 
            shelfId, 
            fabricId, 
            importId: record.importId 
          } 
        },
        data: { quantity: { decrement: deductAmount } }
      });

      remainingToDeduct -= deductAmount;
    }

    // Trừ currentQuantity của shelf
    await prisma.shelf.update({
      where: { id: shelfId },
      data: { currentQuantity: { decrement: quantity } }
    });

    return true;
  }

  /**
   * Lấy danh sách unique color của các vải trên kệ
   */
  async getColorsByShelfId(shelfId) {
    return await prisma.$queryRaw`
      SELECT DISTINCT fc.id, fc.name, fc.hexCode
      FROM fabric_shelf fs
      JOIN fabric f ON fs.fabricId = f.id
      JOIN fabric_color fc ON f.colorId = fc.id
      WHERE fs.shelfId = ${shelfId}
    `;
  }

}

export const fabricShelfRepository = new FabricShelfRepository();
