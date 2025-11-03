import * as permissionService from '../services/permission.service.js';

export const getAllPermissions = async (req, res, next) => {
  try {
    const permissions = await permissionService.getAllPermissions();
    
    res.json({
      message: 'Lấy danh sách permissions thành công',
      data: permissions
    });
  } catch (error) {
    next(error);
  }
};
