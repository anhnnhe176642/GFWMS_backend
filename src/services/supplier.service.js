import { NotFoundError } from '../utils/errors.js';
import { supplierRepository } from '../repositories/supplier.repository.js';

/**  Lấy tất cả Supplier với phân trang cơ bản */
export const getAllSuppliers = async (page, limit) => {
  return await supplierRepository.findWithPagination(page, limit);
};

/**  Lấy tất cả Supplier với filter/search/sort/pagination nâng cao */
export const getAllSuppliersAdvanced = async (queryOptions) => {
  return await supplierRepository.findWithAdvancedQuery(queryOptions);
};

/**  Tạo mới Supplier */
export const createSupplier = async (data) => {
  return await supplierRepository.create(data);
};

/**  Lấy Supplier theo ID */
export const getSupplierById = async (id) => {
  const supplier = await supplierRepository.findById(id);

  if (!supplier) {
    throw new NotFoundError('Nhà cung cấp không tồn tại');
  }

  return supplier;
};

/**  Cập nhật Supplier */
export const updateSupplier = async (id, data) => {
  const existing = await supplierRepository.findById(id);
  if (!existing) {
    throw new NotFoundError('Nhà cung cấp không tồn tại');
  }

  return await supplierRepository.updateById(id, data);
};

export const deleteSupplier   = async (id) => {
  const existing = await supplierRepository.findById(id);
  if (!existing) {
    throw new NotFoundError('Nhà cung cấp cần xóa không tồn tại trong hệ thống');
  }

  return await supplierRepository.deleteById(id);
};