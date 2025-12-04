import * as wishlistService from '../services/wishlist.service.js';

export const getWishlist = async (req, res, next) => {
  try {
    const result = await wishlistService.getWishlist(req.user.id, req.query);
    
    res.json({
      message: 'Lấy danh sách yêu thích thành công',
      ...result
    });
  } catch (error) {
    next(error);
  }
};

export const addToWishlist = async (req, res, next) => {
  try {
    const { fabricId } = req.body;
    const result = await wishlistService.addToWishlist(req.user.id, fabricId);
    
    res.status(201).json({
      message: 'Thêm vào danh sách yêu thích thành công',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const removeFromWishlist = async (req, res, next) => {
  try {
    const { fabricId } = req.params;
    await wishlistService.removeFromWishlist(req.user.id, parseInt(fabricId));
    
    res.json({
      message: 'Xóa khỏi danh sách yêu thích thành công'
    });
  } catch (error) {
    next(error);
  }
};