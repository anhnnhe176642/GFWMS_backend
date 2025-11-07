import { NotFoundError } from '../utils/errors.js';
import fabricCategoryRepository from '../repositories/fabricCategory.repository.js';

/**  Lấy tất cả FabricCategory với phân trang cơ bản */
export const getAllFabricCategories = async (page, limit) => {
  return await fabricCategoryRepository.findWithPagination(page, limit);
};

/**  Lấy tất cả FabricCategory với filter/search/sort/pagination nâng cao */
export const getAllFabricCategoriesAdvanced = async (queryOptions) => {
  return await fabricCategoryRepository.findWithAdvancedQuery(queryOptions);
};

/**  Tạo mới FabricCategory */
export const createFabricCategory = async (data) => {
  const { name, description, sellingPricePerMeter, sellingPricePerRoll } = data;

  return await fabricCategoryRepository.create({
    name,
    description,
    sellingPricePerMeter,
    sellingPricePerRoll
  });
};

/**  Lấy FabricCategory theo ID */
export const getFabricCategoryById = async (id) => {
  const category = await fabricCategoryRepository.findById(id);

  if (!category) {
    throw new NotFoundError('Loại vải bạn tìm không tồn tại trong hệ thống');
  }

  return category;
};

/**  Cập nhật FabricCategory */
export const updateFabricCategory = async (id, data) => {
  const existing = await fabricCategoryRepository.findById(id);
  if (!existing) {
    throw new NotFoundError('Loại vải bạn cần cập nhật không tồn tại trong hệ thống');
  }

  return await fabricCategoryRepository.updateById(id, data);
};

/** Xóa FabricCategory theo ID */
export const deleteFabricCategory = async (id) => {
  const existing = await fabricCategoryRepository.findById(id);
  if (!existing) {
    throw new NotFoundError('Loại vải cần xóa không tồn tại trong hệ thống');
  }

  return await fabricCategoryRepository.deleteById(id);
};
