import * as bannerDiscountService from '../services/bannerDiscount.service.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';

/** Lấy danh sách BannerDiscounts (có filter theo bannerId/fabricId, phân trang) */
export const getAllBannerDiscounts = async (req, res, next) => {
  try {
    const { bannerId, fabricId, page = 1, limit = 10 } = req.query;

    const result = await bannerDiscountService.getAllBannerDiscounts({
      bannerId: bannerId ? Number(bannerId) : undefined,
      fabricId: fabricId ? Number(fabricId) : undefined,
      page: Number(page),
      limit: Number(limit)
    });

    res.json({
      message: 'Lấy danh sách banner discount thành công',
      ...result
    });
  } catch (error) {
    next(error);
  }
};

/** Lấy BannerDiscount theo ID */
export const getBannerDiscountById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const discount = await bannerDiscountService.getBannerDiscountById(Number(id));

    if (!discount) {
      return res.status(404).json({ message: 'Không tìm thấy banner discount' });
    }

    res.json({
      message: 'Lấy thông tin banner discount thành công',
      data: discount
    });
  } catch (error) {
    next(error);
  }
};

/** Tạo BannerDiscount mới */
export const createBannerDiscount = async (req, res, next) => {
  try {
    const discount = await bannerDiscountService.createBannerDiscount(req.body);

    res.status(201).json({
      message: 'Tạo banner discount thành công',
      data: discount
    });
  } catch (error) {
    if (error instanceof ConflictError) {
      return res.status(409).json({ message: error.message });
    }
    next(error);
  }
};

/** Cập nhật BannerDiscount */
export const updateBannerDiscount = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updatedDiscount = await bannerDiscountService.updateBannerDiscount(Number(id), req.body);

    res.json({
      message: 'Cập nhật banner discount thành công',
      data: updatedDiscount
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return res.status(404).json({ message: error.message });
    }
    if (error instanceof ConflictError) {
      return res.status(409).json({ message: error.message });
    }
    next(error);
  }
};

/** Xóa BannerDiscount */
export const deleteBannerDiscount = async (req, res, next) => {
  try {
    const { id } = req.params;

    await bannerDiscountService.deleteBannerDiscount(Number(id));

    res.status(200).json({
      success: true,
      message: 'Xóa banner discount thành công'
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
};
