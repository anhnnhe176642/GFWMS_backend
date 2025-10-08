import * as authService from '../services/auth.service.js';

export const register = async (req, res, next) => {
  try {
    const userData = req.body;
    const result = await authService.registerUser(userData);
    res.status(201).json({
      message: 'Đăng ký thành công',
      user: result.user,
      token: result.token
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { usernameOrEmail, password } = req.body;
    const result = await authService.loginUser(usernameOrEmail, password);
    res.json({
      message: 'Đăng nhập thành công',
      user: result.user,
      token: result.token
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const user = await authService.getUserProfile(req.user.id);
    res.json({
      message: 'Lấy thông tin profile thành công',
      user
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { updateData } = req.body;
    const user = await authService.updateUserProfile(req.user.id, updateData);
    res.json({
      message: 'Cập nhật profile thành công',
      user
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    await authService.changeUserPassword(req.user.id, currentPassword, newPassword);
    
    res.json({
      message: 'Đổi password thành công'
    });
  } catch (error) {
    next(error);
  }
};