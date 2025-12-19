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
  // Customer Management
  CUSTOMERS: {
    VIEW_LIST: { key: 'customer:view_list', description: 'Xem danh sách khách hàng' },
    VIEW_DETAIL: { key: 'customer:view_detail', description: 'Xem chi tiết khách hàng' },
    UPDATE: { key: 'customer:update', description: 'Cập nhật thông tin khách hàng' },
    MANAGE_STATUS: { key: 'customer:manage_status', description: 'Quản lý trạng thái khách hàng' },
    VIEW_FABRIC_CATEGORIES: { key: 'customer:view_fabric_categories', description: 'Xem danh mục vải dành cho khách hàng' },
    VIEW_FABRIC_COLORS: { key: 'customer:view_fabric_colors', description: 'Xem màu vải dành cho khách hàng' },
    VIEW_FABRICS_GLOSS: { key: 'customer:view_fabrics_gloss', description: 'Xem độ bóng vải dành cho khách hàng' },
    VIEW_STORES: { key: 'customer:view_stores', description: 'Xem danh sách cửa hàng'}
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
    DELETE:       { key: 'warehouse:delete',       description: 'Xóa kho' },
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
    SYSTEM_CONFIG:       { key: 'system:config',              description: 'Cấu hình hệ thống' },
    ADMIN_PAGE_ACCESS:   { key: 'system:admin',                description: 'Truy cập trang quản trị hệ thống' }
  },

    // Invoice Management 
  INVOICES: {
    VIEW_LIST:    { key: 'invoice:view_list',    description: 'Xem danh sách hóa đơn' },
    VIEW_DETAIL:  { key: 'invoice:view_detail',  description: 'Xem chi tiết hóa đơn' },
  },

  EXPORT_FABRICS: {
    VIEW_LIST:              { key: 'exportFabric:view_list',    description: 'Xem danh sách các đơn yêu cầu xuất kho' },
    VIEW_DETAIL:            { key: 'exportFabric:view_detail',  description: 'Xem chi tiết các đơn yêu cầu xuất kho' },
    VIEW_DETAIL_WAREHOUSE:  { key: 'exportFabric:view_detail_warehouse',  description: 'Xem chi tiết các đơn yêu cầu xuất kho' },
    CREATE:                 { key: 'exportFabric:create',       description: 'Tạo đơn yêu cầu xuất kho mới' },
    CHANGE_STATUS:          { key: 'exportFabric:change_status',description: 'Thay đổi trạng thái đơn' },
    RECEIVE:                { key: 'exportFabric:receive',      description: 'Xác nhận nhận hàng từ cửa hàng' },
  },

  EXPORT_FABRIC_REQUESTS: {
    VIEW_LIST:              { key: 'exportFabricRequest:view_list',    description: 'Xem danh sách yêu cầu xuất vải' },
  },

  STORES: {
    VIEW_LIST:           { key: 'store:view_list',           description: 'Xem danh sách cửa hàng' },
    VIEW_DETAIL:         { key: 'store:view_detail',         description: 'Xem chi tiết cửa hàng' },
    CREATE:              { key: 'store:create',              description: 'Tạo cửa hàng mới' },
    UPDATE:              { key: 'store:update',              description: 'Cập nhật thông tin cửa hàng' },
    DELETE:              { key: 'store:delete',              description: 'Xóa cửa hàng' },
    MANAGER:             { key: 'store:manager',             description: 'Là quản lý cửa hàng (quản lý cửa hàng cụ thể được assign)' },
    MANAGER_ALL:         { key: 'store:manager_all',         description: 'Quản lý tất cả cửa hàng (quyền cao cấp)' },
    MANAGE_MANAGERS:     { key: 'store:manage_managers',     description: 'Quản lý người quản lý cửa hàng' }
  },

  WAREHOUSES_MANAGER: {
    MANAGER:             { key: 'warehouse:manager',         description: 'Là quản lý kho (quản lý kho cụ thể được assign)' },
    MANAGER_ALL:         { key: 'warehouse:manager_all',     description: 'Quản lý tất cả kho (quyền cao cấp)' },
    MANAGE_MANAGERS:     { key: 'warehouse:manage_managers', description: 'Quản lý người quản lý kho' }
  },

  SHELVES: {
    VIEW_LIST:    { key: 'shelf:view_list',    description: 'Xem danh sách kệ trong kho' },
    VIEW_DETAIL:  { key: 'shelf:view_detail',  description: 'Xem chi tiết kệ' },
    CREATE:       { key: 'shelf:create',       description: 'Tạo kệ mới' },
    UPDATE:       { key: 'shelf:update',       description: 'Cập nhật thông tin kệ' },
    DELETE:       { key: 'shelf:delete',       description: 'Xóa kệ' },
    ADJUST_FABRIC:{ key: 'shelf:adjust_fabric', description: 'Điều chỉnh số lượng vải trên kệ' },
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
    DELETE:       { key: 'banner:delete',       description: 'Xóa banner' },
  },

  BANNER_DISCOUNT: {
    VIEW_LIST:    { key: 'banner_discount:view_list',    description: 'Xem danh sách banner_discount' },
    VIEW_DETAIL:  { key: 'banner_discount:view_detail',  description: 'Xem chi tiết banner_discount' },
    CREATE:       { key: 'banner_discount:create',       description: 'Tạo banner_discount mới' },
    UPDATE:       { key: 'banner_discount:update',       description: 'Cập nhật thông tin banner_discount' },
    DELETE:       { key: 'banner_discount:delete',       description: 'Xóa banner_discount' },
  },

  CREADIT_REGISTRATION: {
    VIEW_LIST:           { key: 'creadit_registration:view_list',           description: 'Xem danh sách đơn đăng ký' },
    VIEW_DETAIL:         { key: 'creadit_registration:view_detail',         description: 'Xem chi tiết đơn đăng ký' },
    CREDIT_SCORE:        { key: 'creadit_registration:credit_score',        description: 'Xem điểm uy tín và gợi ý hạn mức tín dụng' },
  },

  CREADIT_REQUEST: {
    VIEW_LIST:            { key: 'creadit_request:view_list',              description: 'Xem lịch sử đơn đăng ký' },
    VIEW_DETAIL:          { key: 'creadit_request:view_detail',            description: 'Xem chi tiết lịch sử đơn đăng ký' },
    CREATE:               { key: 'creadit_request:create',                 description: 'Tạo đơn đăng ký nợ mới' },
    APPROVE:              { key: 'creadit_request:approve',                description: 'Phê duyệt đơn đăng ký nợ ' },
    REJECT:               { key: 'creadit_request:reject',                 description: 'Từ chối đơn đăng ký nợ' },
  },

  CREDIT_INVOICES: {
    VIEW_MY:      { key: 'credit_invoice:view_my',      description: 'Xem danh sách Credit Invoice của tôi' },
    VIEW_LIST:    { key: 'credit_invoice:view_list',    description: 'Xem danh sách Credit Invoice (Admin/Staff)' },
    VIEW_DETAIL:  { key: 'credit_invoice:view_detail',  description: 'Xem chi tiết Credit Invoice' },
  },

  // Dashboard Statistics
  DASHBOARD: {
    VIEW:         { key: 'dashboard:view',         description: 'Xem thống kê dashboard' },
    VIEW_REVENUE: { key: 'dashboard:view_revenue', description: 'Xem thống kê doanh thu' },
    VIEW_PROFIT:  { key: 'dashboard:view_profit',  description: 'Xem thống kê lợi nhuận' },
    VIEW_ORDERS:  { key: 'dashboard:view_orders',  description: 'Xem thống kê đơn hàng' },
    VIEW_CUSTOMERS: { key: 'dashboard:view_customers', description: 'Xem thống kê khách hàng' },
    VIEW_INVENTORY: { key: 'dashboard:view_inventory', description: 'Xem thống kê tồn kho' }
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
      PERMISSIONS.ORDERS.CREATE_ONLINE.key,
      PERMISSIONS.ORDERS.VIEW_MY.key,
      PERMISSIONS.CREADIT_REQUEST.CREATE.key,
      PERMISSIONS.CREDITS.VIEW_OWN.key,
      PERMISSIONS.CREDIT_INVOICES.VIEW_MY.key,
      PERMISSIONS.CUSTOMERS.VIEW_FABRIC_CATEGORIES.key,
      PERMISSIONS.CUSTOMERS.VIEW_FABRICS_GLOSS.key,
      PERMISSIONS.CUSTOMERS.VIEW_FABRIC_COLORS.key,
      PERMISSIONS.CUSTOMERS.VIEW_STORES.key,
      PERMISSIONS.STORES.VIEW_LIST.key
    ]
  },
  WAREHOUSE_STAFF: {
    name: 'WAREHOUSE_STAFF',
    permissions: [
      PERMISSIONS.ORDERS.CREATE_ONLINE.key,
      PERMISSIONS.ORDERS.VIEW_MY.key,
      PERMISSIONS.CREADIT_REQUEST.CREATE.key,
      PERMISSIONS.CREDITS.VIEW_OWN.key,
      PERMISSIONS.CREDIT_INVOICES.VIEW_MY.key,
      PERMISSIONS.CUSTOMERS.VIEW_FABRIC_CATEGORIES.key,
      PERMISSIONS.CUSTOMERS.VIEW_FABRICS_GLOSS.key,
      PERMISSIONS.CUSTOMERS.VIEW_FABRIC_COLORS.key,
      PERMISSIONS.CUSTOMERS.VIEW_STORES.key,
      PERMISSIONS.STORES.VIEW_LIST.key,
      PERMISSIONS.WAREHOUSES.VIEW_LIST.key,
      PERMISSIONS.WAREHOUSES.VIEW_DETAIL.key,
      PERMISSIONS.WAREHOUSES_MANAGER.MANAGER.key,
      PERMISSIONS.SHELVES.VIEW_LIST.key,
      PERMISSIONS.SHELVES.VIEW_DETAIL.key,
      PERMISSIONS.SHELVES.ADJUST_FABRIC.key,
      PERMISSIONS.EXPORT_FABRICS.VIEW_LIST.key,
      PERMISSIONS.EXPORT_FABRICS.VIEW_DETAIL_WAREHOUSE.key,
      PERMISSIONS.EXPORT_FABRICS.CHANGE_STATUS.key,
      PERMISSIONS.IMPORT_FABRICS.VIEW_LIST.key,
      PERMISSIONS.IMPORT_FABRICS.VIEW_DETAIL.key,
      PERMISSIONS.IMPORT_FABRICS.CREATE.key,
      PERMISSIONS.IMPORT_FABRICS.SET_SELLING_PRICE.key,
      PERMISSIONS.FABRICS.ALLOCATE_TO_SHELF.key,
      PERMISSIONS.YOLO.DETECT.key,
      PERMISSIONS.YOLO.VIEW_DATASET.key
    ]
  },

  STORE_STAFF: {
    name: 'STORE_STAFF',
    permissions: [
      PERMISSIONS.ORDERS.CREATE_ONLINE.key,
      PERMISSIONS.ORDERS.VIEW_MY.key,
      PERMISSIONS.CREADIT_REQUEST.CREATE.key,
      PERMISSIONS.CREDITS.VIEW_OWN.key,
      PERMISSIONS.CREDIT_INVOICES.VIEW_MY.key,
      PERMISSIONS.CUSTOMERS.VIEW_FABRIC_CATEGORIES.key,
      PERMISSIONS.CUSTOMERS.VIEW_FABRICS_GLOSS.key,
      PERMISSIONS.CUSTOMERS.VIEW_FABRIC_COLORS.key,
      PERMISSIONS.CUSTOMERS.VIEW_STORES.key,
      PERMISSIONS.STORES.VIEW_LIST.key,
      PERMISSIONS.STORES.VIEW_LIST.key,
      PERMISSIONS.STORES.VIEW_DETAIL.key,
      PERMISSIONS.EXPORT_FABRICS.VIEW_DETAIL.key,
      PERMISSIONS.EXPORT_FABRICS.CREATE.key,
      PERMISSIONS.EXPORT_FABRICS.RECEIVE.key,
      PERMISSIONS.ORDERS.CREATE_OFFLINE.key,
      PERMISSIONS.STORES.MANAGER.key,
      PERMISSIONS.ORDERS.VIEW_DETAIL.key,
      PERMISSIONS.ORDERS.VIEW_LIST.key,
      PERMISSIONS.ORDERS.UPDATE_STATUS.key,
      PERMISSIONS.ORDERS.CANCEL.key,
      PERMISSIONS.ORDERS.CONFIRM_PAYMENT.key,
      PERMISSIONS.ORDERS.CHECK_CUSTOMER_CREDIT.key,
      PERMISSIONS.CREDIT_INVOICES.VIEW_LIST.key,
      PERMISSIONS.CREDIT_INVOICES.VIEW_DETAIL.key,
      PERMISSIONS.INVOICES.VIEW_LIST.key,
      PERMISSIONS.INVOICES.VIEW_DETAIL.key
    ]
  },

  ACCOUNTANT: {
    name: 'ACCOUNTANT',
    permissions: [
      PERMISSIONS.ORDERS.CREATE_ONLINE.key,
      PERMISSIONS.ORDERS.VIEW_MY.key,
      PERMISSIONS.CREADIT_REQUEST.CREATE.key,
      PERMISSIONS.CREDITS.VIEW_OWN.key,
      PERMISSIONS.CREDIT_INVOICES.VIEW_MY.key,
      PERMISSIONS.CUSTOMERS.VIEW_FABRIC_CATEGORIES.key,
      PERMISSIONS.CUSTOMERS.VIEW_FABRICS_GLOSS.key,
      PERMISSIONS.CUSTOMERS.VIEW_FABRIC_COLORS.key,
      PERMISSIONS.CUSTOMERS.VIEW_STORES.key,
      PERMISSIONS.STORES.VIEW_LIST.key,
      PERMISSIONS.ORDERS.VIEW_DETAIL.key,
      PERMISSIONS.ORDERS.VIEW_LIST.key,
      PERMISSIONS.ORDERS.CHECK_CUSTOMER_CREDIT.key,
      PERMISSIONS.CREDIT_INVOICES.VIEW_LIST.key,
      PERMISSIONS.CREDIT_INVOICES.VIEW_DETAIL.key,
      PERMISSIONS.INVOICES.VIEW_LIST.key,
      PERMISSIONS.INVOICES.VIEW_DETAIL.key
    ]
  },
};