import * as geminiService from '../services/gemini.service.js';

/**
 * Gửi prompt đơn giản tới Gemini
 * POST /api/v1/gemini/prompt
 */
export const prompt = async (req, res, next) => {
  try {
    const { prompt, model, temperature, maxTokens } = req.body;
    const result = await geminiService.sendPrompt(prompt, model, temperature, maxTokens);
    res.json({
      message: 'Gọi Gemini thành công',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Gửi chat message tới Gemini
 * POST /api/v1/gemini/chat
 */
export const chat = async (req, res, next) => {
  try {
    const { messages, model, temperature, maxTokens } = req.body;
    const result = await geminiService.sendChatMessage(messages, model, temperature, maxTokens);
    res.json({
      message: 'Chat với Gemini thành công',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Phân tích hình ảnh bằng Gemini
 * POST /api/v1/gemini/analyze-image
 */
export const analyzeImage = async (req, res, next) => {
  try {
    const { imageUrl, prompt, model } = req.body;
    const result = await geminiService.analyzeImage(imageUrl, prompt, model);
    res.json({
      message: 'Phân tích hình ảnh thành công',
      data: result
    });
  } catch (error) {
    next(error);
  }
};
