export const PERMISSIONS = {
  // User Management
  USERS: {
    VIEW_LIST: 'user:view_list',
    VIEW_DETAIL: 'user:view_detail', 
    CREATE: 'user:create',
    UPDATE: 'user:update',
    DELETE: 'user:delete',
    MANAGE_ROLES: 'user:manage_roles',
    CHANGE_STATUS: 'user:change_status',
    VIEW_OWN_PROFILE: 'user:view_own_profile',
    UPDATE_OWN_PROFILE: 'user:update_own_profile'
  },
  
  // Fabric Management
  FABRICS: {
    VIEW_LIST: 'fabric:view_list',
    VIEW_DETAIL: 'fabric:view_detail',
    CREATE: 'fabric:create', 
    UPDATE: 'fabric:update',
    DELETE: 'fabric:delete',
    MANAGE_CATEGORIES: 'fabric:manage_categories',
    MANAGE_COLORS: 'fabric:manage_colors',
    MANAGE_GLOSS: 'fabric:manage_gloss'
  },
  
  // Credit Registration
  CREDITS: {
    VIEW_LIST: 'credit:view_list',
    VIEW_DETAIL: 'credit:view_detail',
    CREATE: 'credit:create',
    UPDATE: 'credit:update', 
    DELETE: 'credit:delete',
    APPROVE: 'credit:approve',
    REJECT: 'credit:reject',
    VIEW_OWN: 'credit:view_own'
  },
  
  // Role Management
  ROLES: {
    VIEW: 'role:view',
    CREATE: 'role:create',
    UPDATE: 'role:update',
    DELETE: 'role:delete'
  },
  
  // System Administration
  SYSTEM: {
    VIEW_AUDIT_LOGS: 'system:view_audit_logs',
    MANAGE_PERMISSIONS: 'system:manage_permissions',
    MANAGE_ROLES: 'system:manage_roles',
    SYSTEM_CONFIG: 'system:config'
  }
};

// Hàm helper để lấy tất cả các giá trị permission thành một mảng
export const allPermissions = () => {
  return Object.values(PERMISSIONS).flatMap(group => Object.values(group));
};

// Hàm helper để lấy permissions theo nhóm
export const getPermissionsByGroup = (groupName) => {
  return PERMISSIONS[groupName] ? Object.values(PERMISSIONS[groupName]) : [];
};

// Predefined role permissions
export const ROLE_PERMISSIONS = {
  ADMIN: {
    name: 'Admin',
    permissions: allPermissions() // Admin có tất cả quyền
  },
  USER: {
    name: 'User', 
    permissions: [
      // User chỉ có quyền xem và quản lý profile của mình
      PERMISSIONS.USERS.VIEW_OWN_PROFILE,
      PERMISSIONS.USERS.UPDATE_OWN_PROFILE,
      
      // Xem danh sách fabrics
      PERMISSIONS.FABRICS.VIEW_LIST,
      PERMISSIONS.FABRICS.VIEW_DETAIL,
      
      // Quản lý credit registration của mình
      PERMISSIONS.CREDITS.VIEW_OWN,
      PERMISSIONS.CREDITS.CREATE
    ]
  },
  STAFF: {
    name: 'Staff',
    permissions: [
      // User management (không bao gồm delete và manage roles)
      PERMISSIONS.USERS.VIEW_LIST,
      PERMISSIONS.USERS.VIEW_DETAIL,
      PERMISSIONS.USERS.CREATE,
      PERMISSIONS.USERS.UPDATE,
      PERMISSIONS.USERS.VIEW_OWN_PROFILE,
      PERMISSIONS.USERS.UPDATE_OWN_PROFILE,
      
      // Full fabric management
      ...getPermissionsByGroup('FABRICS'),
      
      // Credit management
      PERMISSIONS.CREDITS.VIEW_LIST,
      PERMISSIONS.CREDITS.VIEW_DETAIL,
      PERMISSIONS.CREDITS.CREATE,
      PERMISSIONS.CREDITS.UPDATE,
      PERMISSIONS.CREDITS.APPROVE,
      PERMISSIONS.CREDITS.REJECT,
      PERMISSIONS.CREDITS.VIEW_OWN
    ]
  }
};