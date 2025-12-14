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
        colorHexCode: fabricStore.fabric.color?.hexCode || 'N/A',
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
    const totalMeters = rolls * metersPerRoll;
    const totalValue = rolls * importPrice;

    // Thực hiện nhập vải
    const result = await fabricStoreRepository.importFabricRolls({
      fabricId,
      storeId,
      totalValue,
      totalMeters,
      uncutRolls: rolls,
      cuttingRollMeters: 0
    });

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
        cuttingRollMeters: result.cuttingRollMeters
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
        cuttingRollMeters: result.cuttingRollMeters
      }
    };
  }

  /**
   * Allocate fabrics bằng greedy algorithm
   * Tìm các fabric theo categoryId và optional filters
   * Lấy vải có tồn kho nhiều nhất trước (theo đơn vị tương ứng)
   * 
   * @param {Object} params - {categoryId, quantity, unit, storeId, colorId?, glossId?, thickness?, width?, length?}
   * @returns {Promise<Object>} - {allocations: [{fabricId, quantity, unit, fabric info}], totalQuantity}
   */
  async allocateFabricsByGreedyAlgorithm(params) {
    const {
      categoryId,
      quantity,
      unit,
      storeId,
      colorId,
      glossId,
      thickness,
      width,
      length
    } = params;

    // Validate store exists
    const store = await storeRepository.findById(storeId);
    if (!store) {
      throw new NotFoundError(`Cửa hàng (ID ${storeId}) không tồn tại`);
    }

    // Build filters object (chỉ include nếu có giá trị)
    const filters = {};
    if (colorId) filters.colorId = colorId;
    if (glossId) filters.glossId = glossId;
    if (thickness !== undefined) filters.thickness = thickness;
    if (width !== undefined) filters.width = width;
    if (length !== undefined) filters.length = length;

    // Lấy danh sách fabrics trong store theo categoryId và filters
    const fabricsInStore = await fabricStoreRepository.findFabricsInStoreByFilters(
      storeId,
      categoryId,
      filters
    );

    if (fabricsInStore.length === 0) {
      throw new NotFoundError(
        'Không tìm thấy vải trong cửa hàng này với các điều kiện lọc đã chỉ định'
      );
    }

    // Build allocation list với tồn kho theo đơn vị
    const allocationCandidates = fabricsInStore.map(item => ({
      fabricId: item.fabricId,
      fabricInfo: item.fabric,
      available: unit === 'ROLL' ? item.uncutRolls : item.totalMeters,
      uncutRolls: item.uncutRolls,
      totalMeters: item.totalMeters,
      cuttingRollMeters: item.cuttingRollMeters
    }));

    // Sort theo tồn kho nhiều nhất trước (descending)
    allocationCandidates.sort((a, b) => b.available - a.available);

    // Greedy algorithm: lấy vải từ những cái có tồn kho nhiều nhất
    const allocations = [];
    let remainingQuantity = quantity;

    for (const candidate of allocationCandidates) {
      if (remainingQuantity <= 0) break;

      const quantityToTake = Math.min(remainingQuantity, candidate.available);
      
      // Tính giá bán theo quy tắc:
      // - Giá bán theo cuộn: fabric.sellingPrice nếu not null, else category.sellingPricePerRoll
      // - Giá bán theo mét: category.sellingPricePerMeter
      const sellingPricePerRoll = candidate.fabricInfo.sellingPrice !== null 
        ? candidate.fabricInfo.sellingPrice 
        : candidate.fabricInfo.category?.sellingPricePerRoll || 0;
      const sellingPricePerMeter = candidate.fabricInfo.category?.sellingPricePerMeter || 0;

      // Tính tổng giá trị dự kiến
      let estimatedValue = 0;
      if (unit === 'ROLL') {
        estimatedValue = quantityToTake * sellingPricePerRoll;
      } else {
        estimatedValue = quantityToTake * sellingPricePerMeter;
      }
      
      allocations.push({
        fabricId: candidate.fabricId,
        fabricInfo: {
          id: candidate.fabricInfo.id,
          category: candidate.fabricInfo.category?.name,
          categoryId: candidate.fabricInfo.category?.id,
          color: candidate.fabricInfo.color?.name,
          colorId: candidate.fabricInfo.color?.id,
          gloss: candidate.fabricInfo.gloss?.description,
          glossId: candidate.fabricInfo.gloss?.id,
          thickness: candidate.fabricInfo.thickness,
          width: candidate.fabricInfo.width,
          length: candidate.fabricInfo.length
        },
        pricing: {
          sellingPricePerRoll,
          sellingPricePerMeter,
          estimatedValue
        },
        quantity: quantityToTake,
        unit,
        available: candidate.available,
        uncutRolls: candidate.uncutRolls,
        totalMeters: candidate.totalMeters,
        cuttingRollMeters: candidate.cuttingRollMeters
      });

      remainingQuantity -= quantityToTake;
    }

    // Check if we have enough inventory
    if (remainingQuantity > 0) {
      const totalAvailable = allocationCandidates.reduce((sum, c) => sum + c.available, 0);
      throw new ValidationError(
        `Không đủ tồn kho. Cần: ${quantity} ${unit}, Có: ${totalAvailable} ${unit}`
      );
    }

    // Tính tổng giá trị từ tất cả allocations
    const totalValue = allocations.reduce((sum, item) => sum + item.pricing.estimatedValue, 0);

    return {
      message: 'Phân bổ vải thành công',
      allocations,
      totalQuantity: quantity,
      unit,
      totalValue,
      storeId,
      storeName: store.name
    };
  }
}

export default new FabricStoreService();
