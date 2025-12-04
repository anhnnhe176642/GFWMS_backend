/**
 * Build nested where condition cho relation fields
 * @param {string} path - Nested path (e.g., 'role.name', 'store.address.city')
 * @param {*} value - Filter value
 * @returns {Object} Nested where object
 */
export const buildNestedWhere = (path, value) => {
  const parts = path.split('.');
  const [relation, ...fieldParts] = parts;
  const field = fieldParts.join('.');
  
  let condition;
  
  // Xử lý array values (IN operator)
  if (Array.isArray(value)) {
    condition = { in: value };
  } 
  // Xử lý range values (gte, lte)
  else if (typeof value === 'object' && (value.gte || value.lte || value.gt || value.lt)) {
    condition = value;
  }
  // Xử lý string search (contains)
  else if (typeof value === 'string') {
    condition = { contains: value };
  }
  // Xử lý exact match
  else {
    condition = value;
  }
  
  // Build nested object
  if (fieldParts.length > 1) {
    // Multiple levels: role.permissions.name
    return {
      [relation]: buildNestedWhere(field, value)
    };
  }
  
  // Single level: role.name
  return {
    [relation]: {
      [field]: condition
    }
  };
};

/**
 * Build search condition cho field (hỗ trợ nested fields)
 * @param {string} field - Field name (có thể là 'name' hoặc 'role.name')
 * @param {string} searchValue - Search value
 * @returns {Object} Search condition
 */
export const buildSearchCondition = (field, searchValue) => {
  if (field.includes('.')) {
    // Nested field search
    return buildNestedWhere(field, searchValue);
  }
  
  // Normal field search
  return {
    [field]: {
      contains: searchValue
    }
  };
};

/**
 * Build Prisma where clause từ query parameters
 * Hỗ trợ nested filtering cho relation fields với cú pháp 'relation.field'
 * 
 * @param {Object} filters - Object chứa các filter từ query
 * @param {Array} searchableFields - Các field có thể search (hỗ trợ nested: ['username', 'email', 'role.name'])
 * @param {Object} filterMapping - Mapping giữa query params và Prisma fields (hỗ trợ nested mapping)
 * @returns {Object} Prisma where clause
 * 
 * @example
 * // Simple filter
 * buildWhereClause({ status: 'ACTIVE' }, [])
 * // => { status: 'ACTIVE' }
 * 
 * @example
 * // Array filter
 * buildWhereClause({ status: ['ACTIVE', 'INACTIVE'] }, [])
 * // => { status: { in: ['ACTIVE', 'INACTIVE'] } }
 * 
 * @example
 * // Nested filter
 * buildWhereClause({ 'role.name': 'ADMIN' }, [])
 * // => { role: { name: 'ADMIN' } }
 * 
 * @example
 * // Search with nested fields
 * buildWhereClause({ search: 'John' }, ['username', 'email', 'role.name'])
 * // => { OR: [{ username: { contains: 'John' } }, { email: { contains: 'John' } }, { role: { name: { contains: 'John' } } }] }
 * 
 * @example
 * // With filter mapping
 * buildWhereClause({ roleName: 'ADMIN' }, [], { roleName: 'role.name' })
 * // => { role: { name: { contains: 'ADMIN' } } }
 */
export const buildWhereClause = (filters = {}, searchableFields = [], filterMapping = {}) => {
  const where = {};
  const { search, ...otherFilters } = filters;

  // Xử lý search (OR logic cho tất cả searchable fields) - hỗ trợ nested fields
  if (search && searchableFields.length > 0) {
    where.OR = searchableFields.map(field => buildSearchCondition(field, search));
  }

  // Xử lý các filters khác
  Object.entries(otherFilters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      const mappedKey = filterMapping[key] || key;
      
      // Check if this is a nested field (contains dot)
      if (mappedKey.includes('.')) {
        const nestedWhere = buildNestedWhere(mappedKey, value);
        // Merge nested where (có thể có nhiều conditions cho cùng 1 relation)
        Object.entries(nestedWhere).forEach(([relation, condition]) => {
          if (where[relation]) {
            // Merge nếu đã tồn tại
            where[relation] = { ...where[relation], ...condition };
          } else {
            where[relation] = condition;
          }
        });
      }
      // Normal field
      else {
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
 * Build nested sort condition cho relation fields
 * @param {string} path - Nested path (e.g., 'category.name', 'supplier.name')
 * @param {string} order - Sort order ('asc' or 'desc')
 * @returns {Object} Nested sort object
 * 
 * @example
 * buildNestedSort('category.name', 'asc') => { category: { name: 'asc' } }
 * buildNestedSort('supplier.name', 'desc') => { supplier: { name: 'desc' } }
 */
export const buildNestedSort = (path, order = 'desc') => {
  const parts = path.split('.');
  const sortOrder = order.toLowerCase() === 'asc' ? 'asc' : 'desc';
  
  // Build nested object từ bên phải sang trái
  let result = sortOrder;
  for (let i = parts.length - 1; i >= 0; i--) {
    result = { [parts[i]]: result };
  }
  
  return result;
};

/**
 * Build sort options - support multiple fields including nested fields
 * @param {string|array} sortBy - Field(s) to sort by (comma-separated string or array)
 * @param {string|array} order - Sort order(s) (comma-separated string or array)
 * @param {Object} sortMapping - Mapping cho sort fields
 * @returns {Object|Array} Prisma orderBy clause
 * 
 * @example
 * - Single: buildSort('createdAt', 'desc') => { createdAt: 'desc' }
 * - Multiple: buildSort('status,createdAt', 'asc,desc') => [{ status: 'asc' }, { createdAt: 'desc' }]
 * - Nested single: buildSort('category.name', 'asc') => { category: { name: 'asc' } }
 * - Nested multiple: buildSort('category.name,createdAt', 'asc,desc') => [{ category: { name: 'asc' } }, { createdAt: 'desc' }]
 * - Multiple: buildSort(['status', 'createdAt'], ['asc', 'desc']) => [{ status: 'asc' }, { createdAt: 'desc' }]
 */
export const buildSort = (sortBy = 'createdAt', order = 'desc', sortMapping = {}) => {
  // Parse comma-separated strings to arrays
  const sortFields = typeof sortBy === 'string' ? sortBy.split(',').map(s => s.trim()) : sortBy;
  const orderFields = typeof order === 'string' ? order.split(',').map(s => s.trim()) : order;
  
  // Support array of sort fields
  if (Array.isArray(sortFields) && sortFields.length > 1) {
    const orders = Array.isArray(orderFields) ? orderFields : Array(sortFields.length).fill(orderFields[0] || 'desc');
    return sortFields.map((field, index) => {
      const mappedField = sortMapping[field] || field;
      const sortOrder = (orders[index] || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';
      
      // Check if nested field (contains dot)
      if (mappedField.includes('.')) {
        return buildNestedSort(mappedField, sortOrder);
      }
      
      return { [mappedField]: sortOrder };
    });
  }
  
  // Single field sort (backward compatible)
  const field = Array.isArray(sortFields) ? sortFields[0] : sortFields;
  const mappedField = sortMapping[field] || field;
  const sortOrder = (Array.isArray(orderFields) ? orderFields[0] : orderFields).toLowerCase() === 'asc' ? 'asc' : 'desc';
  
  // Check if nested field (contains dot)
  if (mappedField.includes('.')) {
    return buildNestedSort(mappedField, sortOrder);
  }
  
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
      total: parseInt(total),
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1
    }
  };
};
