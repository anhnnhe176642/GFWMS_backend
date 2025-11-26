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
    VIEW_QUANTITY:      { key: 'fabric:view_quantity',      description: 'Xem số lượng vải' },
    CREATE:             { key: 'fabric:create',             description: 'Tạo vải mới' },
    UPDATE:             { key: 'fabric:update',             description: 'Cập nhật thông tin vải' },
    DELETE:             { key: 'fabric:delete',             description: 'Xóa vải' },
    MANAGE_CATEGORIES:  { key: 'fabric:manage_categories',  description: 'Quản lý danh mục vải' },
    MANAGE_COLORS:      { key: 'fabric:manage_colors',      description: 'Quản lý màu sắc vải' },
    MANAGE_GLOSS:       { key: 'fabric:manage_gloss',       description: 'Quản lý độ bóng vải' },
    MANAGE_SUPPLIER:    { key: 'fabric:manage_supplier',    description: 'Quản lý nhà cung cấp vải' },
    ALLOCATE_TO_SHELF:  { key: 'fabric:allocate_to_shelf',  description: 'Thêm vải vào các kệ' }
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
    VIEW_LIST:              { key: 'exportFabric:view_list',    description: 'Xem danh sách các đơn yêu cầu xuất kho' },
    VIEW_DETAIL:            { key: 'exportFabric:view_detail',  description: 'Xem chi tiết các đơn yêu cầu xuất kho' },
    VIEW_DETAIL_WAREHOUSE:  { key: 'exportFabric:view_detail',  description: 'Xem chi tiết các đơn yêu cầu xuất kho' },
    CREATE:                 { key: 'exportFabric:create',       description: 'Tạo đơn yêu cầu xuất kho mới' },
    CHANGE_STATUS:            { key: 'exportFabric:change_status',      description: 'Thay đổi trạng thái đơn' },
  },

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

  // Order Management
  ORDERS: {
    CREATE_ONLINE:         {key: 'order:create_online',        description: 'Tạo đơn hàng online (customer)'},
    CREATE_OFFLINE:        {key: 'order:create_offline',       description: 'Tạo đơn hàng offline tại cửa hàng (staff)'},
    VIEW_MY:               {key: 'order:view_my',              description: 'Xem danh sách đơn hàng của tôi (customer)'},
    VIEW_LIST:             {key: 'order:view_list',            description: 'Xem danh sách đơn hàng'},
    VIEW_DETAIL:           {key: 'order:view_detail',          description: 'Xem chi tiết đơn hàng'},
    UPDATE_STATUS:         {key: 'order:update_status',        description: 'Cập nhật trạng thái đơn hàng'},
    CANCEL:                {key: 'order:cancel',               description: 'Hủy đơn hàng'},
    CONFIRM_PAYMENT:       {key: 'order:confirm_payment',      description: 'Xác nhận thanh toán'},
    CHECK_CUSTOMER_CREDIT: {key: 'order:check_customer_credit',description: 'Kiểm tra tín dụng khách hàng'}
  },

  // YOLO Detection & Model Management
  YOLO: {
    DETECT:       { key: 'yolo:detect',        description: 'Phát hiện đối tượng trong hình ảnh' },
    VIEW_MODELS:  { key: 'yolo:view_models',   description: 'Xem danh sách các model YOLO' },
    VIEW_MODEL:   { key: 'yolo:view_model',    description: 'Xem chi tiết model YOLO' },
    UPLOAD_MODEL: { key: 'yolo:upload_model',  description: 'Tải lên model YOLO mới' },
    ACTIVATE_MODEL: { key: 'yolo:activate_model', description: 'Kích hoạt model YOLO' },
    UPDATE_MODEL: { key: 'yolo:update_model',  description: 'Cập nhật thông tin model YOLO' },
    DELETE_MODEL: { key: 'yolo:delete_model',  description: 'Xóa model YOLO' },
    VIEW_LOGS:    { key: 'yolo:view_logs',     description: 'Xem logs phát hiện của model' },
    VIEW_STATS:   { key: 'yolo:view_stats',    description: 'Xem thống kê model YOLO' },
    // Dataset Management
    VIEW_DATASET:   { key: 'yolo:view_dataset',   description: 'Xem dataset YOLO' },
    MANAGE_DATASET: { key: 'yolo:manage_dataset', description: 'Quản lý dataset YOLO (tạo, cập nhật, xóa, thêm ảnh)' },
    EXPORT_DATASET: { key: 'yolo:export_dataset', description: 'Xuất dataset YOLO dưới dạng ZIP' }
  },

  BANNER: {
    VIEW_LIST:    { key: 'banner:view_list',    description: 'Xem danh sách banner' },
    VIEW_DETAIL:  { key: 'banner:view_detail',  description: 'Xem chi tiết banner' },
    CREATE:       { key: 'banner:create',       description: 'Tạo banner mới' },
    UPDATE:       { key: 'banner:update',       description: 'Cập nhật thông tin banner' },
    DELETE:       { key: 'banner:delete',       description: 'Xóa banner (soft delete)' },
  },

  BANNER_DISCOUNT: {
    VIEW_LIST:    { key: 'banner_discount:view_list',    description: 'Xem danh sách banner_discount' },
    VIEW_DETAIL:  { key: 'banner_discount:view_detail',  description: 'Xem chi tiết banner_discount' },
    CREATE:       { key: 'banner_discount:create',       description: 'Tạo banner_discount mới' },
    UPDATE:       { key: 'banner_discount:update',       description: 'Cập nhật thông tin banner_discount' },
    DELETE:       { key: 'banner_discount:delete',       description: 'Xóa banner_discount (soft delete)' },
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
      PERMISSIONS.CREDITS.VIEW_OWN.key,
      
      // YOLO detection - view only
      PERMISSIONS.YOLO.DETECT.key,
      PERMISSIONS.YOLO.VIEW_MODELS.key,
      PERMISSIONS.YOLO.VIEW_MODEL.key,
      PERMISSIONS.YOLO.VIEW_LOGS.key,
      PERMISSIONS.YOLO.VIEW_STATS.key,
      
      // YOLO dataset management
      PERMISSIONS.YOLO.VIEW_DATASET.key,
      PERMISSIONS.YOLO.MANAGE_DATASET.key,
      PERMISSIONS.YOLO.EXPORT_DATASET.key
    ]
  }
};