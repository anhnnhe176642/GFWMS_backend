import fabricStoreRepository from '../repositories/fabricStore.repository.js';
import { storeRepository } from '../repositories/store.repository.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class FabricStoreService {
  /**
   * Lấy danh sách vải trong cửa hàng với advanced query
   */
  async getStoreFabrics(storeId, queryOptions) {
    const result = await fabricStoreRepository.findAllByStoreWithAdvancedQuery(storeId, queryOptions);
    
    // Transform data để format response
    const transformedData = result.data.map(item => ({
      fabricId: item.fabricId,
      storeId: item.storeId,
      fabricInfo: {
        id: item.fabric.id,
        category: item.fabric.category?.name || 'N/A',
        categoryId: item.fabric.category?.id,
        color: item.fabric.color?.name || 'N/A',
        colorId: item.fabric.color?.id,
        gloss: item.fabric.gloss?.description || 'N/A',
        glossId: item.fabric.gloss?.id,
        supplier: item.fabric.supplier?.name || 'N/A',
        supplierId: item.fabric.supplier?.id,
        length: item.fabric.length,
        width: item.fabric.width,
        weight: item.fabric.weight,
        thickness: item.fabric.thickness,
        sellingPrice: item.fabric.sellingPrice,
        sellingPricePerMeter: item.fabric.category?.sellingPricePerMeter || 0,
        sellingPricePerRoll: item.fabric.category?.sellingPricePerRoll || 0
      },
      storeInfo: {
        id: item.store.id,
        name: item.store.name,
        address: item.store.address
      },
      inventory: {
        quantity: item.quantity,
        totalValue: item.totalValue,
        totalMeters: item.totalMeters,
        uncutRolls: item.uncutRolls,
        cuttingRollMeters: item.cuttingRollMeters,
        averagePricePerMeter: item.totalMeters > 0 ? item.totalValue / item.totalMeters : 0
      },
      updatedAt: item.updatedAt,
      createdAt: item.createdAt
    }));

    return {
      data: transformedData,
      pagination: result.pagination
    };
  }

  /**
   * Lấy chi tiết một fabric trong store
   */
  async getStoreFabricDetail(fabricId, storeId) {
    const fabricStore = await fabricStoreRepository.findByFabricAndStore(fabricId, storeId);
    
    if (!fabricStore) {
      throw new NotFoundError('Không tìm thấy vải trong cửa hàng');
    }

    return {
      fabricId: fabricStore.fabricId,
      storeId: fabricStore.storeId,
      fabricInfo: {
        id: fabricStore.fabric.id,
        category: fabricStore.fabric.category?.name || 'N/A',
        categoryId: fabricStore.fabric.category?.id,
        categoryDescription: fabricStore.fabric.category?.description,
        color: fabricStore.fabric.color?.name || 'N/A',
        colorId: fabricStore.fabric.color?.id,
        gloss: fabricStore.fabric.gloss?.description || 'N/A',
        glossId: fabricStore.fabric.gloss?.id,
        supplier: fabricStore.fabric.supplier?.name || 'N/A',
        supplierId: fabricStore.fabric.supplier?.id,
        supplierPhone: fabricStore.fabric.supplier?.phone,
        supplierAddress: fabricStore.fabric.supplier?.address,
        length: fabricStore.fabric.length,
        width: fabricStore.fabric.width,
        weight: fabricStore.fabric.weight,
        thickness: fabricStore.fabric.thickness,
        sellingPrice: fabricStore.fabric.sellingPrice,
        sellingPricePerMeter: fabricStore.fabric.category?.sellingPricePerMeter || 0,
        sellingPricePerRoll: fabricStore.fabric.category?.sellingPricePerRoll || 0,
        quantityInStock: fabricStore.fabric.quantityInStock
      },
      storeInfo: {
        id: fabricStore.store.id,
        name: fabricStore.store.name,
        address: fabricStore.store.address
      },
      inventory: {
        quantity: fabricStore.quantity,
        totalValue: fabricStore.totalValue,
        totalMeters: fabricStore.totalMeters,
        uncutRolls: fabricStore.uncutRolls,
        cuttingRollMeters: fabricStore.cuttingRollMeters,
        averagePricePerMeter: fabricStore.totalMeters > 0 
          ? fabricStore.totalValue / fabricStore.totalMeters 
          : 0
      },
      createdAt: fabricStore.createdAt,
      updatedAt: fabricStore.updatedAt
    };
  }

  /**
   * Nhập vải vào cửa hàng
   */
  async importFabric(fabricId, storeId, rolls, importPrice) {
    // Kiểm tra fabric có tồn tại không
    const fabric = await prisma.fabric.findUnique({
      where: { id: fabricId },
      include: { category: true }
    });

    if (!fabric) {
      throw new NotFoundError('Không tìm thấy vải');
    }

    if (rolls <= 0) {
      throw new ValidationError('Số cuộn phải lớn hơn 0');
    }

    if (importPrice <= 0) {
      throw new ValidationError('Giá nhập phải lớn hơn 0');
    }

    const metersPerRoll = fabric.length;

    // Thực hiện nhập vải
    const result = await fabricStoreRepository.importFabricRolls(
      fabricId, 
      storeId, 
      rolls, 
      importPrice, 
      metersPerRoll
    );

    return {
      fabricId: result.fabricId,
      storeId: result.storeId,
      fabricInfo: {
        category: result.fabric.category?.name,
        color: result.fabric.color?.name,
        gloss: result.fabric.gloss?.description,
        metersPerRoll: result.fabric.length
      },
      importDetails: {
        rollsImported: rolls,
        metersImported: rolls * metersPerRoll,
        importPricePerRoll: importPrice,
        totalImportValue: rolls * importPrice
      },
      newInventory: {
        totalValue: result.totalValue,
        totalMeters: result.totalMeters,
        uncutRolls: result.uncutRolls,
        cuttingRollMeters: result.cuttingRollMeters,
        quantity: result.quantity
      }
    };
  }

  /**
   * Cắt vải từ cửa hàng
   */
  async cutFabric(fabricId, storeId, metersToCut) {
    if (metersToCut <= 0) {
      throw new ValidationError('Số mét cần cắt phải lớn hơn 0','metersToCut');
    }

    // kiểm tra xem store có tồn tại không
    const store = await storeRepository.findById(storeId);
    if (!store) {
      throw new NotFoundError('Không tìm thấy cửa hàng','storeId');
    }

    // Kiểm tra fabric store có tồn tại không
    const currentStore = await fabricStoreRepository.findByFabricAndStore(fabricId, storeId);
    
    if (!currentStore) {
      throw new NotFoundError('Không tìm thấy vải trong cửa hàng','fabricId');
    }

    if (currentStore.totalMeters < metersToCut) {
      throw new ValidationError(
        `Không đủ vải để cắt. Hiện tại chỉ có ${currentStore.totalMeters.toFixed(2)} mét`,
        'metersToCut'
      );
    }

    // Tính giá trị bị trừ
    const pricePerMeter = currentStore.totalMeters > 0 
      ? currentStore.totalValue / currentStore.totalMeters 
      : 0;
    const valueDeducted = metersToCut * pricePerMeter;

    // Thực hiện cắt vải
    const result = await fabricStoreRepository.cutFabric(fabricId, storeId, metersToCut);

    return {
      fabricId: result.fabricId,
      storeId: result.storeId,
      fabricInfo: {
        category: result.fabric.category?.name,
        color: result.fabric.color?.name,
        gloss: result.fabric.gloss?.description,
        sellingPricePerMeter: result.fabric.category?.sellingPricePerMeter || 0
      },
      cutDetails: {
        metersCut: metersToCut,
        costPricePerMeter: pricePerMeter,
        totalCostValue: valueDeducted,
        sellingPricePerMeter: result.fabric.category?.sellingPricePerMeter || 0,
        estimatedRevenue: metersToCut * (result.fabric.category?.sellingPricePerMeter || 0),
        estimatedProfit: (metersToCut * (result.fabric.category?.sellingPricePerMeter || 0)) - valueDeducted,
        profitMargin: pricePerMeter > 0 
          ? (((result.fabric.category?.sellingPricePerMeter || 0) - pricePerMeter) / pricePerMeter * 100).toFixed(2) + '%'
          : 'N/A'
      },
      remainingInventory: {
        totalValue: result.totalValue,
        totalMeters: result.totalMeters,
        uncutRolls: result.uncutRolls,
        cuttingRollMeters: result.cuttingRollMeters,
        quantity: result.quantity
      }
    };
  }
}

export default new FabricStoreService();
