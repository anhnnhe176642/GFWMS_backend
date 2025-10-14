/**
 * Utility functions để build filters cho queries
 */

/**
 * Build date range filter
 * @param {Date} from - Ngày bắt đầu
 * @param {Date} to - Ngày kết thúc
 * @param {string} field - Tên field (mặc định: 'createdAt')
 * @returns {Object} Filter object cho date range
 */
export const buildDateRangeFilter = (from, to, field = 'createdAt') => {
  if (!from && !to) return null;
  
  const filter = {};
  if (from) filter.gte = from instanceof Date ? from : new Date(from);
  if (to) filter.lte = to instanceof Date ? to : new Date(to);
  
  return { [field]: filter };
};

/**
 * Build filters object từ query params
 * @param {Object} params - Query parameters (đã được validated)
 * @param {Array<string>} filterFields - Danh sách fields cần filter
 * @param {Object} dateRangeConfig - Config cho date range filter
 * @returns {Object} Filters object
 * 
 * @example
 * // Params đã được validated bởi Joi với createMultiValueFilterSchema
 * const params = { 
 *   status: ['ACTIVE', 'INACTIVE'], // Đã là array từ validation
 *   roleId: 'uuid-123' // Single value
 * };
 * buildFilters(params, ['status', 'roleId']) 
 * // => { status: ['ACTIVE', 'INACTIVE'], roleId: 'uuid-123' }
 */
export const buildFilters = (params, filterFields = [], dateRangeConfig = null) => {
  const filters = {};
  
  // Build simple filters - chỉ filter ra undefined/null/empty
  filterFields.forEach(field => {
    if (params[field] !== undefined && params[field] !== null && params[field] !== '') {
      filters[field] = params[field];
    }
  });
  
  // Build date range filter
  if (dateRangeConfig) {
    const { fromField, toField, targetField } = dateRangeConfig;
    const dateFilter = buildDateRangeFilter(
      params[fromField], 
      params[toField], 
      targetField
    );
    if (dateFilter) {
      Object.assign(filters, dateFilter);
    }
  }
  
  return filters;
};

/**
 * Build pagination params
 * @param {Object} params - Query parameters
 * @param {number} defaultPage - Default page number
 * @param {number} defaultLimit - Default limit
 * @returns {Object} Pagination object
 */
export const buildPagination = (params, defaultPage = 1, defaultLimit = 10) => {
  return {
    page: parseInt(params.page) || defaultPage,
    limit: parseInt(params.limit) || defaultLimit
  };
};

/**
 * Build sort params
 * @param {Object} params - Query parameters
 * @param {string} defaultSortBy - Default sort field
 * @param {string} defaultOrder - Default order (asc/desc)
 * @returns {Object} Sort object
 */
export const buildSort = (params, defaultSortBy = 'createdAt', defaultOrder = 'desc') => {
  return {
    sortBy: params.sortBy || defaultSortBy,
    order: params.order || defaultOrder
  };
};

/**
 * Build complete query params cho advanced search/filter/pagination/sort.
 * Trả về object chuẩn hóa gồm: page, limit, sortBy, order, search, filters.
 *
 * @param {Object} params - Query parameters (đã validate từ request, có thể là string, array, number...)
 * @param {Object} config - Configuration object:
 *   - filterFields: Array<string> - Danh sách các field cần filter (ví dụ: ['status', 'roleId'])
 *   - dateRangeConfig: { fromField, toField, targetField } - Cấu hình filter theo khoảng ngày
 *   - defaultPage: number - Giá trị mặc định cho page
 *   - defaultLimit: number - Giá trị mặc định cho limit
 *   - defaultSortBy: string - Field mặc định để sort
 *   - defaultOrder: string - Order mặc định ('asc'/'desc')
 *
 * @returns {Object} Query params chuẩn hóa:
 *     - page: number,
 *     - limit: number,
 *     - sortBy: string,
 *     - order: string,
 *     - search: string | undefined,
 *     - filters: object
 *
 * @example
 * // Ví dụ 1: Query user list với nhiều filter
 * const params = {
 *   page: '2',
 *   limit: '20',
 *   sortBy: 'createdAt',
 *   order: 'desc',
 *   search: 'john',
 *   status: ['ACTIVE','INACTIVE'],
 *   roleId: 'uuid-123',
 *   createdFrom: '2023-01-01',
 *   createdTo: '2023-12-31'
 * };
 *
 * const config = {
 *   filterFields: ['status', 'roleId'],
 *   dateRangeConfig: {
 *     fromField: 'createdFrom',
 *     toField: 'createdTo',
 *     targetField: 'createdAt'
 *   },
 *   defaultPage: 1,
 *   defaultLimit: 10,
 *   defaultSortBy: 'createdAt',
 *   defaultOrder: 'desc'
 * };
 *
 * const result = buildQueryParams(params, config);
 * // Kết quả:
 *  {
 *    page: 2,
 *    limit: 20,
 *    sortBy: 'createdAt',
 *    order: 'desc',
 *    search: 'john',
 *    filters: {
 *      status: ['ACTIVE','INACTIVE'],
 *      roleId: 'uuid-123',
 *      createdAt: { gte: new Date('2023-01-01'), lte: new Date('2023-12-31') }
 *    }
 *  }
 *
 * // Ví dụ 2: Query không có filter, chỉ phân trang mặc định
 * const result2 = buildQueryParams({}, { defaultPage: 1, defaultLimit: 10 });
 * // Kết quả:
 *   {
 *     page: 1,
 *     limit: 10,
 *     sortBy: 'createdAt',
 *     order: 'desc',
 *     search: undefined,
 *     filters: {}
 *   }
 */
export const buildQueryParams = (params, config = {}) => {
  const {
    filterFields = [],
    dateRangeConfig = null,
    defaultPage = 1,
    defaultLimit = 10,
    defaultSortBy = 'createdAt',
    defaultOrder = 'desc'
  } = config;
  
  return {
    ...buildPagination(params, defaultPage, defaultLimit),
    ...buildSort(params, defaultSortBy, defaultOrder),
    search: params.search || undefined,
    filters: buildFilters(params, filterFields, dateRangeConfig)
  };
};
