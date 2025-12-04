import * as paymentRepository from '../repositories/payment.repository.js';
import payOSService from './payos.service.js';
import { PrismaClient } from '@prisma/client';
import { NotFoundError, BadRequestError } from '../utils/errors.js';

const prisma = new PrismaClient();
/**
 * Tạo QR code thanh toán
 */
export const createPaymentQRCode = async (orderId, userId, userRole) => {
  // Lấy order + invoice
  const order = await prisma.order.findUnique({
    where: { id: parseInt(orderId) },
    include: { user: true, invoice: true, orderItems: true }
  });
  
  if (!order) throw new NotFoundError('Không tìm thấy đơn hàng');
  if (!order.invoice) throw new BadRequestError('Đơn hàng chưa có hóa đơn');
  
  // Check quyền
  const isOwner = order.userId === userId;
  const isStaff = ['STAFF', 'ADMIN'].includes(userRole);
  if (!isOwner && !isStaff) {
    throw new BadRequestError('Bạn không có quyền thanh toán đơn hàng này');
  }
  
  // Validate trạng thái
  if (order.status !== 'PENDING') {
    throw new BadRequestError('Chỉ có thể thanh toán cho đơn hàng PENDING');
  }
  
  if (order.paymentDeadline && new Date() > new Date(order.paymentDeadline)) {
    throw new BadRequestError('Đơn hàng đã quá hạn thanh toán');
  }
  
  // Tính số tiền
  const amountToPay = order.totalAmount - order.creditAmount - order.paidAmount;
  if (amountToPay <= 0) {
    throw new BadRequestError('Đơn hàng không cần thanh toán');
  }
  
  // Check payment đã tồn tại
  const existingPayment = await paymentRepository.findByInvoiceId(order.invoice. id);
  if (existingPayment && existingPayment.status === 'PENDING') {
    return {
      paymentId: existingPayment.id,
      orderId: order.id,
      invoiceId: order.invoice.id,
      amount: existingPayment.amount,
      status: existingPayment.status,
      message: 'QR code đã được tạo trước đó'
    };
  }
  
  // Tạo payment với PayOS
  const paymentLink = await payOSService.createPaymentLink({
    orderCode: orderId,
    amount: amountToPay,
    description: `Thanh toán đơn hàng #${orderId} - GFWMS`
  });
  
  // Lưu payment vào DB
  const payment = await paymentRepository.create({
    invoiceId: order.invoice.id,
    amount: amountToPay,
    paymentMethod: 'PAYOS_VIETQR',
    status: 'PENDING',
    transactionId: paymentLink. paymentLinkId,
    notes: `Thanh toán PayOS cho đơn hàng #${orderId}`,
    gatewayResponse: {
      paymentUrl: paymentLink.paymentUrl,
      qrCodeUrl: paymentLink.qrCodeUrl,
      paymentLinkId: paymentLink.paymentLinkId,
      createdAt: new Date(),
      expiresAt: paymentLink.expiresAt
    }
  });
  
  console.log('[Payment] QR created', { paymentId: payment.id, orderId, amount: amountToPay });
  
  return {
    paymentId: payment.id,
    orderId,
    invoiceId: order. invoice.id,
    paymentUrl: paymentLink.paymentUrl,
    qrCodeUrl: paymentLink.qrCodeUrl,
    qrCodeImage: paymentLink. qrCodeImage,
    amount: amountToPay,
    currency: 'VND',
    expiresAt: paymentLink.expiresAt,
    timeRemaining: 900
  };
};

/**
 * Xử lý webhook từ PayOS
 */
export const handlePayOSWebhook = async (webhookData) => {
  console.log('[Webhook] Received from PayOS');
  
  // Verify signature
  const isValid = payOSService.verifyWebhookSignature(webhookData);
  if (!isValid) {
    throw new BadRequestError('Không hợp lệ webhook signature');
  }
  
  // Parse data
  const { code, desc, data } = webhookData;
  const { orderCode, amount, paymentLinkId, reference } = data;
  const orderId = parseInt(orderCode);
  const transactionId = paymentLinkId || reference;
  
  // Lấy order
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true, invoice: true }
  });
  
  if (!order || ! order.invoice) {
    throw new NotFoundError('Không tìm thấy đơn hàng hoặc hóa đơn tương ứng');
  }
  
  // Check idempotency
  const existingPayment = await paymentRepository.findByTransactionId(transactionId);
  if (existingPayment && existingPayment.status === 'SUCCESS') {
    return { success: true, message: 'Đã xử lý trước đó' };
  }
  
  // Validate amount
  const expectedAmount = order.totalAmount - order.creditAmount - order.paidAmount;
  if (Math.abs(amount - expectedAmount) > 1) {
    throw new BadRequestError('Số tiền thanh toán không hợp lệ');
  }
  
  // Xử lý theo status
  if (code === '00') {
    await processSuccessfulPayment(order, transactionId, amount, webhookData);
    return { success: true, message: 'Đã xử lý thanh toán thành công' };
  } else {
    await processFailedPayment(order, transactionId, code, desc, webhookData);
    return { success: true, message: 'Xác nhận thanh toán thất bại' };
  }
};

/**
 * Xử lý thanh toán thành công
 */
const processSuccessfulPayment = async (order, transactionId, amount, webhookData) => {
  await prisma.$transaction(async (tx) => {
    // Upsert Payment
    await tx.payment.upsert({
      where: { transactionId },
      create: {
        invoiceId: order. invoice.id,
        transactionId,
        amount,
        paymentMethod: 'PAYOS_VIETQR',
        paymentDate: new Date(),
        status: 'SUCCESS',
        gatewayResponse: webhookData,
        processedViaWebhook: true
      },
      update: {
        status: 'SUCCESS',
        paymentDate: new Date(),
        gatewayResponse: webhookData,
        processedViaWebhook: true
      }
    });
    
    // Update Order
    await tx.order.update({
      where: { id: order.id },
      data: { status: 'PROCESSING', paidAmount: { increment: amount } }
    });
    
    // Update Invoice
    const invoiceStatus = order.creditAmount > 0 ? 'CREDIT' : 'PAID';
    await tx.invoice. update({
      where: { id: order.invoice.id },
      data: { invoiceStatus, paidAmount: { increment: amount } }
    });
    
    // Update Credit (nếu có)
    if (order.creditAmount > 0) {
      await tx.creditRegistration.update({
        where: { userId: order.userId },
        data: { creditLimit: { decrement: order.creditAmount } }
      });
    }
  });
  
  console.log('[Webhook] Transaction completed');
};

/**
 * Xử lý thanh toán thất bại
 */
const processFailedPayment = async (order, transactionId, errorCode, errorMessage, webhookData) => {
  await paymentRepository.updateByOrderId(order.id, {
    status: 'FAILED',
    transactionId,
    errorCode,
    errorMessage,
    gatewayResponse: webhookData,
    processedViaWebhook: true
  });
};

/**
 * Check payment status
 */
export const checkPaymentStatus = async (orderId) => {
  const payment = await paymentRepository.findByOrderId(orderId);
  const order = await prisma.order. findUnique({ where: { id: parseInt(orderId) } });
  
  return {
    orderId: parseInt(orderId),
    paymentStatus: payment?.status || 'NOT_FOUND',
    orderStatus: order?.status || 'NOT_FOUND',
    transactionId: payment?.transactionId,
    amount: payment ?  parseFloat(payment.amount) : null,
    paidAt: payment?. updatedAt
  };
};

/**
 * Retry payment
 */
export const retryPayment = async (orderId, userId, userRole) => {
  // Expire old payment
  const oldPayment = await paymentRepository. findByOrderId(orderId);
  if (oldPayment && oldPayment.status === 'PENDING') {
    await paymentRepository.updateById(oldPayment.id, {
      status: 'EXPIRED',
      errorMessage: 'Retrying with new QR code'
    });
  }
  
  return await createPaymentQRCode(orderId, userId, userRole);
};