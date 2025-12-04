import * as fabricColorService from '../services/fabricColor.service.js';
import { buildQueryParams } from '../utils/filter-builder.js';

/**  Lấy danh sách FabricColor (hỗ trợ filter, sort, pagination) */
export const getAllFabricColors = async (req, res, next) => {
  try {
    const queryParams = buildQueryParams(req.query, {
      filterFields: [], 
      dateRangeConfig: {
        fromField: 'createdFrom',
        toField: 'createdTo',
        targetField: 'createdAt'
      }
    });

    const result = await fabricColorService.getAllFabricColorsAdvanced(queryParams);

    res.json({
      message: 'Lấy danh sách fabric color thành công',
      ...result
    });
  } catch (error) {
    next(error);
  }
};

/**  Lấy FabricColor theo ID */
export const getFabricColorById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const fabricColor = await fabricColorService.getFabricColorById(id);

    if (!fabricColor) {
      return res.status(404).json({ message: 'Không tìm thấy màu vải' });
    }

    res.json({
      message: 'Lấy thông tin màu vải thành công',
      fabricColor
    });
  } catch (error) {
    next(error);
  }
};

/**  Tạo mới FabricColor */
export const createFabricColor = async (req, res, next) => {
  try {
    const colorData = req.body;
    const fabricColor = await fabricColorService.createFabricColor(colorData);

    res.status(201).json({
      message: 'Tạo màu vải thành công',
      fabricColor
    });
  } catch (error) {
    next(error);
  }
};

/**  Cập nhật FabricColor */
export const updateFabricColor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const colorData = req.body;

    const updatedFabricColor = await fabricColorService.updateFabricColor(id, colorData);

    res.json({
      message: 'Cập nhật màu vải thành công',
      fabricColor: updatedFabricColor
    });
  } catch (error) {
    next(error);
  }
};

export const deleteFabricColor  = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await fabricColorService.deleteFabricColor(id);

    res.status(200).json({
      success: true,
      message: 'Xóa màu vải thành công',
      data: result
    });
  } catch (error) {
    next(error);
  }
};