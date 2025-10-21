import { NotFoundError } from '../utils/errors.js';
import { fabricGlossRepository } from '../repositories/fabricgloss.repository.js';

/** 🔹 Lấy tất cả FabricGloss với phân trang cơ bản */
export const getAllFabricGlosses = async (page, limit) => {
  return await fabricGlossRepository.findWithPagination(page, limit);
};

/** 🔹 Lấy tất cả FabricGloss với filter/search/sort/pagination nâng cao */
export const getAllFabricGlossesAdvanced = async (queryOptions) => {
  return await fabricGlossRepository.findWithAdvancedQuery(queryOptions);
};

/** 🔹 Tạo mới FabricGloss */
export const createFabricGloss = async (data) => {
  return await fabricGlossRepository.create(data);
};

/** 🔹 Lấy FabricGloss theo ID */
export const getFabricGlossById = async (id) => {
  const gloss = await fabricGlossRepository.findById(id);

  if (!gloss) {
    throw new NotFoundError('Độ bóng bạn cần tìm không tồn tại trong hệ thống');
  }

  return gloss;
};

/** 🔹 Cập nhật FabricGloss */
export const updateFabricGloss = async (id, data) => {
  const existing = await fabricGlossRepository.findById(id);
  if (!existing) {
    throw new NotFoundError('Độ bóng bạn cần cập nhật không tồn tại trong hệ thống');
  }

  return await fabricGlossRepository.updateById(id, data);
};
