/**
 * Build Prisma where clause từ query parameters
 * @param {Object} filters - Object chứa các filter từ query
 * @param {Array} searchableFields - Các field có thể search
 * @param {Object} filterMapping - Mapping giữa query params và Prisma fields
 * @returns {Object} Prisma where clause
 */
export const buildWhereClause = (filters = {}, searchableFields = [], filterMapping = {}) => {
  const where = {};
  const { search, ...otherFilters } = filters;

  // Xử lý search (OR logic cho tất cả searchable fields)
  if (search && searchableFields.length > 0) {
    where.OR = searchableFields.map(field => ({
      [field]: {
        contains: search,
        mode: 'insensitive'
      }
    }));
  }

  // Xử lý các filters khác
  Object.entries(otherFilters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      const mappedKey = filterMapping[key] || key;
      
      // Xử lý array values (IN operator)
      if (Array.isArray(value)) {
        where[mappedKey] = { in: value };
      } 
      // Xử lý range values (gte, lte)
      else if (typeof value === 'object' && (value.gte || value.lte || value.gt || value.lt)) {
        where[mappedKey] = value;
      }
      // Xử lý exact match
      else {
        where[mappedKey] = value;
      }
    }
  });

  return where;
};

/**
 * Build pagination options
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Object} { skip, take }
 */
export const buildPagination = (page = 1, limit = 10) => {
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  
  return {
    skip: (pageNum - 1) * limitNum,
    take: limitNum
  };
};

/**
 * Build sort options
 * @param {string} sortBy - Field to sort by
 * @param {string} order - Sort order (asc/desc)
 * @param {Object} sortMapping - Mapping cho sort fields
 * @returns {Object} Prisma orderBy clause
 */
export const buildSort = (sortBy = 'createdAt', order = 'desc', sortMapping = {}) => {
  const mappedField = sortMapping[sortBy] || sortBy;
  const sortOrder = order.toLowerCase() === 'asc' ? 'asc' : 'desc';
  
  return {
    [mappedField]: sortOrder
  };
};

/**
 * Format pagination response
 * @param {Array} items - Items returned from query
 * @param {number} total - Total count
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {Object} Formatted response with pagination metadata
 */
export const formatPaginatedResponse = (items, total, page, limit) => {
  return {
    data: items,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1
    }
  };
};
