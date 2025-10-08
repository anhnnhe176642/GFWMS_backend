import * as roleService from '../services/role.service.js';

export const getAllRoles = async (req, res, next) => {
  try {
    const roles = await roleService.getAllRoles();
    res.json({
      message: 'Lấy danh sách roles thành công',
      data: roles
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

export const updateRole = async (req, res, next) => {
  try {
    const { name } = req.params;
    const updateData = req.body;
    
    const role = await roleService.updateRole(name, updateData);
    res.json({
      message: 'Cập nhật role thành công',
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