// Định nghĩa permissions với cả key và description
export const PERMISSIONS = {
  // User Management
  USERS: {
    VIEW_LIST:          { key: 'user:view_list',          description: 'Xem danh sách người dùng' },
    VIEW_DETAIL:        { key: 'user:view_detail',        description: 'Xem chi tiết người dùng' },
    CREATE:             { key: 'user:create',             description: 'Tạo người dùng mới' },
    UPDATE:             { key: 'user:update',             description: 'Cập nhật thông tin người dùng' },
    DELETE:             { key: 'user:delete',             description: 'Xóa người dùng' },
    MANAGE_ROLES:       { key: 'user:manage_roles',       description: 'Quản lý vai trò người dùng' },
    CHANGE_STATUS:      { key: 'user:change_status',      description: 'Thay đổi trạng thái người dùng' },
    VIEW_OWN_PROFILE:   { key: 'user:view_own_profile',   description: 'Xem hồ sơ cá nhân' },
    UPDATE_OWN_PROFILE: { key: 'user:update_own_profile', description: 'Cập nhật hồ sơ cá nhân' }
  },
  
  // Fabric Management
  FABRICS: {
    VIEW_LIST:          { key: 'fabric:view_list',          description: 'Xem danh sách vải' },
    VIEW_DETAIL:        { key: 'fabric:view_detail',        description: 'Xem chi tiết vải' },
    CREATE:             { key: 'fabric:create',             description: 'Tạo vải mới' },
    UPDATE:             { key: 'fabric:update',             description: 'Cập nhật thông tin vải' },
    DELETE:             { key: 'fabric:delete',             description: 'Xóa vải' },
    MANAGE_CATEGORIES:  { key: 'fabric:manage_categories',  description: 'Quản lý danh mục vải' },
    MANAGE_COLORS:      { key: 'fabric:manage_colors',      description: 'Quản lý màu sắc vải' },
    MANAGE_GLOSS:       { key: 'fabric:manage_gloss',       description: 'Quản lý độ bóng vải' }
  },
  
  // Credit Registration
  CREDITS: {
    VIEW_LIST:   { key: 'credit:view_list',   description: 'Xem danh sách đăng ký tín dụng' },
    VIEW_DETAIL: { key: 'credit:view_detail', description: 'Xem chi tiết đăng ký tín dụng' },
    CREATE:      { key: 'credit:create',      description: 'Tạo đăng ký tín dụng mới' },
    UPDATE:      { key: 'credit:update',      description: 'Cập nhật đăng ký tín dụng' },
    DELETE:      { key: 'credit:delete',      description: 'Xóa đăng ký tín dụng' },
    APPROVE:     { key: 'credit:approve',     description: 'Phê duyệt đăng ký tín dụng' },
    REJECT:      { key: 'credit:reject',      description: 'Từ chối đăng ký tín dụng' },
    VIEW_OWN:    { key: 'credit:view_own',    description: 'Xem đăng ký tín dụng của mình' }
  },
  
  // Role Management
  ROLES: {
    VIEW:   { key: 'role:view',   description: 'Xem danh sách vai trò' },
    CREATE: { key: 'role:create', description: 'Tạo vai trò mới' },
    UPDATE: { key: 'role:update', description: 'Cập nhật vai trò' },
    DELETE: { key: 'role:delete', description: 'Xóa vai trò' }
  },
  
  // System Administration
  SYSTEM: {
    VIEW_AUDIT_LOGS:     { key: 'system:view_audit_logs',     description: 'Xem nhật ký kiểm tra hệ thống' },
    MANAGE_PERMISSIONS:  { key: 'system:manage_permissions',  description: 'Quản lý quyền hạn hệ thống' },
    MANAGE_ROLES:        { key: 'system:manage_roles',        description: 'Quản lý vai trò hệ thống' },
    SYSTEM_CONFIG:       { key: 'system:config',              description: 'Cấu hình hệ thống' }
  }
};

// Hàm helper để lấy tất cả permissions với đầy đủ thông tin (key + description)
export const allPermissionObjects = () => {
  return Object.values(PERMISSIONS).flatMap(group => Object.values(group));
};

// Hàm helper để lấy tất cả các giá trị permission key thành một mảng
export const allPermissions = () => {
  return Object.values(PERMISSIONS).flatMap(group => 
    Object.values(group).map(p => p.key)
  );
};

// Hàm helper để lấy permissions theo nhóm
export const getPermissionsByGroup = (groupName) => {
  return PERMISSIONS[groupName] 
    ? Object.values(PERMISSIONS[groupName]).map(p => p.key)
    : [];
};

export const checkPermission = (userPermissions, permission) => {
  return userPermissions.includes(permission);
};

// Predefined role permissions
export const ROLE_PERMISSIONS = {
  ADMIN: {
    name: 'ADMIN',
    permissions: allPermissions() // Admin có tất cả quyền
  },
  USER: {
    name: 'USER', 
    permissions: [
      // User chỉ có quyền xem và quản lý profile của mình
      PERMISSIONS.USERS.VIEW_OWN_PROFILE.key,
      PERMISSIONS.USERS.UPDATE_OWN_PROFILE.key,
      
      // Xem danh sách fabrics
      PERMISSIONS.FABRICS.VIEW_LIST.key,
      PERMISSIONS.FABRICS.VIEW_DETAIL.key,
      
      // Quản lý credit registration của mình
      PERMISSIONS.CREDITS.VIEW_OWN.key,
      PERMISSIONS.CREDITS.CREATE.key
    ]
  },
  STAFF: {
    name: 'STAFF',
    permissions: [
      // User management (không bao gồm delete và manage roles)
      PERMISSIONS.USERS.VIEW_LIST.key,
      PERMISSIONS.USERS.VIEW_DETAIL.key,
      PERMISSIONS.USERS.CREATE.key,
      PERMISSIONS.USERS.UPDATE.key,
      PERMISSIONS.USERS.VIEW_OWN_PROFILE.key,
      PERMISSIONS.USERS.UPDATE_OWN_PROFILE.key,
      
      // Full fabric management
      ...getPermissionsByGroup('FABRICS'),
      
      // Credit management
      PERMISSIONS.CREDITS.VIEW_LIST.key,
      PERMISSIONS.CREDITS.VIEW_DETAIL.key,
      PERMISSIONS.CREDITS.CREATE.key,
      PERMISSIONS.CREDITS.UPDATE.key,
      PERMISSIONS.CREDITS.APPROVE.key,
      PERMISSIONS.CREDITS.REJECT.key,
      PERMISSIONS.CREDITS.VIEW_OWN.key
    ]
  }
};