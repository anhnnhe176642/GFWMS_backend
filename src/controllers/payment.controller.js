import * as paymentService from '../services/payment.service.js';

// thanh toán invoice 
export const createInvoicePaymentQR = async (req, res, next) => {
  try {
    const { invoiceId } = req.params;
    
    const result = await paymentService.createInvoicePaymentQR(invoiceId);
    
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
    const result = await paymentService.handlePayOSWebhook(req.body);
    
    
    res.json(result);
  } catch (error) {
    console.error('[Controller] Webhook error:', {
      message: error.message,
      stack: error.stack
    });
    
    
    res.status(200).json({ 
      success: false, 
      error: error.message 
    });
  }
};

//kiem tra trạng thái thanh toán 
export const checkInvoicePaymentStatus = async (req, res, next) => {
  try {
    const { invoiceId } = req.params;
    const result = await paymentService.checkInvoicePaymentStatus(invoiceId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};


// thanh tóa đơn gom Credit Invoice
export const createCreditInvoicePaymentQR = async (req, res, next) => {
  try {
    const { creditInvoiceId } = req.params;
    
    const result = await paymentService.createCreditInvoicePaymentQR(creditInvoiceId);
    
    res.json({
      message: 'Tạo mã QR thanh toán Credit Invoice thành công',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

//Kiểm tra trạng thái thanh toán Credit Invoice
export const checkCreditInvoicePaymentStatus = async (req, res, next) => {
  try {
    const { creditInvoiceId } = req.params;
    const result = await paymentService.checkCreditInvoicePaymentStatus(creditInvoiceId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// Xác nhận thanh toán offline cho đơn hàng
export const confirmOfflinePayment = async (req, res, next) => {
  try {
    const { invoiceId } = req.params; 
    const result = await paymentService.confirmOfflinePayment(parseInt(invoiceId), req.body);
    
    res.json({
      message: result.message,
      data: result.order
    });
  } catch (error) {
    next(error);
  }
};