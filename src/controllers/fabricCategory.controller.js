import * as fabricCategoryService from '../services/fabricCategory.service.js';
import { buildQueryParams } from '../utils/filter-builder.js';

/**  Lấy danh sách FabricCategory (hỗ trợ filter, sort, pagination) */
export const getAllFabricCategories = async (req, res, next) => {
  try {
    const queryParams = buildQueryParams(req.query, {
      filterFields: ['name', 'sellingPricePerMeter', 'sellingPricePerRoll'], // có thể filter thêm theo giá
      dateRangeConfig: {
        fromField: 'createdFrom',
        toField: 'createdTo',
        targetField: 'createdAt'
      }
    });

    const result = await fabricCategoryService.getAllFabricCategoriesAdvanced(queryParams);

    res.json({
      message: 'Lấy danh sách loại vải thành công',
      ...result
    });
  } catch (error) {
    next(error);
  }
};

/** Lấy FabricCategory theo ID */
export const getFabricCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const fabricCategory = await fabricCategoryService.getFabricCategoryById(id);

    if (!fabricCategory) {
      return res.status(404).json({ message: 'Không tìm thấy loại vải' });
    }

    res.json({
      message: 'Lấy thông tin loại vải thành công',
      data: fabricCategory
    });
  } catch (error) {
    next(error);
  }
};

export const createFabricCategory = async (req, res, next) => {
  try {
    const fabricCategory = await fabricCategoryService.createFabricCategory(req.body);

    res.status(201).json({
      message: 'Tạo loại vải thành công',
      data: fabricCategory
    });
  } catch (error) {
    next(error);
  }
};

/**  Cập nhật FabricCategory */
export const updateFabricCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updatedFabricCategory = await fabricCategoryService.updateFabricCategory(id, req.body);

    res.json({
      message: 'Cập nhật loại vải thành công',
      data: updatedFabricCategory
    });
  } catch (error) {
    next(error);
  }
};

/**  Xóa FabricCategory */
export const deleteFabricCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await fabricCategoryService.deleteFabricCategory(id);

    res.status(200).json({
      success: true,
      message: 'Xóa loại vải thành công',
      data: result
    });
  } catch (error) {
    next(error);
  }
};
