import { NotFoundError } from '../utils/errors.js';
import { fabricColorRepository } from '../repositories/fabricColor.repository.js';

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
