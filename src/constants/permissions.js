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
    ALLOCATE_TO_SHELF:  { key: 'fabric:allocate_to_shelf',  description: 'Thêm vải vào các kệ' },

    VIEW_CATEGORY_LIST:       { key: 'fabric:view_category_list',       description: 'Xem danh sách loại vải' },
    VIEW_CATEGORY_DETAIL:     { key: 'fabric:view_category_detail',     description: 'Xem chi tiết loại vải' },
    CREATE_CATEGORY:          { key: 'fabric:create_category',          description: 'Tạo loại vải mới' },
    UPDATE_CATEGORY:          { key: 'fabric:update_category',          description: 'Cập nhật thông tin loại vải' },
    DELETE_CATEGORY:          { key: 'fabric:delete_category',          description: 'Xóa loại vải' },

    VIEW_COLOR_LIST:          { key: 'fabric:view_color_list',          description: 'Xem danh sách màu vải' },
    VIEW_COLOR_DETAIL:        { key: 'fabric:view_color_detail',        description: 'Xem chi tiết màu vải' },
    CREATE_COLOR:             { key: 'fabric:create_color',             description: 'Tạo màu vải mới' },
    UPDATE_COLOR:             { key: 'fabric:update_color',             description: 'Cập nhật thông tin màu vải' },
    DELETE_COLOR:             { key: 'fabric:delete_color',             description: 'Xóa màu vải' },

    VIEW_GLOSS_LIST:          { key: 'fabric:view_gloss_list',          description: 'Xem danh sách độ bóng vải' },
    VIEW_GLOSS_DETAIL:        { key: 'fabric:view_gloss_detail',        description: 'Xem chi tiết độ bóng vải' },
    CREATE_GLOSS:             { key: 'fabric:create_gloss',             description: 'Tạo độ bóng vải mới' },
    UPDATE_GLOSS:             { key: 'fabric:update_gloss',             description: 'Cập nhật thông tin độ bóng vải' },
    DELETE_GLOSS:             { key: 'fabric:delete_gloss',             description: 'Xóa độ bóng vải' },

    VIEW_SUPPLIER_LIST:       { key: 'fabric:view_supplier_list',       description: 'Xem danh sách nhà cung cấp vải' },
    VIEW_SUPPLIER_DETAIL:     { key: 'fabric:view_supplier_detail',     description: 'Xem chi tiết nhà cung cấp vải' },
    CREATE_SUPPLIER:          { key: 'fabric:create_supplier',          description: 'Tạo nhà cung cấp vải mới' },
    UPDATE_SUPPLIER:          { key: 'fabric:update_supplier',          description: 'Cập nhật thông tin nhà cung cấp vải' },
    DELETE_SUPPLIER:          { key: 'fabric:delete_supplier',          description: 'Xóa nhà cung cấp vải' },
  },

  // Warehouse Management
  WAREHOUSES: {
    VIEW_LIST:    { key: 'warehouse:view_list',    description: 'Xem danh sách kho' },
    VIEW_DETAIL:  { key: 'warehouse:view_detail',  description: 'Xem chi tiết kho' },
    CREATE:       { key: 'warehouse:create',       description: 'Tạo kho mới' },
    UPDATE:       { key: 'warehouse:update',       description: 'Cập nhật thông tin kho' },
    DELETE:       { key: 'warehouse:delete',       description: 'Xóa kho (soft delete)' },
    MANAGE_STATUS:{ key: 'warehouse:manage_status',description: 'Quản lý trạng thái kho' }
  },

  // Import Fabric
  IMPORT_FABRICS: {
    CREATE:             { key: 'import_fabrics:create',            description: 'Tạo phiếu nhập vải' },
    VIEW_LIST:          { key: 'import_fabrics:view_list',         description: 'Xem danh sách phiếu nhập kho' },
    VIEW_DETAIL:        { key: 'import_fabrics:view_detail',       description: 'Xem chi tiết phiếu nhập kho' },
    SET_SELLING_PRICE:  { key: 'import_fabrics:set_selling_price', description: 'Nhập giá bán khi import vải' }
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
    VIEW_LIST:   { key: 'role:view_list',    description: 'Xem danh sách vai trò' },
    VIEW_DETAIL: { key: 'role:view_detail', description: 'Xem chi tiết vai trò' },
    CREATE:      { key: 'role:create',      description: 'Tạo vai trò mới' },
    UPDATE:      { key: 'role:update',      description: 'Cập nhật vai trò' },
    DELETE:      { key: 'role:delete',      description: 'Xóa vai trò' }
  },
  
  // System Administration
  SYSTEM: {
    VIEW_AUDIT_LOGS:     { key: 'system:view_audit_logs',     description: 'Xem nhật ký kiểm tra hệ thống' },
    MANAGE_PERMISSIONS:  { key: 'system:manage_permissions',  description: 'Quản lý quyền hạn hệ thống' },
    MANAGE_ROLES:        { key: 'system:manage_roles',        description: 'Quản lý vai trò hệ thống' },
    SYSTEM_CONFIG:       { key: 'system:config',              description: 'Cấu hình hệ thống' }
  },

    // Invoice Management 
  INVOICES: {
    VIEW_LIST:    { key: 'invoice:view_list',    description: 'Xem danh sách hóa đơn' },
    VIEW_DETAIL:  { key: 'invoice:view_detail',  description: 'Xem chi tiết hóa đơn' },
  },

  EXPORT_FABRICS: {
    VIEW_LIST:    { key: 'exportFabric:view_list',    description: 'Xem danh sách các đơn yêu cầu xuất kho' },
    VIEW_DETAIL:  { key: 'exportFabric:view_detail',  description: 'Xem chi tiết các đơn yêu cầu xuất kho' },
  },

    // Warehouse Management
  STORES: {
    VIEW_LIST:    { key: 'store:view_list',    description: 'Xem danh sách cửa hàng' },
    VIEW_DETAIL:  { key: 'store:view_detail',  description: 'Xem chi tiết cửa hàng' },
    CREATE:       { key: 'store:create',       description: 'Tạo cửa hàng mới' },
    UPDATE:       { key: 'store:update',       description: 'Cập nhật thông tin cửa hàng' },
    DELETE:       { key: 'store:delete',       description: 'Xóa cửa hàng (soft delete)' },
  },
  SHELVES: {
    VIEW_LIST:    { key: 'shelf:view_list',    description: 'Xem danh sách kệ trong kho' },
    VIEW_DETAIL:  { key: 'shelf:view_detail',  description: 'Xem chi tiết kệ' },
    CREATE:       { key: 'shelf:create',       description: 'Tạo kệ mới' },
    UPDATE:       { key: 'shelf:update',       description: 'Cập nhật thông tin kệ' },
    DELETE:       { key: 'shelf:delete',       description: 'Xóa kệ (soft delete)' },
  },
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