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
}

export const fabricShelfRepository = new FabricShelfRepository();
