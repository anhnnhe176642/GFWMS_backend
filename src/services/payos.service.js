import PayOS from '@payos/node';
import QRCode from 'qrcode';
import { AppError } from '../utils/errors.js';

class PayOSService {
  constructor() {
    this.validateConfig();
    
    this.client = new PayOS(
      process.env.PAYOS_CLIENT_ID,
      process.env.PAYOS_API_KEY,
      process.env.PAYOS_CHECKSUM_KEY
    );
    
    this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  }

  validateConfig() {
    const required = ['PAYOS_CLIENT_ID', 'PAYOS_API_KEY', 'PAYOS_CHECKSUM_KEY'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing PayOS config: ${missing.join(', ')}`);
    }
  }

  /**
   * Tạo payment link và QR code
   */
  async createPaymentLink({ orderCode, amount,}) {
    try {
      if (!orderCode || !amount || amount <= 0) {
        throw new AppError('Invalid payment parameters', 400);
      }

      const paymentData = {
        orderCode,
        amount: Math.round(amount),
        description: `DH${orderCode}`,  
        returnUrl: `${this.frontendUrl}/orders/${orderCode}/payment-success`,
        cancelUrl: `${this.frontendUrl}/orders/${orderCode}/payment-cancel`
      };

      const paymentLink = await this.client. createPaymentLink(paymentData);
      const qrCodeImage = await this.generateQRCode(paymentLink. checkoutUrl);

      return {
        paymentLinkId: paymentLink.paymentLinkId,
        paymentUrl: paymentLink.checkoutUrl,
        qrCodeUrl: paymentLink.qrCode,
        qrCodeImage,
        amount,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000)
      };
    } catch (error) {
      throw new AppError(`PayOS Error: ${error.message}`, error.statusCode || 500);
    }
  }

  /**
   * Generate QR code base64
   */
  async generateQRCode(url) {
    try {
      return await QRCode.toDataURL(url, {
        width: 400,
        margin: 2,
        color: { dark: '#0066CC', light: '#FFFFFF' }
      });
    } catch (error) {
      console.error('[PayOS] QR generation failed:', error)
      return null;
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(webhookData) {
    try {
      return this.client.verifyPaymentWebhookData(webhookData);
    } catch (error) {
      console.error('[PayOS] Webhook verification failed:', error);
      return false;
    }
  }

  /**
   * Query payment status từ PayOS
   */
  async queryPaymentStatus(orderCode) {
    try {
      const paymentInfo = await this.client.getPaymentLinkInformation(orderCode);
      return paymentInfo;
    } catch (error) {
      if (error.response?.status === 404) {
        return { orderCode, status: 'NOT_FOUND' };
      }
      throw new AppError(`PayOS Query Error: ${error.message}`, 500);
    }
  }

  /**
   * Cancel payment link
   */
  async cancelPaymentLink(orderCode, reason = 'Order cancelled') {
    try {
      const result = await this.client.cancelPaymentLink(orderCode, reason);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export default new PayOSService();