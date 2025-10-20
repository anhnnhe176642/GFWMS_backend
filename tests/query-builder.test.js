import { describe, it, expect } from 'vitest';
import {
  buildWhereClause,
  buildPagination,
  buildSort,
  formatPaginatedResponse,
  buildNestedWhere,
  buildSearchCondition
} from '../src/utils/query-builder.js';

describe('query-builder utilities', () => {
  describe('buildPagination', () => {
    it('returns default skip/take for no args', () => {
      const res = buildPagination();
      expect(res).toEqual({ skip: 0, take: 10 });
    });

    it('parses numeric string args and clamps limit', () => {
      expect(buildPagination('2', '5')).toEqual({ skip: 5, take: 5 });
      // limit should be clamped to max 100
      expect(buildPagination(1, 1000)).toEqual({ skip: 0, take: 100 });
      // page cannot be less than 1
      expect(buildPagination(0, 10)).toEqual({ skip: 0, take: 10 });
    });
  });

  describe('buildSort', () => {
    it('returns single-field sort by default', () => {
      expect(buildSort()).toEqual({ createdAt: 'desc' });
      expect(buildSort('createdAt', 'asc')).toEqual({ createdAt: 'asc' });
    });

    it('parses multiple comma-separated fields and orders', () => {
      const res = buildSort('status,createdAt', 'asc,desc');
      expect(res).toEqual([{ status: 'asc' }, { createdAt: 'desc' }]);
    });

    it('accepts arrays and applies mapping', () => {
      const res = buildSort(['a', 'b'], ['desc', 'asc'], { a: 'alpha' });
      expect(res).toEqual([{ alpha: 'desc' }, { b: 'asc' }]);
    });

    it('defaults invalid order strings to desc', () => {
      expect(buildSort('x', 'notvalid')).toEqual({ x: 'desc' });
    });
  });

  describe('buildWhereClause', () => {
    it('handles simple exact filters', () => {
      expect(buildWhereClause({ status: 'ACTIVE' })).toEqual({ status: 'ACTIVE' });
    });

    it('handles array values as in operator', () => {
      expect(buildWhereClause({ status: ['A', 'B'] })).toEqual({ status: { in: ['A', 'B'] } });
    });

    it('handles range objects (gte/lte)', () => {
      const input = { age: { gte: 18, lte: 30 } };
      expect(buildWhereClause(input)).toEqual({ age: { gte: 18, lte: 30 } });
    });

    it('ignores undefined, null and empty string values', () => {
      const res = buildWhereClause({ a: undefined, b: null, c: '' });
      expect(res).toEqual({});
    });

    it('handles array of numbers as in operator', () => {
      expect(buildWhereClause({ ids: [1, 2, 3] })).toEqual({ ids: { in: [1, 2, 3] } });
    });

    it('builds nested where for relation fields', () => {
      const res = buildWhereClause({ 'role.name': 'ADMIN' });
      expect(res).toEqual({ role: { name: { contains: 'ADMIN' } } });
    });

    it('merges multiple conditions on the same relation', () => {
      const res = buildWhereClause({ 'role.name': 'ADMIN', 'role.status': 'ACTIVE' });
      expect(res).toEqual({ role: { name: { contains: 'ADMIN' }, status: { contains: 'ACTIVE' } } });
    });

    it('supports filterMapping for nested fields', () => {
      const res = buildWhereClause({ roleName: 'ADMIN' }, [], { roleName: 'role.name' });
      expect(res).toEqual({ role: { name: { contains: 'ADMIN' } } });
    });

    it('builds deeply nested where for >2 levels', () => {
      const res = buildWhereClause({ 'store.address.city': 'Hanoi' });
      expect(res).toEqual({ store: { address: { city: { contains: 'Hanoi' } } } });
    });

    it('builds very deeply nested where for >3 levels', () => {
      const res = buildWhereClause({ 'level1.level2.level3.level4': 'deep' });
      expect(res).toEqual({ level1: { level2: { level3: { level4: { contains: 'deep' } } } } });
    });

    it('buildNestedWhere handles arrays and range objects directly', () => {
      expect(buildNestedWhere('role.ids', [1, 2])).toEqual({ role: { ids: { in: [1, 2] } } });
      expect(buildNestedWhere('meta.range', { gte: 1, lte: 5 })).toEqual({ meta: { range: { gte: 1, lte: 5 } } });
    });

    it('buildNestedWhere handles very deep nested paths directly', () => {
      expect(buildNestedWhere('a.b.c.d', 'val')).toEqual({ a: { b: { c: { d: { contains: 'val' } } } } });
    });

    it('buildSearchCondition returns contains for flat and nested fields', () => {
      expect(buildSearchCondition('name', 'bob')).toEqual({ name: { contains: 'bob' } });
      expect(buildSearchCondition('role.title', 'admin')).toEqual({ role: { title: { contains: 'admin' } } });
      expect(buildSearchCondition('store.address.city', 'Hanoi')).toEqual({ store: { address: { city: { contains: 'Hanoi' } } } });
    });

    it('builds search OR condition for searchable fields including nested', () => {
      const res = buildWhereClause({ search: 'John' }, ['username', 'role.name', 'email', 'store.address.city']);
      expect(res).toHaveProperty('OR');
      expect(Array.isArray(res.OR)).toBe(true);
      expect(res.OR).toEqual(
        expect.arrayContaining([
          { username: { contains: 'John' } },
          { role: { name: { contains: 'John' } } },
            { email: { contains: 'John' } },
            { store: { address: { city: { contains: 'John' } } } }
        ])
      );
    });
  });

  describe('formatPaginatedResponse', () => {
    it('formats pagination metadata correctly', () => {
      const items = [{ id: 1 }, { id: 2 }];
      const total = '5';
      const page = '2';
      const limit = '2';
      const res = formatPaginatedResponse(items, total, page, limit);
      expect(res).toEqual({
        data: items,
        pagination: {
          page: 2,
          limit: 2,
          total: 5,
          totalPages: 3,
          hasNext: true,
          hasPrev: true
        }
      });
    });
  });
});
