import * as bannerService from '../services/banner.service.js';
import { buildQueryParams } from '../utils/filter-builder.js';

/** Lấy danh sách Banner với filter, sort, pagination */
export const getAllBanners = async (req, res, next) => {
  try {
    const queryParams = buildQueryParams(req.query, {
      filterFields: ['title', 'isActive'], // filter theo title hoặc trạng thái
      dateRangeConfig: {
        fromField: 'startDateFrom',
        toField: 'startDateTo',
        targetField: 'startDate'
      }
    });

    const result = await bannerService.getAllBannersAdvanced(queryParams);

    res.json({
      message: 'Lấy danh sách banner thành công',
      ...result
    });
  } catch (error) {
    next(error);
  }
};

/** Lấy Banner theo ID */
export const getBannerById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const banner = await bannerService.getBannerById(id);

    if (!banner) {
      return res.status(404).json({ message: 'Banner không tồn tại' });
    }

    res.json({
      message: 'Lấy thông tin banner thành công',
      data: banner
    });
  } catch (error) {
    next(error);
  }
};

/** Tạo Banner mới */
export const createBanner = async (req, res, next) => {
  try {
    const banner = await bannerService.createBanner(req.body);

    res.status(201).json({
      message: 'Tạo banner thành công',
      data: banner
    });
  } catch (error) {
    next(error);
  }
};

/** Cập nhật Banner */
export const updateBanner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updatedBanner = await bannerService.updateBanner(id, req.body);

    res.json({
      message: 'Cập nhật banner thành công',
      data: updatedBanner
    });
  } catch (error) {
    next(error);
  }
};

/** Xóa Banner */
export const deleteBanner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await bannerService.deleteBanner(id);

    res.status(200).json({
      success: true,
      message: 'Xóa banner thành công',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**  Upload hoặc cập nhật ảnh Banner */
export const uploadBannerImage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const imageFile = req.file;

    const data = await bannerService.uploadBannerImage(id, imageFile);

    res.json({
      message: 'Cập nhật ảnh banner thành công',
      data
    });
  } catch (error) {
    next(error);
  }
};
