/**
 * Middleware to parse JSON fields in multipart/form-data requests
 * Converts JSON string fields back to objects/arrays before validation
 * 
 * @param {string[]} fields - Array of field names to parse as JSON
 * @returns {Function} Express middleware
 */
export const parseMultipartJson = (fields = []) => {
  return (req, res, next) => {
    if (!req.body) {
      return next();
    }

    // Parse specified fields
    for (const field of fields) {
      if (req.body[field] && typeof req.body[field] === 'string') {
        try {
          req.body[field] = JSON.parse(req.body[field]);
        } catch (error) {
            console.error(`Error parsing JSON field "${field}":`, error);
          return res.status(400).json({
            message: 'Dữ liệu không hợp lệ',
            errors: [{
              field,
              message: `Invalid JSON format for field "${field}"`
            }]
          });
        }
      }
    }

    next();
  };
};
