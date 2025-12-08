import express from 'express';
import { getWishlist, addToWishlist, removeFromWishlist } from '../../controllers/wishlist.controller.js';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validation.middleware.js';
import { addToWishlistSchema, wishlistQuerySchema } from '../../validations/wishlist.validation.js';

const router = express.Router();

router.use(authenticateToken);

/**
 * @swagger
 * /wishlist:
 *   get:
 *     summary: Lấy danh sách yêu thích của user
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 */
router.get('/',
  validate(wishlistQuerySchema, 'query'),
  getWishlist
);

/**
 * @swagger
 * /wishlist:
 *   post:
 *     summary: Thêm sản phẩm vào danh sách yêu thích
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 */
router.post('/',
  validate(addToWishlistSchema, 'body'),
  addToWishlist
);

/**
 * @swagger
 * /wishlist/{fabricId}:
 *   delete:
 *     summary: Xóa sản phẩm khỏi danh sách yêu thích
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:fabricId',
  removeFromWishlist
);

export default router;