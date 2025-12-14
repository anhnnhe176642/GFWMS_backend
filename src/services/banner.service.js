import { NotFoundError, ConflictError, ValidationError } from '../utils/errors.js';
import bannerRepository from '../repositories/banner.repository.js';
import { uploadSingleImage } from './upload.service.js';

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

/**  Upload hoặc cập nhật ảnh Banner */
export const uploadBannerImage = async (bannerId, imageFile) => {
  if (!imageFile) {
    throw new ValidationError('Ảnh banner là bắt buộc', 'image');
  }

  // Get current banner to get old image publicId
  const currentBanner = await bannerRepository.findById(bannerId);
  if (!currentBanner) {
    throw new NotFoundError('Banner không tồn tại');
  }

  // Upload new image and auto-delete old one
  const result = await uploadSingleImage(imageFile, {
    folder: 'banners',
    preset: 'product',
    oldPublicId: currentBanner?.imagePublicId,
    fieldName: 'image'
  });

  // Update banner with new image URL and publicId
  return await bannerRepository.updateById(bannerId, {
    imageUrl: result.url,
    imagePublicId: result.publicId
  });
};
