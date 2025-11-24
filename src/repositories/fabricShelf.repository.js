import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

class FabricShelfRepository {

  async assignToShelf(tx, { fabricId, shelfId, quantity }) {
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


    // Tìm xem đã có record FabricShelf chưa
    const existing = await tx.fabricShelf.findUnique({
      where: { shelfId_fabricId: { shelfId, fabricId } }
    });

    // Nếu đã có thì cộng dồn, chưa có thì tạo mới
    let fabricShelf;
    if (existing) {
      fabricShelf = await tx.fabricShelf.update({
        where: { shelfId_fabricId: { shelfId, fabricId } },
        data: { quantity: existing.quantity + quantity },
        include: {
          shelf: { select: { id: true, code: true, warehouseId: true } }
        }
      });
    } else {
      fabricShelf = await tx.fabricShelf.create({
        data: { fabricId, shelfId, quantity },
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
   * Lấy danh sách phân bổ của 1 vải
   */
  async findByFabricId(fabricId) {
    return await prisma.fabricShelf.findMany({
      where: { fabricId },
      include: {
        shelf: { select: { id: true, code: true, warehouseId: true } }
      }
    });
  }

async findByFabricIdInWarehouse(fabricId, warehouseId) {
  return await prisma.fabricShelf.findMany({
    where: {
      fabricId,
      shelf: { warehouseId },
      quantity: { gt: 0 }
    },
    select: {
      shelfId: true,
      quantity: true,
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
}



  /**
   * Lấy 1 record FabricShelf theo shelfId + fabricId
   */
  async findByShelfIdAndFabricId(shelfId, fabricId) {
    return await prisma.fabricShelf.findUnique({
      where: { shelfId_fabricId: { shelfId, fabricId } },
      include: {
        shelf: { select: { id: true, code: true, warehouseId: true } }
      }
    });
  }

  /**
   * Trừ số lượng vải trên kệ
   */
  async decreaseQuantity(shelfId, fabricId, quantity) {
    const fs = await this.findByShelfIdAndFabricId(shelfId, fabricId);
    if (!fs) throw new Error(`Kệ ID ${shelfId} không có vải ${fabricId}`);
    if (fs.quantity < quantity) {
      throw new Error(
        `Kệ ${fs.shelf.code} không đủ số lượng (còn ${fs.quantity}, cần ${quantity})`
      );
    }

    // Trừ quantity trong FabricShelf
    await prisma.fabricShelf.update({
      where: { shelfId_fabricId: { shelfId, fabricId } },
      data: { quantity: { decrement: quantity } }
    });

    // Trừ currentQuantity của shelf
    await prisma.shelf.update({
      where: { id: shelfId },
      data: { currentQuantity: { decrement: quantity } }
    });

    return true;
  }

}

export const fabricShelfRepository = new FabricShelfRepository();
