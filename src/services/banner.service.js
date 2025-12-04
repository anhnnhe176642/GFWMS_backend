import { NotFoundError, ConflictError } from '../utils/errors.js';
import bannerRepository from '../repositories/banner.repository.js';

/** Lấy tất cả Banner với phân trang cơ bản */
export const getAllBanners = async (page, limit) => {
  return await bannerRepository.findWithPagination(page, limit);
};

/** Lấy tất cả Banner với filter/search/sort/pagination nâng cao */
export const getAllBannersAdvanced = async (queryOptions) => {
  return await bannerRepository.findWithAdvancedQuery(queryOptions);
};

/** Tạo mới Banner */
export const createBanner = async (data) => {
  const { title, imageUrl, description, startDate, endDate, isActive = true } = data;

  return await bannerRepository.create({
    title,
    imageUrl,
    description,
    startDate,
    endDate,
    isActive
  });
};

/** Lấy Banner theo ID */
export const getBannerById = async (id) => {
  const banner = await bannerRepository.findById(id);

  if (!banner) {
    throw new NotFoundError('Không tìm thấy Banner');
  }

  return banner;
};

/** Cập nhật Banner */
export const updateBanner = async (id, data) => {
  const existing = await bannerRepository.findById(id);
  if (!existing) {
    throw new NotFoundError('Banner cần cập nhật không tồn tại trong hệ thống');
  }

  return await bannerRepository.updateById(id, data);
};

/** Xóa Banner */
export const deleteBanner = async (id) => {
  const existingBanner = await bannerRepository.findById(id);
  if (!existingBanner) {
    throw new NotFoundError('Banner cần xóa không tồn tại');
  }

  // Kiểm tra ràng buộc nếu cần (ví dụ BannerDiscount)
  const discountCount = await bannerRepository.countDiscountsInBanner(id);
  if (discountCount > 0) {
    throw new ConflictError(
      `Không thể xóa banner vì có dữ liệu khác đang tham chiếu đến bản ghi này`
    );
  }

  return await bannerRepository.deleteById(id);
};
