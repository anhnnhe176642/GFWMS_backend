import * as supplierService from '../services/supplier.service.js';
import { buildQueryParams } from '../utils/filter-builder.js';

/** 🔹 Lấy danh sách Supplier (hỗ trợ filter, sort, pagination) */
export const getAllSuppliers = async (req, res, next) => {
  try {
    const queryParams = buildQueryParams(req.query, {
      filterFields: ['name', 'address', 'phone', 'isActive'],
      dateRangeConfig: {
        fromField: 'createdFrom',
        toField: 'createdTo',
        targetField: 'createdAt'
      }
    });

    const result = await supplierService.getAllSuppliersAdvanced(queryParams);

    res.json({
      message: 'Lấy danh sách supplier thành công',
      ...result
    });
  } catch (error) {
    next(error);
  }
};

/** 🔹 Lấy Supplier theo ID */
export const getSupplierById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const supplier = await supplierService.getSupplierById(id);

    if (!supplier) {
      return res.status(404).json({ message: 'Không tìm thấy supplier' });
    }

    res.json({
      message: 'Lấy thông tin supplier thành công',
      supplier
    });
  } catch (error) {
    next(error);
  }
};

/** 🔹 Tạo mới Supplier */
export const createSupplier = async (req, res, next) => {
  try {
    const supplierData = req.body;
    const newSupplier = await supplierService.createSupplier(supplierData);

    res.status(201).json({
      message: 'Tạo supplier thành công',
      supplier: newSupplier
    });
  } catch (error) {
    next(error);
  }
};

/** 🔹 Cập nhật Supplier */
export const updateSupplier = async (req, res, next) => {
  try {
    const { id } = req.params;
    const supplierData = req.body;

    const updatedSupplier = await supplierService.updateSupplier(id, supplierData);

    res.json({
      message: 'Cập nhật supplier thành công',
      supplier: updatedSupplier
    });
  } catch (error) {
    next(error);
  }
};


