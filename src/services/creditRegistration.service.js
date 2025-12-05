import { NotFoundError, BadRequestError } from '../utils/errors.js';
import { RegistrationStatus } from '@prisma/client';
import { creditRegistrationRepository } from '../repositories/creditRegistration.repository.js';
import { invoiceRepository } from '../repositories/invoice.repository.js';

export const createCreditRegistration = async (data) => {
  // Lấy đơn mới nhất của user (nếu có)
  const latest = await creditRegistrationRepository.findLatestByUserId(data.userId);

  if (latest) {
    if (latest.status === RegistrationStatus.PENDING) {
      throw new BadRequestError("Bạn đã gửi đơn và đang chờ duyệt.");
    }
    if (latest.status === RegistrationStatus.APPROVED) {
      throw new BadRequestError("Bạn đã được duyệt ghi nợ, không thể gửi lại.");
    }

  }

  return await creditRegistrationRepository.create({
    userId: data.userId,
    note: data.note,
    status: RegistrationStatus.PENDING
  });
};



export const getCreditRegistrationById = async (id) => {
  const record = await creditRegistrationRepository.findById(id);
  if (!record) throw new NotFoundError('Đơn đăng ký không tồn tại');
  return record;
};

export const getAllCreditRegistrations = async (queryOptions) => {
  return await creditRegistrationRepository.findWithAdvancedQuery(queryOptions);
};

export const updateCreditRegistrationStatus = async (id, data) => {
  const existing = await creditRegistrationRepository.findById(id);
  if (!existing) throw new NotFoundError('Đơn đăng ký không tồn tại');

  if (existing.status !== RegistrationStatus.PENDING) {
    throw new BadRequestError('Đơn đăng ký này đã được xử lý, không thể cập nhật');
  }

  const updateData = {
    status: data.status,
    approvalDate: new Date(),
    approvedBy: data.approvedBy
  };


  if (data.status === RegistrationStatus.APPROVED) {
    if (!data.creditLimit || data.creditLimit <= 0) {
      throw new BadRequestError('Hạn mức được nợ là bắt buộc và phải lớn hơn 0 khi duyệt đơn');
    }

    updateData.creditLimit = data.creditLimit;
  }

  return await creditRegistrationRepository.updateStatus(id, updateData);
};

export const getCreditSummary = async (userId) => {
  const invoices = await invoiceRepository.findByUserId(userId);

  if (!invoices.length) {
    return {
      totalOrders: 0,
      totalAmount: 0,
      averageOrderValue: 0,
      lastOrderDate: null,
      recommendedCreditLimit: 0
    };
  }


  const totalOrders = invoices.length;
  const totalAmount = invoices.reduce(
    (sum, inv) => sum + (inv.order?.totalAmount || 0),
    0
  );

  const averageOrderValue = totalAmount / totalOrders;
  const lastOrderDate = new Date(
    Math.max(...invoices.map(inv => new Date(inv.order?.orderDate).getTime()))
  );
  
  // Gợi ý hạn mức chỉ dựa trên tổng chi tiêu
  const recommendedCreditLimit = Math.round(totalAmount * 0.3); 
  return {
    totalOrders,
    totalAmount,
    averageOrderValue,
    lastOrderDate,
    recommendedCreditLimit
  };
};



