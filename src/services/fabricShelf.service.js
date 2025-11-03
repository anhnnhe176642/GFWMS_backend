import { PrismaClient } from '@prisma/client';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import { fabricShelfRepository } from '../repositories/fabricShelf.repository.js';
import { ImportFabricItemStatus } from '@prisma/client';

const prisma = new PrismaClient();

class FabricShelfService {
  /**
   * Phân bổ vải vào các kệ trong 1 đơn nhập cụ thể
   */
  async assignFabricToShelves({ fabricId, importFabricId, shelves }) {
    if (!fabricId) throw new ValidationError('ID vải là bắt buộc');
    if (!importFabricId) throw new ValidationError('ID đơn nhập là bắt buộc');
    if (!shelves || shelves.length === 0)
      throw new ValidationError('Danh sách kệ không được để trống');

    // 🔹 Kiểm tra tồn tại vải
    const fabric = await prisma.fabric.findUnique({ where: { id: fabricId } });
    if (!fabric) throw new NotFoundError(`Không tìm thấy vải có ID: ${fabricId}`);

  // 🔹 Tìm bản ghi bất kỳ (không cần status)
  const importItemAny = await prisma.importFabricItem.findFirst({
    where: { importFabricId, fabricId }
  });

  if (!importItemAny) {
    throw new NotFoundError(
      `Không tìm thấy vải có ID ${fabricId} trong đơn nhập ${importFabricId}`
    );
  }

  // 🔹 Nếu bản ghi tồn tại nhưng không phải PENDING
  if (importItemAny.status !== ImportFabricItemStatus.PENDING) {
    throw new ValidationError(
      `Vải có ID ${fabricId} trong đơn nhập ${importFabricId} đã được phân bổ lên kệ rồi`
    );
  }

  // 🔹 Lúc này chắc chắn là PENDING
  const importItem = importItemAny;


    const totalImportedQty = importItem.quantity;

    // 🔹 Tổng số lượng người dùng muốn phân bổ
    const totalAssignedQty = shelves.reduce((sum, s) => sum + s.quantity, 0);

    if (totalAssignedQty !== totalImportedQty) {
      throw new ValidationError(
        `Tổng số lượng phân bổ (${totalAssignedQty}) phải bằng tổng số lượng nhập (${totalImportedQty}) trong đơn nhập này`
      );
    }

    // 🔹 Lấy danh sách kệ
    const shelfIds = shelves.map(s => s.shelfId);
    const foundShelves = await prisma.shelf.findMany({
      where: { id: { in: shelfIds } },
      select: { id: true, code: true, currentQuantity: true, maxQuantity: true, warehouseId: true }
    });

    if (foundShelves.length !== shelfIds.length) {
      const missing = shelfIds.filter(id => !foundShelves.some(s => s.id === id));
      throw new NotFoundError(`Không tìm thấy các kệ: ${missing.join(', ')}`);
    }

    // 🔹 Kiểm tra cùng kho
    const warehouseId = foundShelves[0].warehouseId;
    if (foundShelves.some(s => s.warehouseId !== warehouseId)) {
      throw new ValidationError('Tất cả kệ phải thuộc cùng một kho');
    }

    // 🔹 Kiểm tra sức chứa kệ
    for (const s of shelves) {
      const shelf = foundShelves.find(f => f.id === s.shelfId);
      const remaining = shelf.maxQuantity - shelf.currentQuantity;
      if (remaining < s.quantity) {
        throw new ValidationError(
          `Kệ ${shelf.code} không đủ chỗ: hiện tại còn trống ${remaining}, số lượng muốn thêm vào ${s.quantity}`
        );
      }
    }

    // 🔹 Transaction
    return await prisma.$transaction(async tx => {
      for (const s of shelves) {
        await fabricShelfRepository.assignToShelf(tx, {
          fabricId,
          shelfId: s.shelfId,
          quantity: s.quantity
        });

      }

    // Cập nhật status importFabricItem thành STORED
    await tx.importFabricItem.update({
    where: { importFabricId_fabricId: { importFabricId, fabricId } },
    data: { status: ImportFabricItemStatus.STORED }
    });


      return {
        fabricId,
        importFabricId,
        totalQuantity: totalAssignedQty,
        shelves
      };
    });
  }
}

export const fabricShelfService = new FabricShelfService();
