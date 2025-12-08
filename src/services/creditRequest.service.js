import { NotFoundError, BadRequestError } from '../utils/errors.js';
import { creditRequestRepository } from '../repositories/creditRequest.repository.js';
import { creditRegistrationRepository } from '../repositories/creditRegistration.repository.js';
import { RequestStatus } from '@prisma/client';

export const createInitialCreditRequest = async (data) => {
  const { userId, requestLimit, note } = data;

  if (requestLimit <= 0) {
    throw new BadRequestError('Hạn mức yêu cầu phải lớn hơn 0');
  }

  const existingRegistration = await creditRegistrationRepository.findByUserId(userId);

  if (existingRegistration) {
    // Nếu đã bị khóa thì không cho làm gì nữa
    if (existingRegistration.isLocked) {
      throw new BadRequestError('Tài khoản tín dụng đã bị khóa. Không thể tạo yêu cầu mới.');
    }

    throw new BadRequestError(
      'Bạn đã đăng ký hạn mức. Vui lòng kiểm tra lịch sử đăng ký'
    );
  }

  return await creditRequestRepository.create({
    userId,
    requestLimit,
    note,
    status: RequestStatus.PENDING,
    type: 'INITIAL'
  });
};


export const createIncreaseCreditRequest = async (data) => {
  const { userId, requestLimit, note } = data;

  if (requestLimit <= 0) {
    throw new BadRequestError('Hạn mức yêu cầu phải lớn hơn 0');
  }

  const existingRegistration = await creditRegistrationRepository.findByUserId(userId);

  if (!existingRegistration) {
    throw new BadRequestError(
      'Bạn chưa đăng ký hạn mức. Vui lòng đăng ký trước khi tăng'
    );
  }

  // KHÔNG CHO TẠO ĐƠN NẾU TÍN DỤNG BỊ KHÓA
  if (existingRegistration.isLocked) {
    throw new BadRequestError('Tài khoản tín dụng đã bị khóa. Không thể tạo yêu cầu tăng hạn mức.');
  }

  // Kiểm tra tăng hạn mức mới > hạn mức hiện tại
  if (requestLimit <= existingRegistration.creditLimit) {
    throw new BadRequestError(
      `Hạn mức mới phải lớn hơn hạn mức hiện tại (${existingRegistration.creditLimit})`
    );
  }

  return await creditRequestRepository.create({
    userId,
    requestLimit,
    note,
    status: RequestStatus.PENDING,
    type: 'INCREASE'
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
    throw new NotFoundError('Đơn đăng ký không tồn tại');
  }

  return request;
};

export const approveCreditRequest = async (id, data) => {
  const { status, requestLimit, note, adminId } = data;

  const existing = await creditRequestRepository.findById(id);
  if (!existing) throw new NotFoundError('Đơn đăng ký không tồn tại');
  if (existing.status !== RequestStatus.PENDING) throw new BadRequestError('Đơn đã được xử lý');

  if (status === RequestStatus.APPROVED) {
    let registration = await creditRegistrationRepository.findByUserId(existing.userId);

    // Nếu là đơn đăng ký lần đầu
    if (!registration) {
      registration = await creditRegistrationRepository.create({
        userId: existing.userId,
        creditLimit: requestLimit ?? existing.requestLimit,
        creditUsed: 0,
        approvedBy: adminId,
        approvalDate: new Date(),
        status: 'APPROVED',
        note
      });
    } else {
      // Đơn tăng hạn mức hoặc chỉnh lần đầu
      await creditRegistrationRepository.updateByUserId(existing.userId, {
        creditLimit: requestLimit ?? existing.requestLimit,
        approvedBy: adminId,
        approvalDate: new Date(),
        status: 'APPROVED',
        note
      });
    }

    return await creditRequestRepository.update(id, {
      status,
      note,
      requestLimit: requestLimit ?? existing.requestLimit,
      updatedAt: new Date()
    });
  }

  throw new BadRequestError('Trạng thái không hợp lệ');
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
