import fabricStoreService from '../services/fabricStore.service.js';
import { buildQueryParams } from '../utils/filter-builder.js';

class FabricStoreController {
  /**
   * Lấy danh sách vải trong cửa hàng
   */
  async getStoreFabrics(req, res, next) {
    try {
      const { storeId } = req.params;

      const queryParams = buildQueryParams(req.query, {
        filterFields: ['glossId', 'categoryId', 'colorId', 'supplierId'],
        dateRangeConfig: {
          fromField: 'createdFrom',
          toField: 'createdTo',
          targetField: 'createdAt'
        }
      });

      const result = await fabricStoreService.getStoreFabrics(
        parseInt(storeId),
        queryParams
      );

      res.json({
        message: 'Lấy danh sách vải trong cửa hàng thành công',
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lấy chi tiết một fabric trong store
   */
  async getStoreFabricDetail(req, res, next) {
    try {
      const { storeId, fabricId } = req.params;

      const result = await fabricStoreService.getStoreFabricDetail(
        parseInt(fabricId), 
        parseInt(storeId)
      );

      res.json({
        message: 'Lấy chi tiết vải trong cửa hàng thành công',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Nhập vải vào cửa hàng
   */
  async importFabric(req, res, next) {
    try {
      const { storeId } = req.params;
      const { fabricId, rolls, importPrice } = req.body;

      const result = await fabricStoreService.importFabric(
        parseInt(fabricId),
        parseInt(storeId),
        parseInt(rolls),
        parseFloat(importPrice)
      );

      res.status(201).json({
        message: 'Nhập vải vào cửa hàng thành công',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cắt vải từ cửa hàng
   */
  async cutFabric(req, res, next) {
    try {
      const { storeId } = req.params;
      const { fabricId, meters } = req.body;

      const result = await fabricStoreService.cutFabric(
        parseInt(fabricId),
        parseInt(storeId),
        parseFloat(meters)
      );

      res.json({
        message: 'Cắt vải thành công',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Allocate fabrics bằng greedy algorithm
   * Nhận mảng các yêu cầu phân bổ, xử lý tuần tự với cập nhật tồn kho
   */
  async allocateFabricsByGreedy(req, res, next) {
    try {
      const { storeId, allocations } = req.body;

      const result = await fabricStoreService.allocateFabricsByGreedyAlgorithm({
        storeId: parseInt(storeId),
        allocations: allocations.map(item => ({
          categoryId: parseInt(item.categoryId),
          quantity: parseInt(item.quantity),
          unit: item.unit,
          colorId: item.colorId,
          glossId: item.glossId ? parseInt(item.glossId) : undefined,
          thickness: item.thickness ? parseFloat(item.thickness) : undefined,
          width: item.width ? parseFloat(item.width) : undefined,
          length: item.length ? parseFloat(item.length) : undefined
        }))
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export default new FabricStoreController();
