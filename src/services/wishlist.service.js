import { NotFoundError } from '../utils/errors.js';
import { wishlistRepository } from '../repositories/wishlist.repository.js';
import { fabricRepository } from '../repositories/fabric.repository.js';

export const getWishlist = async (userId, queryOptions) => {
  return await wishlistRepository.findByUser(userId, queryOptions);
};

export const addToWishlist = async (userId, fabricId) => {
  // Kiểm tra fabric có tồn tại không
  const fabric = await fabricRepository.findById(fabricId);
  if (!fabric) {
    throw new NotFoundError('Sản phẩm không tồn tại');
  }

  return await wishlistRepository.addItem(userId, fabricId);
};

export const removeFromWishlist = async (userId, fabricId) => {
  const exists = await wishlistRepository.checkExists(userId, fabricId);
  if (!exists) {
    throw new NotFoundError('Sản phẩm không có trong danh sách yêu thích');
  }

  await wishlistRepository.removeItem(userId, fabricId);
  return { success: true };
};