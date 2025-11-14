import { NotFoundError, ConflictError } from '../utils/errors.js';
import bannerDiscountRepository from '../repositories/bannerDiscount.repository.js';
import bannerRepository from '../repositories/banner.repository.js';
import { fabricRepository } from '../repositories/fabric.repository.js';
/** Lấy danh sách BannerDiscounts với filter, pagination */
export const getAllBannerDiscounts = async ({ bannerId, fabricId, page = 1, limit = 10 }) => {
  const queryOptions = {
    page,
    limit,
    bannerId,
    fabricId
  };
  return await bannerDiscountRepository.findWithAdvancedQuery(queryOptions);
};

/** Lấy BannerDiscount theo ID */
export const getBannerDiscountById = async (id) => {
  const discount = await bannerDiscountRepository.findById(id);
  if (!discount) {
    throw new NotFoundError('Banner discount không tồn tại trong hệ thống');
  }
  return discount;
};

/** Tạo BannerDiscount mới */
export const createBannerDiscount = async (data) => {
  const { code, bannerId, fabricId, discountType, discountValue, minQuantity } = data;

  // Kiểm tra banner tồn tại
  const bannerExists = await bannerRepository.findById(bannerId);
  if (!bannerExists) {
    throw new NotFoundError('Banner không tồn tại trong hệ thống');
  }

  // Kiểm tra fabric tồn tại
  const fabricExists = await fabricRepository.findById(fabricId);
  if (!fabricExists) {
    throw new NotFoundError('Vải không tồn tại trong hệ thống');
  }

  // Kiểm tra code trùng
  const existingCode = await bannerDiscountRepository.findByCode(code);
  if (existingCode) {
    throw new ConflictError(`Banner discount với mã code "${code}" đã tồn tại trong hệ thống`);
  }

  return await bannerDiscountRepository.create({
    code,
    bannerId,
    fabricId,
    discountType,
    discountValue,
    minQuantity
  });
};

/** Cập nhật BannerDiscount */
export const updateBannerDiscount = async (id, data) => {
  const existingDiscount = await bannerDiscountRepository.findById(id);
  if (!existingDiscount) {
    throw new NotFoundError('Banner discount không tồn tại trong hệ thống');
  }

  // Nếu code thay đổi, kiểm tra trùng
  if (data.code && data.code !== existingDiscount.code) {
    const duplicate = await bannerDiscountRepository.findByCode(data.code);
    if (duplicate) {
      throw new ConflictError(`Banner discount với code "${data.code}" đã tồn tại trong hệ thống`);
    }
  }

  // Nếu bannerId thay đổi, kiểm tra tồn tại banner
  if (data.bannerId && data.bannerId !== existingDiscount.bannerId) {
    const bannerExists = await bannerRepository.findById(data.bannerId);
    if (!bannerExists) {
      throw new NotFoundError('Banner không tồn tại trong hệ thống');
    }
  }

  // Nếu fabricId thay đổi, kiểm tra tồn tại fabric
  if (data.fabricId && data.fabricId !== existingDiscount.fabricId) {
    const fabricExists = await fabricRepository.findById(data.fabricId);
    if (!fabricExists) {
      throw new NotFoundError('Vải không tồn tại trong hệ thống');
    }
  }

  return await bannerDiscountRepository.updateById(id, data);
};

/** Xóa BannerDiscount theo ID */
export const deleteBannerDiscount = async (id) => {
  const existingDiscount = await bannerDiscountRepository.findById(id);
  if (!existingDiscount) {
    throw new NotFoundError('Banner discount không tồn tại trong hệ thống');
  }

  return await bannerDiscountRepository.deleteById(id);
};
