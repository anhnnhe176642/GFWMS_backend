/**
 * Chuẩn hóa các giá trị enum trong object filters sang UPPERCASE.
 * Dùng cho các field enum khi query Prisma (vì Prisma enum phân biệt hoa thường).
 *
 * @param {Object} filters - Object chứa các filters từ request
 * @param {string[]} enumFields - Danh sách các field là enum cần chuẩn hóa
 * @returns {Object} Object filters mới, đã được chuẩn hóa
 *
 * @example
 * const filters = { status: 'pending', type: ['normal', 'express'] };
 * const normalized = normalizeEnumFilters(filters, ['status', 'type']);
 * // => { status: 'PENDING', type: ['NORMAL', 'EXPRESS'] }
 */
export function normalizeEnumFilters(filters, enumFields = []) {
  if (!filters || typeof filters !== 'object') return filters;

  const result = { ...filters };

  for (const key of enumFields) {
    if (result[key]) {
      if (Array.isArray(result[key])) {
        result[key] = result[key].map(v =>
          typeof v === 'string' ? v.toUpperCase() : v
        );
      } else if (typeof result[key] === 'string') {
        result[key] = result[key].toUpperCase();
      }
    }
  }

  return result;
}
