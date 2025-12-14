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

export const getPermissionsByUserId = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    const userPermissions = await permissionService.getPermissionsByUserId(userId);
    
    res.json({
      message: 'Lấy danh sách quyền của người dùng thành công',
      data: userPermissions
    });
  } catch (error) {
    next(error);
  }
};
