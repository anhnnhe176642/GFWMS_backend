import { GoogleGenerativeAI } from '@google/generative-ai';
import { BadRequestError } from '../utils/errors.js';

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new BadRequestError('GEMINI_API_KEY không được cấu hình trong .env');
  }
  return new GoogleGenerativeAI(apiKey);
};

/**
 * Gọi Gemini API với prompt đơn giản
 * @param {string} prompt - Prompt cần gửi tới Gemini
 * @param {string} model - Model sử dụng (mặc định: gemini-1.5-flash)
 * @param {number} temperature - Độ sáng tạo (0-2, mặc định: 0.7)
 * @param {number} maxTokens - Số token tối đa (mặc định: 2000)
 * @returns {Promise<{text: string, model: string, usage: object}>}
 */
export const sendPrompt = async (prompt, model = 'gemini-1.5-flash', temperature = 0.7, maxTokens = 2000) => {
  try {
    const client = getGeminiClient();
    const generativeModel = client.getGenerativeModel({ model });

    const response = await generativeModel.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens
      }
    });

    const text = response.response.text();
    const usageMetadata = response.response.usageMetadata || {};

    return {
      text,
      model,
      usage: {
        promptTokens: usageMetadata.promptTokenCount || 0,
        outputTokens: usageMetadata.candidatesTokenCount || 0,
        totalTokens: usageMetadata.totalTokenCount || 0
      }
    };
  } catch (error) {
    throw new BadRequestError(`Lỗi khi gọi Gemini API: ${error.message}`);
  }
};

/**
 * Gọi Gemini API với multi-turn conversation
 * @param {Array} messages - Mảng message với format {role: 'user'|'model', content: string}
 * @param {string} model - Model sử dụng
 * @param {number} temperature - Độ sáng tạo
 * @param {number} maxTokens - Số token tối đa
 * @returns {Promise<{text: string, model: string, usage: object, messages: Array}>}
 */
export const sendChatMessage = async (messages, model = 'gemini-1.5-flash', temperature = 0.7, maxTokens = 2000) => {
  try {
    const client = getGeminiClient();
    const generativeModel = client.getGenerativeModel({ model });

    // Chuyển đổi format message từ {role, content} sang {role, parts}
    const contents = messages.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.content }]
    }));

    const response = await generativeModel.generateContent({
      contents,
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens
      }
    });

    const text = response.response.text();
    const usageMetadata = response.response.usageMetadata || {};

    // Thêm response vào messages
    const updatedMessages = [
      ...messages,
      {
        role: 'model',
        content: text
      }
    ];

    return {
      text,
      model,
      messages: updatedMessages,
      usage: {
        promptTokens: usageMetadata.promptTokenCount || 0,
        outputTokens: usageMetadata.candidatesTokenCount || 0,
        totalTokens: usageMetadata.totalTokenCount || 0
      }
    };
  } catch (error) {
    throw new BadRequestError(`Lỗi khi gọi Gemini API: ${error.message}`);
  }
};

/**
 * Gọi Gemini API để phân tích hình ảnh
 * @param {string} imageUrl - URL của hình ảnh
 * @param {string} prompt - Prompt để phân tích hình ảnh
 * @param {string} model - Model sử dụng (mặc định: gemini-1.5-flash)
 * @returns {Promise<{text: string, model: string}>}
 */
export const analyzeImage = async (imageUrl, prompt, model = 'gemini-1.5-flash') => {
  try {
    const client = getGeminiClient();
    const generativeModel = client.getGenerativeModel({ model });

    const response = await generativeModel.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: await getImageData(imageUrl)
              }
            }
          ]
        }
      ]
    });

    const text = response.response.text();

    return {
      text,
      model
    };
  } catch (error) {
    throw new BadRequestError(`Lỗi khi phân tích hình ảnh: ${error.message}`);
  }
};

/**
 * Hàm trợ giúp để lấy dữ liệu hình ảnh từ URL
 */
const getImageData = async (url) => {
  // Nếu là base64, trả về trực tiếp
  if (url.startsWith('data:image')) {
    return url.split(',')[1];
  }

  // Nếu là URL, fetch và convert sang base64
  try {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    return Buffer.from(buffer).toString('base64');
  } catch (error) {
    throw new Error(`Không thể lấy dữ liệu hình ảnh từ URL: ${error.message}`);
  }
};
