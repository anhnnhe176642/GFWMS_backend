import { NotFoundError, ValidationError } from '../utils/errors.js';
import fabricCategoryRepository from '../repositories/fabricCategory.repository.js';
import { ConflictError } from '../utils/errors.js';
import { uploadSingleImage } from './upload.service.js';
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
  const existingCategory = await fabricCategoryRepository.findById(id);
  if (!existingCategory) {
    throw new NotFoundError('Loại vải không tồn tại');
  }

  // Kiểm tra xem có Fabric nào thuộc category này không
  const fabricCount = await fabricCategoryRepository.countFabricsInCategory(id);
  if (fabricCount > 0) {
    throw new ConflictError(
      `Không thể xóa  ${existingCategory.name} vì đang có ${fabricCount} mẫu vải tham chiếu đến`
    );
  }

  return await fabricCategoryRepository.deleteById(id);
};

/**  Upload hoặc cập nhật ảnh FabricCategory */
export const uploadCategoryImage = async (categoryId, imageFile) => {
  if (!imageFile) {
    throw new ValidationError('Ảnh loại vải là bắt buộc', 'image');
  }

  // Get current category to get old image publicId
  const currentCategory = await fabricCategoryRepository.findById(categoryId);
  if (!currentCategory) {
    throw new NotFoundError('Loại vải không tồn tại');
  }

  // Upload new image and auto-delete old one
  const result = await uploadSingleImage(imageFile, {
    folder: 'fabric-categories',
    preset: 'product',
    oldPublicId: currentCategory?.imagePublicId,
    fieldName: 'image'
  });

  // Update category with new image URL and publicId
  return await fabricCategoryRepository.updateById(categoryId, {
    image: result.url,
    imagePublicId: result.publicId
  });
};
