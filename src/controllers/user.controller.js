import * as userService from '../services/user.service.js';
import { buildQueryParams } from '../utils/filter-builder.js';

export const getAllUsers = async (req, res, next) => {
  try {
    const queryParams = buildQueryParams(req.query, {
      filterFields: ['status', 'role', 'gender'],
      dateRangeConfig: {
        fromField: 'createdFrom',
        toField: 'createdTo',
        targetField: 'createdAt'
      }
    });

    const result = await userService.getAllUsersAdvanced(queryParams);
    
    res.json({
      message: 'Lấy danh sách users thành công',
      ...result
    });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const userData = req.body;
    
    const user = await userService.createUser(userData);
    res.status(201).json({
      message: 'Tạo user thành công',
      user
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await userService.getUserById(id);
    
    res.json({
      message: 'Lấy thông tin user thành công',
      user
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const user = await userService.updateUser(id, { status });
    res.json({
      message: 'Cập nhật trạng thái user thành công',
      user
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    const user = await userService.updateUser(id, { role });
    res.json({
      message: 'Cập nhật role user thành công',
      user
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deletedUser = await userService.deleteUser(id);
    
    res.json({
      message: 'Xóa user thành công (soft delete)',
      user: deletedUser
    });
  } catch (error) {
    next(error);
  }
};
