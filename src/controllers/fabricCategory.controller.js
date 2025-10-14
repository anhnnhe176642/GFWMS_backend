import * as fabricCategoryService from '../services/fabricCategory.service.js';
import { buildQueryParams } from '../utils/filter-builder.js';

/** 🔹 Lấy danh sách FabricCategory (hỗ trợ filter, sort, pagination) */
export const getAllFabricCategories = async (req, res, next) => {
  try {
    const queryParams = buildQueryParams(req.query, {
      filterFields: [], // nếu muốn filter theo field nào thêm vào đây
      dateRangeConfig: {
        fromField: 'createdFrom',
        toField: 'createdTo',
        targetField: 'createdAt'
      }
    });

    const result = await fabricCategoryService.getAllFabricCategoriesAdvanced(queryParams);

    res.json({
      message: 'Lấy danh sách fabric category thành công',
      ...result
    });
  } catch (error) {
    next(error);
  }
};

/** 🔹 Lấy FabricCategory theo ID */
export const getFabricCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const fabricCategory = await fabricCategoryService.getFabricCategoryById(id);

    if (!fabricCategory) {
      return res.status(404).json({ message: 'Không tìm thấy fabric category' });
    }

    res.json({
      message: 'Lấy thông tin fabric category thành công',
      fabricCategory
    });
  } catch (error) {
    next(error);
  }
};

/** 🔹 Tạo mới FabricCategory */
export const createFabricCategory = async (req, res, next) => {
  try {
    const categoryData = req.body;
    const fabricCategory = await fabricCategoryService.createFabricCategory(categoryData);

    res.status(201).json({
      message: 'Tạo fabric category thành công',
      fabricCategory
    });
  } catch (error) {
    next(error);
  }
};

/** 🔹 Cập nhật FabricCategory */
export const updateFabricCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const categoryData = req.body;

    const updatedFabricCategory = await fabricCategoryService.updateFabricCategory(id, categoryData);

    res.json({
      message: 'Cập nhật fabric category thành công',
      fabricCategory: updatedFabricCategory
    });
  } catch (error) {
    next(error);
  }
};
