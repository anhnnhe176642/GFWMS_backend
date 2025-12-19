import { importFabricRepository } from '../repositories/importFabric.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { userActivityService } from './userActivity.service.js';
import { uploadSingleImage } from './upload.service.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import { PrismaClient } from '@prisma/client';
import { PERMISSIONS } from '../constants/permissions.js';

const prisma = new PrismaClient();

class ImportFabricService {

  async #findOrCreateFabric(fabricAttributes, hasSellingPricePermission) {
    const { thickness, glossId, length, width, weight, categoryId, colorId, supplierId, sellingPrice } = fabricAttributes;

    const [gloss, category, color, supplier] = await Promise.all([
      prisma.fabricGloss.findUnique({ where: { id: glossId } }),
      prisma.fabricCategory.findUnique({ 
        where: { id: categoryId },
        select: {
          id: true,
          sellingPricePerRoll: true
        }
      }),
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

    const finalSellingPrice = hasSellingPricePermission && sellingPrice != null ? sellingPrice : category.sellingPricePerRoll;
      
    if (existingFabric) {
      let priceToUpdate;
      if (finalSellingPrice !== null) {
        priceToUpdate = finalSellingPrice;
      } else {
        priceToUpdate = existingFabric.sellingPrice ?? category.sellingPricePerRoll ?? null;
      }
      if (priceToUpdate !== existingFabric.sellingPrice) {
          await prisma.fabric.update({
            where: { id: existingFabric.id },
            data: { sellingPrice: priceToUpdate }
          });
        }
      return existingFabric.id;
    }

    const newFabric = await prisma.fabric.create({
      data: {
        thickness,
        length,
        width,
        weight,
        quantityInStock: 0,
        sellingPrice: finalSellingPrice,

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

  async createImport(data, items, user) {
    if (!items || items.length === 0) {
      throw new ValidationError('Danh sách vải không được để trống');
    }

    const hasSellingPricePermission = await userRepository.hasPermission(
      user.id, 
      PERMISSIONS.IMPORT_FABRICS.SET_SELLING_PRICE.key
    );

    const processedItems = [];
    
    for (const item of items) {
      const fabricId = await this.#findOrCreateFabric(item, hasSellingPricePermission);

      processedItems.push({
        fabricId,
        quantity: item.quantity,
        price: item.price
      });
    }
    
    // Handle signature image upload if provided
    let signatureImageUrl = null;
    let signatureImagePublicId = null;

    if (data.signatureFile) {
      const result = await uploadSingleImage(data.signatureFile, {
        folder: 'import-fabrics/signatures',
        preset: 'document',
        fieldName: 'signatureImage'
      });

      signatureImageUrl = result.url;
      signatureImagePublicId = result.publicId;
    }

    // Prepare import data with signature fields
    const importData = {
      warehouseId: data.warehouseId,
      importer: data.importer,
      signatureImageUrl,
      signatureImagePublicId
    };
    
    return await importFabricRepository.create(importData, processedItems);
  }

  async getById(id) {
    return await importFabricRepository.findById(id);
  }

  async getAllImportFabricsAdvanced(queryOptions) {
    return await importFabricRepository.findAllImportFabric(queryOptions);
  }


  // Cập nhật trạng thái phiếu nhập vải
  async updateStatus(id, status, userId = null) {
    const result = await importFabricRepository.updateStatusWithValidation(id, status);
    
    // Log activity if status becomes COMPLETED and userId is available
    if (status === 'COMPLETED' && userId) {
      await userActivityService.logActivity(
        userId,
        'IMPORT_COMPLETED',
        'ImportFabric',
        result.id,
        `Hoàn thành phiếu nhập vải #${result.id}`
      );
    }
    
    return result;
  }

  // lay gia ban cua vai dua tren thuoc tinh
  async getFabricSellingPrice(fabricAttributes) {
    const {
      thickness,
      glossId,
      length,
      width,
      weight,
      categoryId,
      colorId,
      supplierId
    } = fabricAttributes;

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
      },
      include: {
        category: {
          select: {
            sellingPricePerRoll: true
          }
        }
      }
    });

    if (!existingFabric) {
      const category = await prisma.fabricCategory.findUnique({
        where: { id: categoryId },
        select: { sellingPricePerRoll: true }
      });
      return {
        sellingPrice: category?.sellingPricePerRoll ?? null
      };
    }

    return {
      sellingPrice: existingFabric.sellingPrice ?? existingFabric.category.sellingPricePerRoll
    };
  }

}

export const importFabricService = new ImportFabricService();