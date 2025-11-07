import { NotFoundError } from '../utils/errors.js';
import { supplierRepository } from '../repositories/supplier.repository.js';
import { ConflictError } from '../utils/errors.js';
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

export const deleteSupplier = async (id) => {
  const existingSupplier = await supplierRepository.findById(id);
  if (!existingSupplier) {
    throw new NotFoundError('Nhà cung cấp không tồn tại');
  }

  const fabricCount = await supplierRepository.countFabricsWithSupplier(id);
  if (fabricCount > 0) {
    throw new ConflictError(`Không thể xóa nhà cung cấp vì có ${fabricCount} loại vải đang được tham chiếu`);
  }

  return await supplierRepository.deleteById(id);
};