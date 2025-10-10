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
 * @param {Object} params - Query parameters
 * @param {Array<string>} filterFields - Danh sách fields cần filter
 * @param {Object} dateRangeConfig - Config cho date range filter
 * @returns {Object} Filters object
 */
export const buildFilters = (params, filterFields = [], dateRangeConfig = null) => {
  const filters = {};
  
  // Build simple filters
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
 * Build complete query params cho advanced search
 * @param {Object} params - Query parameters
 * @param {Object} config - Configuration object
 * @returns {Object} Complete query params
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
