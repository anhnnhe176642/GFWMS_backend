import { fabricShelfService } from '../services/fabricShelf.service.js';

export const allocateFabricToShelves = async (req, res, next) => {
  try {
    const result = await fabricShelfService.assignFabricToShelves({
      ...req.params,
      ...req.body
    });

    res.status(200).json({
      message: 'Phân bổ vải vào kệ thành công',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Xem chi tiết vải trong kệ (bao gồm thông tin từng lần nhập)
 */
export const getFabricShelfDetail = async (req, res, next) => {
  try {
    const { shelfId, fabricId } = req.params;
    const result = await fabricShelfService.getFabricShelfDetail(
      parseInt(shelfId), 
      parseInt(fabricId)
    );

    res.status(200).json({
      message: 'Lấy chi tiết vải trong kệ thành công',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Lấy danh sách vải trên kệ (gom nhóm theo fabricId)
 */
export const getFabricsByShelf = async (req, res, next) => {
  try {
    const { shelfId } = req.params;
    const result = await fabricShelfService.getFabricsByShelfId(parseInt(shelfId));

    res.status(200).json({
      message: 'Lấy danh sách vải trên kệ thành công',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Lấy tập set các color của danh sách vải trong kệ cụ thể
 */
export const getColorsByShelf = async (req, res, next) => {
  try {
    const { shelfId } = req.params;
    const result = await fabricShelfService.getColorsByShelfId(parseInt(shelfId));

    res.status(200).json({
      message: 'Lấy danh sách màu sắc vải trên kệ thành công',
      data: result
    });
  } catch (error) {
    next(error);
  }
};