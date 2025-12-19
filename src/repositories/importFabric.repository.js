import { PrismaClient } from '@prisma/client';
import { withPrismaErrorHandling } from '../utils/prisma-error-handler.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { buildPagination, buildSort, formatPaginatedResponse, buildWhereClause } from '../utils/query-builder.js';

const prisma = new PrismaClient();

class ImportFabricRepository {

// cho list
  #importFabricListSelectOptions = {
    id: true,
    importDate: true,
    totalPrice: true,
    status: true,
    signatureImageUrl: true,
    warehouse: {
      select: {
        id: true,
        name: true
      }
    },
    importUser: {
      select: {
        fullname: true
      }
    },
    createdAt: true
  }; 

  // cho detail
  #importFabricSelectOptions = {
    id: true,
    warehouseId: true,
    importer: true,
    importDate: true,
    totalPrice: true,
    status: true,
    signatureImageUrl: true,
    signatureImagePublicId: true,
    warehouse: {
      select: {
        id: true,
        name: true,
        address: true
      }
    },
    importUser: {
      select: {
        id: true,
        fullname: true,
        email: true,
        phone: true
      }
    },
    importItems: {
      select: {
        importFabricId: true,
        fabricId: true,
        quantity: true,
        price: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        fabric: {
          include: {
            supplier: { select: { id: true, name: true, phone: true } },
            category: { select: { id: true, name: true } },
            color: { select: { id: true, name: true, hexCode: true } },
            gloss: { select: { id: true, description: true } }
          }
        }
      }
    },
    createdAt: true,
    updatedAt: true
  };

// Lít ImportFabric
  async findAllImportFabric(queryOptions = {}) {
    const { 
      page = 1, 
      limit = 10, 
      search = '',
      sortBy = 'importDate', 
      order = 'desc',
      filters = {}
    } = queryOptions;

    const searchableFields = ['importUser.fullname'];

    const where = buildWhereClause(
      { search, ... filters },
      searchableFields
    );

    const { skip, take } = buildPagination(page, limit);
    const orderBy = buildSort(sortBy, order);

    const [importFabrics, total] = await Promise.all([
      prisma.importFabric.findMany({
        where,
        skip,
        take,
        select: this.#importFabricListSelectOptions,
        orderBy
      }),
      prisma.importFabric.count({ where })
    ]);

    return formatPaginatedResponse(importFabrics, total, page, take);
  }

  //detail lay theo id nhap kho
  async findById(id) {
    const importFabric = await prisma.importFabric.findUnique({
      where: { id: parseInt(id) },
      select: this.#importFabricSelectOptions
    });

    if (!importFabric) {
      throw new NotFoundError(`Không tìm thấy phiếu nhập với ID: ${id}`);
    }

    return importFabric;
  }



  #calculateTotalPrice(items) {
    return items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  }

  async create(data, items) {
    return await withPrismaErrorHandling(
      () => prisma.$transaction(async (tx) => {
        const warehouse = await tx.warehouse.findUnique({
          where: { id: data.warehouseId }
        });
        if (!warehouse) {
          throw new NotFoundError('Không tìm thấy kho');
        }

        const user = await tx.user.findUnique({
          where: { id: data.importer }
        });
        if (!user) {
          throw new NotFoundError('Không tìm thấy người nhập');
        }

        const fabricIds = items.map(item => item.fabricId);
        const fabrics = await tx.fabric.findMany({
          where: { id: { in: fabricIds } },
          select: { id: true }
        });

        if (fabrics.length !== fabricIds.length) {
          const foundIds = fabrics.map(f => f.id);
          const missingIds = fabricIds.filter(id => !foundIds.includes(id));
          throw new NotFoundError(`Fabric không tồn tại với ID: ${missingIds.join(', ')}`);
        }

        const totalPrice = this.#calculateTotalPrice(items);

        const importFabric = await tx.importFabric.create({
          data: {
            warehouseId: data.warehouseId,
            importer: data.importer,
            totalPrice: totalPrice,
            signatureImageUrl: data.signatureImageUrl || null,
            signatureImagePublicId: data.signatureImagePublicId || null
          }
        });

        await tx.importFabricItem.createMany({
          data: items.map(item => ({
            importFabricId: importFabric.id,
            fabricId: item.fabricId,
            quantity: item.quantity,
            price: item.price
          }))
        });

        await Promise.all(
          items.map(item =>
            tx.fabric.update({
              where: { id: item.fabricId },
              data: { quantityInStock: { increment: item.quantity } }
            })
          )
        );

        return await tx.importFabric.findUnique({
          where: { id: importFabric.id },
          select: this.#importFabricSelectOptions
        });
      }),
      {
        warehouseId: 'Kho không tồn tại',
        importer: 'Người nhập không tồn tại'
      }
    );
  }

  // Cập nhật trạng thái phiếu nhập vải
  async updateStatus(id, status) {
    const importFabric = await prisma.importFabric.findUnique({
      where: { id: parseInt(id) }
    });

    if (!importFabric) {
      throw new NotFoundError(`Không tìm thấy phiếu nhập với ID: ${id}`);
    }

    return await withPrismaErrorHandling(
      () => prisma.importFabric.update({
        where: { id: parseInt(id) },
        data: { status },
        select: this.#importFabricSelectOptions
      }),
      {
        status: 'Trạng thái không hợp lệ'
      }
    );
  }

  // Kiểm tra xem tất cả items có hoàn thành (STORED) hay không
  async #checkAllItemsStored(importFabricId) {
    const pendingItems = await prisma.importFabricItem.findFirst({
      where: {
        importFabricId,
        status: { not: 'STORED' }
      }
    });

    return !pendingItems; // true nếu tất cả đã STORED, false nếu còn pending/cancelled
  }

  // Cập nhật trạng thái với kiểm tra items
  async updateStatusWithValidation(id, status) {
    const importFabric = await prisma.importFabric.findUnique({
      where: { id: parseInt(id) }
    });

    if (!importFabric) {
      throw new NotFoundError(`Không tìm thấy phiếu nhập với ID: ${id}`);
    }

    // Nếu muốn cập nhật thành COMPLETED, kiểm tra tất cả items phải có status STORED
    if (status === 'COMPLETED') {
      const allItemsStored = await this.#checkAllItemsStored(parseInt(id));
      
      if (!allItemsStored) {
        throw new ValidationError('Không thể hoàn thành phiếu nhập. Tất cả các item phải có trạng thái STORED');
      }
    }

    return await withPrismaErrorHandling(
      () => prisma.importFabric.update({
        where: { id: parseInt(id) },
        data: { status },
        select: this.#importFabricSelectOptions
      }),
      {
        status: 'Trạng thái không hợp lệ'
      }
    );
  }
}

export const importFabricRepository = new ImportFabricRepository();