import { NotFoundError } from '../utils/errors.js';
import fabricCategoryRepository from '../repositories/fabricCategory.repository.js';

/** 🔹 Lấy tất cả FabricCategory với phân trang cơ bản */
export const getAllFabricCategories = async (page, limit) => {
  return await fabricCategoryRepository.findWithPagination(page, limit);
};

/** 🔹 Lấy tất cả FabricCategory với filter/search/sort/pagination nâng cao */
export const getAllFabricCategoriesAdvanced = async (queryOptions) => {
  return await fabricCategoryRepository.findWithAdvancedQuery(queryOptions);
};

/** 🔹 Tạo mới FabricCategory */
export const createFabricCategory = async (data) => {
  return await fabricCategoryRepository.create(data);
};

/** 🔹 Lấy FabricCategory theo ID */
export const getFabricCategoryById = async (id) => {
  const category = await fabricCategoryRepository.findById(id);

  if (!category) {
    throw new NotFoundError('FabricCategory không tồn tại');
  }

  return category;
};

/** 🔹 Cập nhật FabricCategory */
export const updateFabricCategory = async (id, data) => {
  const existing = await fabricCategoryRepository.findById(id);
  if (!existing) {
    throw new NotFoundError('FabricCategory không tồn tại');
  }

  return await fabricCategoryRepository.updateById(id, data);
};
