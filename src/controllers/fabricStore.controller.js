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
        filterFields: []
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
}

export default new FabricStoreController();
