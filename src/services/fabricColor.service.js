import { NotFoundError } from '../utils/errors.js';
import { fabricColorRepository } from '../repositories/fabricColor.repository.js';
import { ConflictError } from '../utils/errors.js';
/**  Lấy tất cả FabricColor với phân trang cơ bản */
export const getAllFabricColors = async (page, limit) => {
  return await fabricColorRepository.findWithPagination(page, limit);
};

/**  Lấy tất cả FabricColor với filter/search/sort/pagination nâng cao */
export const getAllFabricColorsAdvanced = async (queryOptions) => {
  return await fabricColorRepository.findWithAdvancedQuery(queryOptions);
};

/**  Tạo mới FabricColor */
export const createFabricColor = async (data) => {
  return await fabricColorRepository.create(data);
};

/**  Lấy FabricColor theo ID */
export const getFabricColorById = async (id) => {
  const color = await fabricColorRepository.findById(id);

  if (!color) {
    throw new NotFoundError('Màu vải bạn tìm không tồn tại trong hệ thống');
  }

  return color;
};

/**  Cập nhật FabricColor */
export const updateFabricColor = async (id, data) => {
  const existing = await fabricColorRepository.findById(id);
  if (!existing) {
    throw new NotFoundError('Màu vải bạn cần cập nhật không tồn tại trong hệ thống');
  }

  return await fabricColorRepository.updateById(id, data);
};

export const deleteFabricColor = async (id) => {
  const existingColor = await fabricColorRepository.findById(id);
  if (!existingColor) {
    throw new NotFoundError('Màu vải không tồn tại trong hệ thống');
  }

  const fabricCount = await fabricColorRepository.countFabricsWithColor(id);
  if (fabricCount > 0) {
    throw new ConflictError(
      `Không thể xóa màu ${existingColor.name} vì đang có ${fabricCount} mẫu vải sử dụng màu này`
    );
  }

  return await fabricColorRepository.deleteById(id);
};
