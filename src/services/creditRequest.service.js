import { NotFoundError, BadRequestError } from '../utils/errors.js';
import { creditRequestRepository } from '../repositories/creditRequest.repository.js';
import { creditRegistrationRepository } from '../repositories/creditRegistration.repository.js';
import { RequestStatus } from '@prisma/client';

//
//  Tạo yêu cầu mới (initial hoặc tăng hạn mức)
//
export const createCreditRequest = async (data) => {
  const { userId, requestLimit, note } = data;

  if (requestLimit <= 0) {
    throw new BadRequestError('Hạn mức yêu cầu phải lớn hơn 0');
  }

  const existingRegistration = await creditRegistrationRepository.findByUserId(userId);
  const isIncrease = !!existingRegistration;

  if (isIncrease && requestLimit <= existingRegistration.creditLimit) {
    throw new BadRequestError(
      `Hạn mức mới phải lớn hơn hạn mức hiện tại (${existingRegistration.creditLimit})`
    );
  }

  return await creditRequestRepository.create({
    userId,
    requestLimit,
    note,
    status: RequestStatus.PENDING,
    type: isIncrease ? 'INCREASE' : 'INITIAL'
  });
};

//
//  Lấy danh sách yêu cầu (admin hoặc user)
//
export const getAllCreditRequests = async (queryOptions) => {
  return await creditRequestRepository.findWithAdvancedQuery(queryOptions);
};

//
// Lấy chi tiết 1 yêu cầu
//
export const getCreditRequestById = async (id) => {
  const request = await creditRequestRepository.findById(id);

  if (!request) {
    throw new NotFoundError('Yêu cầu không tồn tại');
  }

  return request;
};

//
// === Approve Initial Request (lần đầu) ===
//
export const approveInitialRequest = async (id, data) => {
  const { approvedLimit, note, adminId } = data;

  const request = await creditRequestRepository.findById(id);
  if (!request) throw new NotFoundError('Yêu cầu không tồn tại');
  if (request.status !== RequestStatus.PENDING)
    throw new BadRequestError('Yêu cầu đã được xử lý trước đó');

  if (request.type !== 'INITIAL') {
    throw new BadRequestError('Đây không phải đơn đăng ký nợ lần đầu');
  }

  // Tạo CreditRegistration hoặc chỉnh lại limit
  await creditRegistrationRepository.create({
    userId: request.userId,
    creditLimit: approvedLimit ?? request.requestLimit,
    creditUsed: 0,
    approvedBy: adminId,
    approvalDate: new Date(),
    status: 'APPROVED',
    note
  });

  return await creditRequestRepository.update(id, {
    status: RequestStatus.APPROVED,
    note,
    updatedAt: new Date()
  });
};

//
// === Approve Increase Request ===
//
export const approveIncreaseRequest = async (id, data) => {
  const { adminId, note } = data;

  const request = await creditRequestRepository.findById(id);
  if (!request) throw new NotFoundError('Yêu cầu không tồn tại');
  if (request.status !== RequestStatus.PENDING)
    throw new BadRequestError('Yêu cầu đã được xử lý trước đó');

  if (request.type !== 'INCREASE') {
    throw new BadRequestError('Đây không phải đơn tăng hạn mức');
  }

  const registration = await creditRegistrationRepository.findByUserId(request.userId);
  if (!registration) throw new BadRequestError('Không tìm thấy CreditRegistration');

  // Chỉ cập nhật creditLimit theo requestLimit
  await creditRegistrationRepository.updateByUserId(request.userId, {
    creditLimit: request.requestLimit,
    approvedBy: adminId,
    approvalDate: new Date(),
    status: 'APPROVED',
    note
  });

  return await creditRequestRepository.update(id, {
    status: RequestStatus.APPROVED,
    note,
    updatedAt: new Date()
  });
};

//
// === Reject Request (Initial hoặc Increase) ===
//
export const rejectRequest = async (id, data) => {
  const { rejectReason } = data;

  const request = await creditRequestRepository.findById(id);
  if (!request) throw new NotFoundError('Yêu cầu không tồn tại');
  if (request.status !== RequestStatus.PENDING)
    throw new BadRequestError('Yêu cầu đã được xử lý trước đó');

  // Chỉ cần cập nhật trạng thái PENDING -> REJECTED
  return await creditRequestRepository.update(id, {
    status: RequestStatus.REJECTED,
    note: rejectReason,
    updatedAt: new Date()
  });
};
