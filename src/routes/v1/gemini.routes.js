import express from 'express';
import { prompt, chat, analyzeImage } from '../../controllers/gemini.controller.js';
import { validate } from '../../middlewares/validation.middleware.js';
import { geminiPromptSchema, geminiChatSchema } from '../../validations/gemini.validation.js';

const router = express.Router();

/**
 * @swagger
 * /gemini/prompt:
 *   post:
 *     summary: Gửi prompt tới Gemini API
 *     tags: [Gemini]
 *     description: Gửi một prompt đơn giản tới Google Gemini AI để nhận phản hồi
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prompt
 *             properties:
 *               prompt:
 *                 type: string
 *                 description: Câu hỏi hoặc yêu cầu gửi tới Gemini
 *                 example: "Hãy giải thích Machine Learning là gì?"
 *               model:
 *                 type: string
 *                 description: Model AI sử dụng
 *                 enum: [gemini-2.5-flash, gemini-2.5-pro, gemini-pro]
 *                 default: gemini-2.5-flash
 *               temperature:
 *                 type: number
 *                 description: Độ sáng tạo (0 = xác định, 2 = ngẫu nhiên cao)
 *                 minimum: 0
 *                 maximum: 2
 *                 default: 0.7
 *               maxTokens:
 *                 type: integer
 *                 description: Độ dài tối đa của response (token)
 *                 minimum: 1
 *                 maximum: 32768
 *                 default: 2000
 *     responses:
 *       200:
 *         description: Phản hồi thành công từ Gemini
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Gọi Gemini thành công"
 *                 data:
 *                   type: object
 *                   properties:
 *                     text:
 *                       type: string
 *                       description: Phản hồi từ Gemini
 *                     model:
 *                       type: string
 *                       description: Model được sử dụng
 *                     usage:
 *                       type: object
 *                       properties:
 *                         promptTokens:
 *                           type: integer
 *                         outputTokens:
 *                           type: integer
 *                         totalTokens:
 *                           type: integer
 *       400:
 *         description: Lỗi validation hoặc API
 *       500:
 *         description: Lỗi server
 */
router.post('/prompt', validate(geminiPromptSchema), prompt);

/**
 * @swagger
 * /gemini/chat:
 *   post:
 *     summary: Chat multi-turn với Gemini
 *     tags: [Gemini]
 *     description: Gửi một cuộc hội thoại (multi-turn) tới Gemini để giữ context qua nhiều lần gửi
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - messages
 *             properties:
 *               messages:
 *                 type: array
 *                 description: Lịch sử hội thoại
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - role
 *                     - content
 *                   properties:
 *                     role:
 *                       type: string
 *                       enum: [user, model]
 *                       description: Người nói (user hoặc model)
 *                     content:
 *                       type: string
 *                       description: Nội dung message
 *                       example: "Xin chào"
 *               model:
 *                 type: string
 *                 enum: [gemini-2.5-flash, gemini-2.5-pro, gemini-pro]
 *                 default: gemini-2.5-flash
 *               temperature:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 2
 *                 default: 0.7
 *               maxTokens:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 32768
 *                 default: 2000
 *     responses:
 *       200:
 *         description: Phản hồi thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Chat với Gemini thành công"
 *                 data:
 *                   type: object
 *                   properties:
 *                     text:
 *                       type: string
 *                     model:
 *                       type: string
 *                     messages:
 *                       type: array
 *                       description: Lịch sử hội thoại bao gồm response mới
 *                     usage:
 *                       type: object
 */
router.post('/chat', validate(geminiChatSchema), chat);

/**
 * @swagger
 * /gemini/analyze-image:
 *   post:
 *     summary: Phân tích hình ảnh bằng Gemini
 *     tags: [Gemini]
 *     description: Gửi hình ảnh và prompt tới Gemini để phân tích nội dung
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - imageUrl
 *               - prompt
 *             properties:
 *               imageUrl:
 *                 type: string
 *                 description: URL hoặc base64 của hình ảnh
 *                 example: "https://example.com/image.jpg"
 *               prompt:
 *                 type: string
 *                 description: Câu hỏi về hình ảnh
 *                 example: "Mô tả chi tiết những gì bạn thấy trong hình ảnh"
 *               model:
 *                 type: string
 *                 enum: [gemini-2.5-flash, gemini-2.5-pro, gemini-pro]
 *                 default: gemini-2.5-flash
 *     responses:
 *       200:
 *         description: Phân tích thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     text:
 *                       type: string
 *                       description: Kết quả phân tích
 *                     model:
 *                       type: string
 */
router.post('/analyze-image', analyzeImage);

export default router;
