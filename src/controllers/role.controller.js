import * as roleService from '../services/role.service.js';
import { buildQueryParams } from '../utils/filter-builder.js';

export const getAllRoles = async (req, res, next) => {
  try {
    const queryParams = buildQueryParams(req.query);
    const result = await roleService.getAllRolesAdvanced(queryParams);
    
    res.json({
      message: 'Lấy danh sách roles thành công',
      ...result
    });
  } catch (error) {
    next(error);
  }
};

export const createRole = async (req, res, next) => {
  try {
    const roleData = req.body;
    const role = await roleService.createRole(roleData);
    
    res.status(201).json({
      message: 'Tạo role thành công',
      data: role
    });
  } catch (error) {
    next(error);
  }
};

export const getRoleByName = async (req, res, next) => {
  try {
    const { name } = req.params;
    const role = await roleService.getRoleByName(name);
    
    res.json({
      message: 'Lấy thông tin role thành công',
      data: role
    });
  } catch (error) {
    next(error);
  }
};

export const deleteRole = async (req, res, next) => {
  try {
    const { name } = req.params;
    await roleService.deleteRole(name);
    
    res.json({
      message: 'Xóa role thành công'
    });
  } catch (error) {
    next(error);
  }
};