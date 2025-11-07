import * as fabricGlossService from '../services/fabricgloss.service.js';
import { buildQueryParams } from '../utils/filter-builder.js';

/**  Lấy danh sách FabricGloss (hỗ trợ filter, sort, pagination) */
export const getAllFabricGlosses = async (req, res, next) => {
  try {
    const queryParams = buildQueryParams(req.query, {
      filterFields: [], 
      dateRangeConfig: {
        fromField: 'createdFrom',
        toField: 'createdTo',
        targetField: 'createdAt'
      }
    });

    const result = await fabricGlossService.getAllFabricGlossesAdvanced(queryParams);

    res.json({
      message: 'Lấy danh sách fabric gloss thành công',
      ...result
    });
  } catch (error) {
    next(error);
  }
};

/**  Lấy FabricGloss theo ID */
export const getFabricGlossById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const fabricGloss = await fabricGlossService.getFabricGlossById(parseInt(id));

    if (!fabricGloss) {
      return res.status(404).json({ message: 'Không tìm thấy fabric gloss' });
    }

    res.json({
      message: 'Lấy thông tin fabric gloss thành công',
      fabricGloss
    });
  } catch (error) {
    next(error);
  }
};

/** Tạo mới FabricGloss */
export const createFabricGloss = async (req, res, next) => {
  try {
    const glossData = req.body;
    const fabricGloss = await fabricGlossService.createFabricGloss(glossData);

    res.status(201).json({
      message: 'Tạo fabric gloss thành công',
      fabricGloss
    });
  } catch (error) {
    next(error);
  }
};

/**  Cập nhật FabricGloss */
export const updateFabricGloss = async (req, res, next) => {
  try {
    const { id } = req.params;
    const glossData = req.body;

    const updatedFabricGloss = await fabricGlossService.updateFabricGloss(parseInt(id), glossData);

    res.json({
      message: 'Cập nhật fabric gloss thành công',
      fabricGloss: updatedFabricGloss
    });
  } catch (error) {
    next(error);
  }
};

export const deleteFabricGloss  = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await fabricGlossService.deleteFabricGloss(id);

    res.status(200).json({
      success: true,
      message: 'Xóa độ bóng vải thành công',
      data: result
    });
  } catch (error) {
    next(error);
  }
};