import yoloService from '../services/yolo.service.js';
import { AppError } from '../utils/errors.js';
import {
  nearestNeighborSortFromItems,
} from '../utils/sorting.utils.js';

/**
 * Phát hiện các đối tượng trong ảnh tải lên
 * @route POST /api/yolo/detect
 * @access Public
 */
export const detectObjects = async (req, res, next) => {
  try {
    // Kiểm tra file ảnh được tải lên
    if (!req.file) {
      throw new AppError('Không tìm thấy file ảnh. Vui lòng tải lên một ảnh.', 400);
    }

    // Lấy độ tin cậy từ request
    const confidence = req.body.confidence;
    // Chạy phát hiện từ buffer ảnh
    const result = await yoloService.detectFromBuffer(
      req.file.buffer,
      req.file.originalname,
      { confidence }
    );

    // Sắp xếp các detection theo hàng dựa vào kích thước detection
    let sortedDetections = result.detections;
    if (sortedDetections && sortedDetections.length > 0) {
      // Dùng helper để sắp xếp và gắn trực tiếp row/rowline vào các detection
      sortedDetections = nearestNeighborSortFromItems(sortedDetections, 0.5);
    }

    // Định dạng response
    const response = {
      success: true,
      message: 'Phát hiện đối tượng hoàn tất thành công',
      data: {
        summary: {
          total_objects: result.total_objects,
          counts_by_class: result.counts_by_class
        },
        detections: sortedDetections,
        image_info: result.image_info,
        model_info: result.model_info
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Lấy thông tin mô hình YOLO
 * @route GET /api/yolo/model-info
 * @access Public
 */
export const getModelInfo = async (req, res, next) => {
  try {
    const modelInfo = await yoloService.getModelInfo();
    
    res.json({
      success: true,
      data: modelInfo
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Kiểm tra sức khỏe của dịch vụ YOLO
 * @route GET /api/yolo/health
 * @access Public
 */
export const healthCheck = async (req, res, next) => {
  try {
    const modelExists = await yoloService.verifyModelExists();
    
    res.json({
      success: true,
      status: 'healthy',
      model_available: modelExists,
      message: modelExists 
        ? 'Dịch vụ YOLO sẵn sàng' 
        : 'Dịch vụ YOLO đang chạy nhưng không tìm thấy file mô hình. Vui lòng thêm file .pt vào src/python/models/best.pt'
    });
  } catch (error) {
    next(error);
  }
};
