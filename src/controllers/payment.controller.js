import * as paymentService from '../services/payment.service.js';

export const createPaymentQRCode = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    const result = await paymentService.createPaymentQRCode(orderId, userId, userRole);
    
    res.json({
      message: 'Tạo mã QR thanh toán thành công',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const handlePayOSWebhook = async (req, res) => {
  try {
    const result = await paymentService.handlePayOSWebhook(req. body);
    res.json(result);
  } catch (error) { // tha nhưng thiếu tiền
    res.status(200).json({ success: false, error: error.message });
  }
};

export const checkPaymentStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const result = await paymentService.checkPaymentStatus(orderId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const retryPayment = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    const result = await paymentService.retryPayment(orderId, userId, userRole);
    
    res.json({
      message: 'Tạo lại mã QR thanh toán thành công',
      data: result
    });
  } catch (error) {
    next(error);
  }
};