import * as paymentRepository from '../repositories/payment.repository.js';
import payOSService from './payos.service.js';
import { PrismaClient } from '@prisma/client';
import { NotFoundError, BadRequestError } from '../utils/errors.js';
import QRCode from 'qrcode';

const prisma = new PrismaClient();

//TẠO QR CHO INVOICE THƯỜNG
export const createInvoicePaymentQR = async (invoiceId, userId, userRole) => {
  // Lấy invoice + order + user
  const invoice = await prisma.invoice.findUnique({
    where: { id: parseInt(invoiceId) },
    include: {
      order: {
        include: { user: true }
      },
      creditInvoice: true
    }
  });
  
  if (!invoice) throw new NotFoundError('Không tìm thấy hóa đơn');
  
  // Check quyền
  const isOwner = invoice.order.userId === userId;
  const isStaff = ['STAFF', 'ADMIN'].includes(userRole);
  if (!isOwner && !isStaff) {
    throw new BadRequestError('Bạn không có quyền thanh toán hóa đơn này');
  }
  
  // Validate trạng thái
  if (invoice.invoiceStatus === 'PAID') {
    throw new BadRequestError('Hóa đơn đã được thanh toán');
  }
  
  if (invoice.invoiceStatus === 'CANCELED') {
    throw new BadRequestError('Hóa đơn đã bị hủy');
  }
  
  if (invoice.paymentDeadline && new Date() > new Date(invoice.paymentDeadline)) {
    throw new BadRequestError('Hóa đơn đã quá hạn thanh toán');
  }
  
  // Tính số tiền cần thanh toán
  const amountToPay = invoice.totalAmount - invoice.creditAmount;
  if (amountToPay <= 0) {
    throw new BadRequestError('Hóa đơn không cần thanh toán');
  }
  
  // Check payment đã tồn tại
  const existingPayment = await paymentRepository.findByInvoiceId(invoice.id);
  if (existingPayment && existingPayment.status === 'PENDING') {
    let qrCodeBase64 = existingPayment.gatewayResponse?.qrCodeBase64;
    
    if (!qrCodeBase64 && existingPayment.gatewayResponse?.qrCodeUrl) {
      try {
        qrCodeBase64 = await QRCode.toDataURL(existingPayment.gatewayResponse.qrCodeUrl, {
          width: 300,
          margin: 1
        });
      } catch (error) {
        console.error('[Payment] Failed to generate QR base64:', error);
      }
    }
    return {
      paymentId: existingPayment. id,
      invoiceId: invoice.id,
      amount: existingPayment.amount,
      status: existingPayment.status,
      qrCodeUrl: existingPayment.gatewayResponse?.qrCodeUrl,
      qrCodeBase64,
      paymentUrl: existingPayment.gatewayResponse?.paymentUrl,
      message: 'QR code đã được tạo trước đó'
    };
  }
  
  // Tạo payment link với PayOS (dùng invoiceId làm orderCode)
  const paymentLink = await payOSService.createPaymentLink({
    orderCode: invoiceId,
    amount: amountToPay,
    description: `Thanh toán hóa đơn #${invoiceId} - GFWMS`
  });
  let qrCodeBase64 = null;

  try {
    qrCodeBase64 = await QRCode.toDataURL(paymentLink.qrCodeUrl, {
      width: 300,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
  } catch (error) {
    console.error('[Payment] Failed to generate QR code:', error);
  }
  
  // Lưu payment vào DB
  const payment = await paymentRepository.create({
    invoiceId: invoice.id,
    creditInvoiceId: invoice.creditInvoiceId || null,
    amount: amountToPay,
    paymentMethod: 'PAYOS_VIETQR',
    status: 'PENDING',
    transactionId: paymentLink.paymentLinkId,
    notes: `Thanh toán PayOS cho hóa đơn #${invoiceId}`,
    gatewayResponse: {
      paymentUrl: paymentLink.paymentUrl,
      qrCodeUrl: paymentLink.qrCodeUrl,
      qrCodeBase64,
      paymentLinkId: paymentLink.paymentLinkId,
      createdAt: new Date(),
      expiresAt: paymentLink.expiresAt
    }
  });
  
  return {
    paymentId: payment.id,
    invoiceId: invoice. id,
    paymentUrl: paymentLink.paymentUrl,
    qrCodeUrl: paymentLink.qrCodeUrl,
    qrCodeBase64,
    amount: amountToPay,
    currency: 'VND',
    expiresAt: paymentLink. expiresAt
  };
};



// TẠO QR CHO CREDIT INVOICE GOM THÁNG)
export const createCreditInvoicePaymentQR = async (creditInvoiceId, userId, userRole) => {
  
  try {
    // Lấy credit invoice
    const creditInvoice = await prisma.creditInvoice.findUnique({
      where: { id: parseInt(creditInvoiceId) },
      include: {
        credit: true,
        invoice: {
          include: {
            order: true
          }
        }
      }
    });
    
  
    
    if (!creditInvoice) throw new NotFoundError('Không tìm thấy Credit Invoice');
    
    // Check quyền
    const isOwner = creditInvoice.credit.userId === userId;
    const isStaff = ['STAFF', 'ADMIN'].includes(userRole);
    
    if (!isOwner && !isStaff) {
      throw new BadRequestError('Bạn không có quyền thanh toán Credit Invoice này');
    }
    
    // Validate trạng thái
    console. log('[3] Validating status...');
    if (creditInvoice.status === 'PAID') {
      throw new BadRequestError('Credit Invoice đã được thanh toán');
    }
    
    // ✅ BỎ PHẦN VALIDATE dueDate (vì không có field này)
    // if (creditInvoice.dueDate && new Date() > new Date(creditInvoice. dueDate)) {
    //   throw new BadRequestError('Credit Invoice đã quá hạn thanh toán');
    // }
    
    // Tính số tiền
    const amountToPay = creditInvoice. totalCreditAmount - creditInvoice.creditPaidAmount;
    
    if (amountToPay <= 0) {
      throw new BadRequestError('Credit Invoice không cần thanh toán');
    }
    
    // Lấy payment cũ
    const existingPayments = await prisma.payment. findMany({
      where: { 
        creditInvoiceId: creditInvoice.id
      },
      orderBy: { createdAt: 'desc' }
    });
    
    const existingPayment = existingPayments.find(p => p.invoiceId === null);
    
    // Cancel payment cũ nếu PENDING
    if (existingPayment && existingPayment.status === 'PENDING') {
      try {
        const oldOrderCode = existingPayment.gatewayResponse?.orderCode || (creditInvoiceId * 1000000);
        
        await payOSService.cancelPaymentLink(oldOrderCode);
        
        await prisma.payment.update({
          where: { id: existingPayment.id },
          data: { 
            status: 'EXPIRED',
            errorMessage: 'Cancelled to create new payment link'
          }
        });
        
        console. log('  - Old payment cancelled successfully');
      } catch (cancelError) {
        console.error('  - Failed to cancel:', cancelError. message);
      }
    }
    
    // Tạo orderCode
    const timestamp = Date.now();
    const orderCode = creditInvoiceId * 1000000 + (timestamp % 1000000);
    
    const paymentLink = await payOSService.createPaymentLink({
      orderCode,
      amount: amountToPay,
      description: `Thanh toán Credit Invoice #${creditInvoiceId} - ${creditInvoice.invoice.length} hóa đơn`
    });
    
    // Tạo QR code
    let qrCodeBase64 = null;
    try {
      qrCodeBase64 = await QRCode.toDataURL(paymentLink. qrCodeUrl, {
        width: 300,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    } catch (error) {
      console.error('  - QR code generation failed:', error.message);
    }
    
    // Lưu payment
    let payment;
    
    if (existingPayment) {
      payment = await prisma.payment.update({
        where: { id: existingPayment.id },
        data: {
          amount: amountToPay,
          status: 'PENDING',
          transactionId: paymentLink.paymentLinkId,
          notes: `Thanh toán Credit Invoice #${creditInvoiceId} (tạo lại)`,
          gatewayResponse: {
            paymentUrl: paymentLink.paymentUrl,
            qrCodeUrl: paymentLink.qrCodeUrl,
            qrCodeBase64,
            paymentLinkId: paymentLink.paymentLinkId,
            orderCode,
            createdAt: new Date(),
            expiresAt: paymentLink.expiresAt
          }
        }
      });
    } else {
      payment = await prisma.payment.create({
        data: {
          invoiceId: null,
          creditInvoiceId: creditInvoice.id,
          amount: amountToPay,
          paymentMethod: 'PAYOS_VIETQR',
          status: 'PENDING',
          transactionId: paymentLink.paymentLinkId,
          notes: `Thanh toán Credit Invoice #${creditInvoiceId}`,
          gatewayResponse: {
            paymentUrl: paymentLink.paymentUrl,
            qrCodeUrl: paymentLink.qrCodeUrl,
            qrCodeBase64,
            paymentLinkId: paymentLink.paymentLinkId,
            orderCode,
            createdAt: new Date(),
            expiresAt: paymentLink.expiresAt
          }
        }
      });
    }
    
    
    return {
      paymentId: payment.id,
      creditInvoiceId: creditInvoice.id,
      paymentUrl: paymentLink.paymentUrl,
      qrCodeUrl: paymentLink.qrCodeUrl,
      qrCodeBase64,
      amount: amountToPay,
      currency: 'VND',
      expiresAt: paymentLink. expiresAt,
      invoiceCount: creditInvoice.invoice. length
    };
    
  } catch (error) {
    console. error('=== ERROR in createCreditInvoicePaymentQR ===');
    throw error;
  }
};

/**
 * Xử lý webhook từ PayOS
 */
export const handlePayOSWebhook = async (webhookData) => {
  
  try {
    // Verify signature
    const isValid = payOSService.verifyWebhookSignature(webhookData);
    
    if (!isValid) {
      throw new BadRequestError('Không hợp lệ webhook signature');
    }
    
    // Parse data
    const { code, desc, data } = webhookData;
    
    if (!data) {
      throw new BadRequestError('Webhook data is missing');
    }
    
    const { orderCode, amount, paymentLinkId, reference } = data;
    const transactionId = paymentLinkId || reference;
  
    
    // Phân biệt Invoice hay Credit Invoice dựa vào orderCode
    const isCreditInvoice = orderCode >= 1000000; 
    
    if (isCreditInvoice) {
      const creditInvoiceId = Math.floor(orderCode / 1000000);
      const result = await handleCreditInvoiceWebhook(creditInvoiceId, transactionId, amount, code, desc, webhookData);
      return result;
    } else {
      const invoiceId = parseInt(orderCode);
      const result = await handleInvoiceWebhook(invoiceId, transactionId, amount, code, desc, webhookData);
      return result;
    }
  } catch (error) {
    console.error('[Webhook] ERROR:', {
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
};

// Xử lý webhook cho Invoice thường
const handleInvoiceWebhook = async (invoiceId, transactionId, amount, code, desc, webhookData) => {
  try {
    
    // Lấy invoice
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        order: {
          include: { user: true }
        },
        creditInvoice: true
      }
    });
    
    if (!invoice) {
      throw new NotFoundError('Không tìm thấy hóa đơn');
    }
    
    
    // Check idempotency
    const existingPayment = await paymentRepository.findByTransactionId(transactionId);
    
    if (existingPayment && existingPayment.status === 'SUCCESS') {
      return { success: true, message: 'Đã xử lý trước đó' };
    }
    
    // Validate amount
    const expectedAmount = invoice.totalAmount - invoice.creditAmount - invoice.paidAmount;
    
    if (Math.abs(amount - expectedAmount) > 1) {
      throw new BadRequestError('Số tiền thanh toán không hợp lệ');
    }
    
    // Xử lý theo status
    
    if (code === '00') {
      console.log('[Webhook] Processing SUCCESS payment.. .');
      await processInvoicePaymentSuccess(invoice, transactionId, amount, webhookData);
      return { success: true, message: 'Đã xử lý thanh toán Invoice thành công' };
    } else {
      await processPaymentFailed(invoice. id, null, transactionId, code, desc, webhookData);
      return { success: true, message: 'Xác nhận thanh toán thất bại' };
    }
  } catch (error) {
    console.error('[Webhook] handleInvoiceWebhook ERROR:', {
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
};


// Xử lý webhook cho Credit Invoice
const handleCreditInvoiceWebhook = async (creditInvoiceId, transactionId, amount, code, desc, webhookData) => {
  
  // Lấy credit invoice
  const creditInvoice = await prisma. creditInvoice.findUnique({
    where: { id: creditInvoiceId },
    include: {
      credit: true,
      invoice: {
        include: {
          order: true
        }
      }
    }
  });
  
  if (!creditInvoice) {
    throw new NotFoundError('Không tìm thấy Credit Invoice');
  }
  
  // ✅ Check idempotency bằng transactionId
  const existingPayment = await prisma.payment. findFirst({
    where: { 
      transactionId: transactionId,
      creditInvoiceId: creditInvoice. id
    }
  });
  
  
  if (existingPayment && existingPayment. status === 'SUCCESS') {
    return { success: true, message: 'Đã xử lý trước đó' };
  }
  
  if (existingPayment && existingPayment.processedViaWebhook) {
    return { success: true, message: 'Đã xử lý trước đó qua webhook' };
  }
  
  // Validate amount
  const expectedAmount = creditInvoice.totalCreditAmount - creditInvoice.creditPaidAmount;
  
  if (Math.abs(amount - expectedAmount) > 1) {
    throw new BadRequestError('Số tiền thanh toán không hợp lệ');
  }
  
  // Xử lý theo status
  if (code === '00') {
    await processCreditInvoicePaymentSuccess(creditInvoice, transactionId, amount, webhookData);
    return { success: true, message: 'Đã xử lý thanh toán Credit Invoice thành công' };
  } else {
    await processPaymentFailed(null, creditInvoice.id, transactionId, code, desc, webhookData);
    return { success: true, message: 'Xác nhận thanh toán thất bại' };
  }
};


//XỬ LÝ THANH TOÁN THÀNH CÔNG - INVOICE
const processInvoicePaymentSuccess = async (invoice, transactionId, amount, webhookData) => {
  
  try {
    await prisma.$transaction(async (tx) => {
      
      // 1. Upsert Payment
      const payment = await tx.payment.upsert({
        where: { transactionId },
        create: {
          invoiceId: invoice.id,
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
      console.log('[Webhook] Payment upserted:', payment.id);
      
      // 2.  Tính invoice status mới
      const hasCredit = invoice.paymentType === 'CREDIT' && invoice.creditAmount > 0;
      const newInvoiceStatus = hasCredit ? 'CREDIT' : 'PAID';
      
      
      // 3. Update Invoice
      const updatedInvoice = await tx.invoice.update({
        where: { id: invoice.id },
        data: {
    invoiceStatus: newInvoiceStatus,
    paidAmount: { increment: amount },
    notes: hasCredit
      ? `Đã thanh toán phần vượt: ${amount.toLocaleString('vi-VN')}đ.  Phần credit ${invoice. creditAmount.toLocaleString('vi-VN')}đ thanh toán cuối tháng.`
      : `Đã thanh toán: ${amount.toLocaleString('vi-VN')}đ.`
  }
      });
      console.log('[Webhook] Invoice updated:', {
        id: updatedInvoice.id,
        status: updatedInvoice.invoiceStatus,
        paidAmount: updatedInvoice.paidAmount
      });
      
      
      // 4. Update Order
      const updatedOrder = await tx.order.update({
        where: { id: invoice.orderId },
        data: {
          status: 'PROCESSING'
        }
      });
      console.log('[Webhook] Order updated:', {
        id: updatedOrder.id,
        status: updatedOrder.status
      });
      
      // 5. Nếu có credit → Trừ credit limit
      if (hasCredit) {
        
        await tx.creditRegistration. update({
          where: { userId: invoice.order.userId },
          data: {
            creditUsed: { increment: invoice.creditAmount }
          }
        });
      }
    });
    
  } catch (error) {
    console.error('[Webhook] processInvoicePaymentSuccess ERROR:', {
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
};


//XỬ LÝ THANH TOÁN THÀNH CÔNG - CREDIT INVOICE
const processCreditInvoicePaymentSuccess = async (creditInvoice, transactionId, amount, webhookData) => {
  await prisma.$transaction(async (tx) => {
    // 1. Upsert Payment
    await tx.payment. upsert({
      where: { transactionId },
      create: {
        creditInvoiceId: creditInvoice.id,
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
    
    // 2. Update Credit Invoice
    await tx.creditInvoice.update({
      where: { id: creditInvoice.id },
      data: {
        status: 'PAID',
        creditPaidAmount: creditInvoice. totalCreditAmount
      }
    });
    
    // 3. Update TẤT CẢ Invoices thuộc Credit Invoice
    const invoiceUpdates = creditInvoice.invoice.map(inv => 
      tx.invoice. update({
        where: { id: inv.id },
        data: {
          invoiceStatus: 'PAID',
          paidAmount: inv.totalAmount
        }
      })
    );
    await Promise.all(invoiceUpdates);
    
    // 4. Update TẤT CẢ Orders liên quan
    const orderIds = creditInvoice.invoice.map(inv => inv.orderId);
    await tx.order.updateMany({
      where: { id: { in: orderIds } },
      data: { status: 'PROCESSING' }
    });
    
    // 5. ✅ SỬA: Giảm creditUsed (không phải creditLimit)
    await tx.creditRegistration.update({
      where: { userId: creditInvoice.credit.userId },
      data: {
        creditUsed: { decrement: creditInvoice.totalCreditAmount }  // ✅ TRỪ creditUsed
      }
    });
  });
};



// XỬ LÝ THANH TOÁN THẤT BẠI
const processPaymentFailed = async (invoiceId, creditInvoiceId, transactionId, errorCode, errorMessage, webhookData) => {
  await prisma.$transaction(async (tx) => {
    const paymentData = {
      transactionId,
      status: 'FAILED',
      errorCode,
      errorMessage,
      gatewayResponse: webhookData,
      processedViaWebhook: true
    };
    
    if (invoiceId) {
      // 1. Update payment cho Invoice
      await tx.payment.upsert({
        where: { transactionId },
        create: {
          invoiceId,
          ...paymentData,
          amount: 0,
          paymentMethod: 'PAYOS_VIETQR'
        },
        update: paymentData
      });

      // 2. Lấy order để hoàn tồn kho
      const invoice = await tx.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          order: {
            include: {
              orderItems: {
                include: {
                  fabric: {
                    select: { id: true, length: true }
                  }
                }
              },
              store: true
            }
          }
        }
      });

      if (invoice?.order) {
        const order = invoice.order;
        const storeId = order.storeId;
        
        // 3. Hoàn tồn kho + totalValue
        for (const item of order.orderItems) {
          if (item.saleUnit === 'ROLL') {
            // Hoàn cuộn
            const metersToRestore = item.quantity * item.fabric.length;
            const valueToRestore = item.quantity * item.costPrice;

            await tx.fabricStore.update({
              where: {
                fabricId_storeId: {
                  fabricId: item.fabricId,
                  storeId
                }
              },
              data: {
                uncutRolls: { increment: item.quantity },
                totalMeters: { increment: metersToRestore },
                totalValue: { increment: valueToRestore }
              }
            });
          } else if (item.saleUnit === 'METER') {
            // Hoàn mét
            const valueToRestore = item.quantity * item.costPrice;
            
            const currentStore = await tx.fabricStore.findUnique({
              where: {
                fabricId_storeId: {
                  fabricId: item.fabricId,
                  storeId
                }
              }
            });

            if (currentStore) {
              const newCuttingMeters = currentStore.cuttingRollMeters + item.quantity;
              let newUncutRolls = currentStore.uncutRolls;
              let finalCuttingMeters = newCuttingMeters;

              if (newCuttingMeters >= item.fabric.length) {
                newUncutRolls = currentStore.uncutRolls + Math.floor(newCuttingMeters / item.fabric.length);
                finalCuttingMeters = newCuttingMeters % item.fabric.length;
              }

              await tx.fabricStore.update({
                where: {
                  fabricId_storeId: {
                    fabricId: item.fabricId,
                    storeId
                  }
                },
                data: {
                  totalMeters: { increment: item.quantity },
                  totalValue: { increment: valueToRestore },
                  uncutRolls: { increment: newUncutRolls - currentStore.uncutRolls },
                  cuttingRollMeters: finalCuttingMeters
                }
              });
            }
          }
        }
      }
    } else if (creditInvoiceId) {
      // Update payment cho Credit Invoice
      await tx.payment.upsert({
        where: { transactionId },
        create: {
          creditInvoiceId,
          ...paymentData,
          amount: 0,
          paymentMethod: 'PAYOS_VIETQR'
        },
        update: paymentData
      });
    }
  });
};


// CHECK PAYMENT STATUS

export const checkInvoicePaymentStatus = async (invoiceId) => {
  const payment = await paymentRepository.findByInvoiceId(invoiceId);
  
  if (!payment) {
    return {
      invoiceId,
      status: 'PENDING',
      message: 'Chưa có giao dịch thanh toán'
    };
  }
  
  // Query PayOS để check status mới nhất
  try {
    const paymentInfo = await payOSService.queryPaymentStatus(invoiceId);
    
    return {
      invoiceId,
      paymentId: payment.id,
      status: payment.status,
      amount: payment.amount,
      paymentDate: payment.paymentDate,
      payOSStatus: paymentInfo.status,
      transactionId: payment.transactionId
    };
  } catch (error) {
    return {
      invoiceId,
      paymentId: payment.id,
      status: payment.status,
      amount: payment.amount,
      paymentDate: payment.paymentDate,
      error
    };
  }
};

export const checkCreditInvoicePaymentStatus = async (creditInvoiceId) => {
  // 1. Lấy Credit Invoice
  const creditInvoice = await prisma. creditInvoice.findUnique({
    where: { id: parseInt(creditInvoiceId) },
    include: { 
      invoice: true
    }
  });
  
  if (!creditInvoice) {
    throw new NotFoundError('Không tìm thấy Credit Invoice');
  }
  
  // 2. ✅ Lấy TẤT CẢ payment của Credit Invoice (không filter invoiceId)
  const allPayments = await prisma.payment.findMany({
    where: { 
      creditInvoiceId: parseInt(creditInvoiceId)
    },
    orderBy: { createdAt: 'desc' }
  });
  
  // 3. ✅ Filter trong JavaScript (tìm payment có invoiceId = null)
  const creditPayment = allPayments.find(p => p.invoiceId === null);
  
  // 4. Nếu chưa có payment gom tháng
  if (! creditPayment) {
    return {
      creditInvoiceId: parseInt(creditInvoiceId),
      creditInvoiceStatus: creditInvoice.status,
      totalCreditAmount: creditInvoice.totalCreditAmount,
      creditPaidAmount: creditInvoice.creditPaidAmount,
      paymentStatus: 'NO_PAYMENT',
      message: 'Chưa có giao dịch thanh toán Credit Invoice',
      invoiceCount: creditInvoice.invoice.length
    };
  }
  
  // 5. Trả về thông tin payment
  return {
    creditInvoiceId: parseInt(creditInvoiceId),
    creditInvoiceStatus: creditInvoice.status,
    totalCreditAmount: creditInvoice.totalCreditAmount,
    creditPaidAmount: creditInvoice.creditPaidAmount,
    
    paymentId: creditPayment.id,
    paymentStatus: creditPayment.status,
    amount: creditPayment.amount,
    paymentDate: creditPayment.paymentDate,
    transactionId: creditPayment.transactionId,
    
    invoiceCount: creditInvoice.invoice.length
  };
};