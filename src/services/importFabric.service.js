import { importFabricRepository } from '../repositories/importFabric.repository.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class ImportFabricService {

  async #findOrCreateFabric(fabricAttributes) {
    const { thickness, glossId, length, width, weight, categoryId, colorId, supplierId } = fabricAttributes;

    const [gloss, category, color, supplier] = await Promise.all([
      prisma.fabricGloss.findUnique({ where: { id: glossId } }),
      prisma.fabricCategory.findUnique({ where: { id: categoryId } }),
      prisma.fabricColor.findUnique({ where: { id: colorId } }),
      prisma.supplier.findUnique({ where: { id: supplierId } })
    ]);

    if (!gloss) {
      throw new NotFoundError(`Không tìm thấy độ bóng với ID: ${glossId}`);
    }
    if (!category) {
      throw new NotFoundError(`Không tìm thấy danh mục với ID: ${categoryId}`);
    }
    if (!color) {
      throw new NotFoundError(`Không tìm thấy màu với ID: ${colorId}`);
    }
    if (!supplier) {
      throw new NotFoundError(`Không tìm thấy nhà cung cấp với ID: ${supplierId}`);
    }

    const existingFabric = await prisma.fabric.findFirst({
      where: {
        thickness,
        glossId,
        length,
        width,
        weight,
        categoryId,
        colorId,
        supplierId
      }
    });

    if (existingFabric) {

      return existingFabric.id;
    }

    const newFabric = await prisma.fabric.create({
      data: {
        thickness,
        length,
        width,
        weight,
        quantityInStock: 0,
        sellingPrice: null,

        gloss: {
          connect: { id: glossId }
        },
        category: {
          connect: { id: categoryId }
        },
        color: {
          connect: { id: colorId }
        },
        supplier: {
          connect: { id: supplierId }
        }
      }
    });



    return newFabric.id;
  }

  async createImport(data, items) {
    if (!items || items.length === 0) {
      throw new ValidationError('Danh sách vải không được để trống');
    }

    const processedItems = [];
    
    for (const item of items) {
      const fabricId = await this.#findOrCreateFabric(item);

      processedItems.push({
        fabricId,
        quantity: item.quantity,
        price: item.price
      });
    }
    
    return await importFabricRepository.create(data, processedItems);
  }

  async getById(id) {
    return await importFabricRepository.findById(id);
  }

  async getAllImportFabricsAdvanced(queryOptions) {
    return await importFabricRepository.findAllImportFabric(queryOptions);
  }

}

export const importFabricService = new ImportFabricService();