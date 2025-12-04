import * as exportFabricService from '../services/exportFabric.service.js';
import { buildQueryParams } from '../utils/filter-builder.js';

/**  Lấy danh sách phiếu xuất vải (hỗ trợ filter, sort, pagination) */
export const getAllExportFabrics = async (req, res, next) => {
  try {
    const queryParams = buildQueryParams(req.query, {
      filterFields: ['warehouseId', 'storeId', 'status', 'createdById', 'receivedById'],
      dateRangeConfig: {
        fromField: 'createdFrom',
        toField: 'createdTo',
        targetField: 'createdAt'
      }
    });

    const result = await exportFabricService.getAllExportFabricsAdvanced(queryParams);

    res.json({
      message: 'Lấy danh sách phiếu xuất vải thành công',
      ...result
    });
  } catch (error) {
    next(error);
  }
};

export const getExportFabricDetailForWarehouse = async (req, res, next) => {
  try {
    const { id } = req.params;

    const exportFabric = await exportFabricService.getExportFabricDetailForWarehouse(
      parseInt(id)
    );

    if (!exportFabric) {
      return res.status(404).json({ message: 'Không tìm thấy phiếu xuất vải' });
    }

    res.json({
      message: 'Lấy thông tin phiếu xuất vải cho kho thành công',
      exportFabric
    });
  } catch (error) {
    next(error);
  }
};

export const getExportFabricDetailForStore = async (req, res, next) => {
  try {
    const { id } = req.params;

    const exportFabric = await exportFabricService.getExportFabricDetailForStore(
      parseInt(id)
    );

    if (!exportFabric) {
      return res.status(404).json({ message: 'Không tìm thấy phiếu xuất vải' });
    }

    res.json({
      message: 'Lấy thông tin phiếu xuất vải cho cửa hàng thành công',
      exportFabric
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Preview inventory - Xem tồn kho theo warehouse cho danh sách fabric
 */
export const previewInventory = async (req, res, next) => {
  try {
    const { fabricItems } = req.body;

    const result = await exportFabricService.previewInventory(fabricItems);

    res.json({
      message: 'Lấy thông tin tồn kho thành công',
      ...result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Suggest optimal allocation - Gợi ý phân bổ tối ưu (Greedy)
 */
export const suggestAllocation = async (req, res, next) => {
  try {
    const { fabricItems } = req.body;

    const suggestions = await exportFabricService.suggestOptimalAllocation(fabricItems);

    res.json({
      message: 'Gợi ý phân bổ thành công',
      warehouseAllocations: suggestions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create batch export fabrics - Tạo nhiều phiếu xuất (1 per warehouse)
 */
export const createBatchExportFabric = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { storeId, note, warehouseAllocations } = req.body;

    const result = await exportFabricService.createBatchExportFabric({
      storeId,
      note,
      createdById: userId,
      warehouseAllocations
    });

    res.status(201).json({
      message: 'Tạo phiếu xuất vải thành công',
      batchId: result.batchId,
      exports: result.exports
    });
  } catch (error) {
    next(error);
  }
};

export const createExportFabric = async (req, res, next) => {
  try {
    const userId = req.user.id; // ID của nhân viên đang đăng nhập
    const exportData = req.body;

    const createdExport = await exportFabricService.createExportFabric({
      ...exportData,
      createdById: userId
    });

    res.status(201).json({
      message: 'Tạo phiếu xuất vải thành công',
      exportFabric: createdExport
    });
  } catch (error) {
    next(error);
  }
};

export const updateExportFabricStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, itemShelfSelections } = req.body;
    const userId = req.user.id; // nhân viên kho đang duyệt

    const updatedExport = await exportFabricService.approveExportFabric({
      exportFabricId: parseInt(id),
      status,
      itemShelfSelections,
      approvedById: userId
    });

    res.json({
      message: 'Cập nhật trạng thái đơn thành công',
      exportFabric: updatedExport
    });
  } catch (error) {
    next(error);
  }
};
