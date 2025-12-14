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

    //  Kiểm tra tồn tại vải
    const fabric = await prisma.fabric.findUnique({ where: { id: fabricId } });
    if (!fabric) throw new NotFoundError(`Không tìm thấy vải có ID: ${fabricId}`);

  //  Tìm bản ghi bất kỳ (không cần status)
  const importItemAny = await prisma.importFabricItem.findFirst({
    where: { importFabricId, fabricId }
  });

  if (!importItemAny) {
    throw new NotFoundError(
      `Không tìm thấy vải có ID ${fabricId} trong đơn nhập ${importFabricId}`
    );
  }

  //  Nếu bản ghi tồn tại nhưng không phải PENDING
  if (importItemAny.status !== ImportFabricItemStatus.PENDING) {
    throw new ValidationError(
      `Vải có ID ${fabricId} trong đơn nhập ${importFabricId} đã được phân bổ lên kệ rồi`
    );
  }

  //  Lúc này chắc chắn là PENDING
  const importItem = importItemAny;


    const totalImportedQty = importItem.quantity;

    //  Tổng số lượng người dùng muốn phân bổ
    const totalAssignedQty = shelves.reduce((sum, s) => sum + s.quantity, 0);

    if (totalAssignedQty !== totalImportedQty) {
      throw new ValidationError(
        `Tổng số lượng phân bổ (${totalAssignedQty}) phải bằng tổng số lượng nhập (${totalImportedQty}) trong đơn nhập này`
      );
    }

    //  Lấy danh sách kệ
    const shelfIds = shelves.map(s => s.shelfId);
    const foundShelves = await prisma.shelf.findMany({
      where: { id: { in: shelfIds } },
      select: { id: true, code: true, currentQuantity: true, maxQuantity: true, warehouseId: true }
    });

    if (foundShelves.length !== shelfIds.length) {
      const missing = shelfIds.filter(id => !foundShelves.some(s => s.id === id));
      throw new NotFoundError(`Không tìm thấy kệ có id là: ${missing.join(', ')}`);
    }

    //  Kiểm tra cùng kho
    const warehouseId = foundShelves[0].warehouseId;
    if (foundShelves.some(s => s.warehouseId !== warehouseId)) {
      throw new ValidationError('Tất cả kệ phải thuộc cùng một kho');
    }

    //  Kiểm tra sức chứa kệ
    for (const s of shelves) {
      const shelf = foundShelves.find(f => f.id === s.shelfId);
      const remaining = shelf.maxQuantity - shelf.currentQuantity;
      if (remaining < s.quantity) {
        throw new ValidationError(
          `Kệ ${shelf.code} không đủ chỗ: hiện tại còn trống ${remaining}, số lượng muốn thêm vào ${s.quantity}`
        );
      }
    }

    //  Transaction
    return await prisma.$transaction(async tx => {
      for (const s of shelves) {
        await fabricShelfRepository.assignToShelf(tx, {
          fabricId,
          shelfId: s.shelfId,
          quantity: s.quantity,
          importId: importFabricId
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

  /**
   * Lấy chi tiết vải trong kệ (bao gồm thông tin từng lần nhập)
   * Trả về: giá nhập, ngày nhập, người nhập, số lượng hiện tại trên kệ (có thể đã xuất kho một phần)
   */
  async getFabricShelfDetail(shelfId, fabricId) {
    const details = await fabricShelfRepository.findDetailByShelfIdAndFabricId(shelfId, fabricId);
    
    if (!details || details.length === 0) {
      throw new NotFoundError(`Không tìm thấy vải ID ${fabricId} trên kệ ID ${shelfId}`);
    }

    // Tính tổng số lượng hiện tại trên kệ từ FabricShelf records
    const totalCurrentQuantity = details.reduce((sum, d) => sum + d.quantity, 0);
    const importCount = details.length;
    
    const importDetails = details.map(d => ({
      importId: d.importId,
      currentQuantity: d.quantity,  //  Số lượng hiện tại trên kệ từ lần import này (có thể đã xuất kho)
      importDate: d.import.importDate,
      importer: d.import.importUser,
      importPrice: d.import.importItems[0]?.price || null,  //  Giá lúc import
      importStatus: d.import.status
    }));

    return {
      shelfId,
      fabricId,
      shelf: details[0].shelf,
      totalCurrentQuantity,  //  Tổng số lượng hiện tại trên kệ
      importCount,           //  Số lần import
      imports: importDetails
    };
  }

  /**
   * Lấy danh sách vải trên kệ (gom nhóm theo fabricId)
   */
  async getFabricsByShelfId(shelfId) {
    const shelf = await prisma.shelf.findUnique({
      where: { id: shelfId },
      select: { id: true, code: true, warehouseId: true, currentQuantity: true, maxQuantity: true }
    });

    if (!shelf) {
      throw new NotFoundError(`Không tìm thấy kệ có ID: ${shelfId}`);
    }

    const records = await prisma.fabricShelf.findMany({
      where: { shelfId },
      include: {
        fabric: {
          include: {
            category: { select: { id: true, name: true } },
            color: { select: { id: true, name: true } },
            gloss: { select: { id: true, description: true } }
          }
        }
      }
    });

    // Gom nhóm theo fabricId
    const grouped = records.reduce((acc, record) => {
      const key = record.fabricId;
      if (!acc[key]) {
        acc[key] = {
          fabricId: record.fabricId,
          fabric: record.fabric,
          totalQuantity: 0,
          importCount: 0
        };
      }
      acc[key].totalQuantity += record.quantity;
      acc[key].importCount += 1;
      return acc;
    }, {});

    return {
      shelf,
      fabrics: Object.values(grouped)
    };
  }
}

export const fabricShelfService = new FabricShelfService();
