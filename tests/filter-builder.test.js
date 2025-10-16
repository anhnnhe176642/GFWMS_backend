import {
  buildDateRangeFilter,
  buildFilters,
  buildPagination,
  buildSort,
  buildQueryParams
} from '../src/utils/filter-builder.js';
import { describe, it, expect } from 'vitest';

// Common test constants
const START_DATE_STR = '2023-01-01';
const END_DATE_STR = '2023-12-31';
const START_DATE = new Date(START_DATE_STR);
const END_DATE = new Date(END_DATE_STR);
const CUSTOM_FIELD_NAME = 'customField';

const PAGE_STR = '2';
const LIMIT_STR = '20';
const SORT_BY_VALUE = 'createdAt';
const ORDER_DESC = 'desc';
const ORDER_ASC = 'asc';
const SEARCH_TERM = 'john';
const STATUS_VALUES = ['ACTIVE', 'INACTIVE'];
const ROLE_ID_VALUE = 'uuid-123';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

describe('buildDateRangeFilter', () => {
  it('returns null if no dates provided', () => {
    expect(buildDateRangeFilter()).toBeNull();
  });
  it('returns gte filter if only startDate provided', () => {
    const startDate = START_DATE_STR;
    expect(buildDateRangeFilter(startDate)).toEqual({ createdAt: { gte: START_DATE } });
  });
  it('returns lte filter if only endDate provided', () => {
    const endDate = END_DATE_STR;
    expect(buildDateRangeFilter(undefined, endDate)).toEqual({ createdAt: { lte: END_DATE } });
  });
  it('returns both gte and lte if both provided', () => {
    const startDate = START_DATE_STR;
    const endDate = END_DATE_STR;
    expect(buildDateRangeFilter(startDate, endDate)).toEqual({ createdAt: { gte: START_DATE, lte: END_DATE } });
  });
  it('uses custom field name', () => {
    const startDate = START_DATE_STR;
    expect(buildDateRangeFilter(startDate, undefined, CUSTOM_FIELD_NAME)).toEqual({ [CUSTOM_FIELD_NAME]: { gte: START_DATE } });
  });
});

describe('buildFilters', () => {
  it('filters out undefined/null/empty fields', () => {
    const queryParams = { includedField: 'x', undefinedField: undefined, nullField: null, emptyField: '' };
    const fieldsToFilter = ['includedField', 'undefinedField', 'nullField', 'emptyField'];
    expect(buildFilters(queryParams, fieldsToFilter)).toEqual({ includedField: 'x' });
  });
  it('includes valid filter fields', () => {
    const queryParams = { status: ['ACTIVE'], roleId: 'uuid' };
    const filterFields = ['status', 'roleId'];
    expect(buildFilters(queryParams, filterFields)).toEqual({ status: ['ACTIVE'], roleId: 'uuid' });
  });
  it('adds date range filter if dateRangeConfig provided', () => {
    const queryParams = { createdFrom: START_DATE_STR, createdTo: END_DATE_STR };
    const dateRangeConfig = { fromField: 'createdFrom', toField: 'createdTo', targetField: 'createdAt' };
    const emptyFilterFields = [];
    expect(buildFilters(queryParams, emptyFilterFields, dateRangeConfig)).toEqual({ createdAt: { gte: START_DATE, lte: END_DATE } });
  });
});

describe('buildPagination', () => {
  it('uses default values if not provided', () => {
    const emptyPaginationParams = {};
    expect(buildPagination(emptyPaginationParams)).toEqual({ page: DEFAULT_PAGE, limit: DEFAULT_LIMIT });
  });
  it('parses page and limit from query params', () => {
    const paginationParams = { page: PAGE_STR, limit: LIMIT_STR };
    expect(buildPagination(paginationParams)).toEqual({ page: parseInt(PAGE_STR), limit: parseInt(LIMIT_STR) });
  });
});

describe('buildSort', () => {
  it('uses default sortBy and order', () => {
    const emptySortParams = {};
    expect(buildSort(emptySortParams)).toEqual({ sortBy: SORT_BY_VALUE, order: ORDER_DESC });
  });
  it('uses provided sortBy and order', () => {
    const sortParams = { sortBy: 'name', order: ORDER_ASC };
    expect(buildSort(sortParams)).toEqual({ sortBy: 'name', order: ORDER_ASC });
  });
});

describe('buildQueryParams', () => {
  it('returns normalized query params with filters and date range', () => {
    const queryParams = {
      page: PAGE_STR,
      limit: LIMIT_STR,
      sortBy: SORT_BY_VALUE,
      order: ORDER_DESC,
      search: SEARCH_TERM,
      status: STATUS_VALUES,
      roleId: ROLE_ID_VALUE,
      createdFrom: START_DATE_STR,
      createdTo: END_DATE_STR
    };
    const queryConfig = {
      filterFields: ['status', 'roleId'],
      dateRangeConfig: {
        fromField: 'createdFrom',
        toField: 'createdTo',
        targetField: 'createdAt'
      },
      defaultPage: 1,
      defaultLimit: 10,
      defaultSortBy: 'createdAt',
      defaultOrder: 'desc'
    };
    const expectedFilters = {
      status: STATUS_VALUES,
      roleId: ROLE_ID_VALUE,
      createdAt: { gte: START_DATE, lte: END_DATE }
    };

    const expectedResult = {
      page: parseInt(PAGE_STR),
      limit: parseInt(LIMIT_STR),
      sortBy: SORT_BY_VALUE,
      order: ORDER_DESC,
      search: SEARCH_TERM,
      filters: expectedFilters
    };

    expect(buildQueryParams(queryParams, queryConfig)).toEqual(expectedResult);
  });
  it('returns defaults when params are empty', () => {
    const defaultsConfig = { defaultPage: 1, defaultLimit: 10 };
    expect(buildQueryParams({}, defaultsConfig)).toEqual({
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      order: 'desc',
      search: undefined,
      filters: {}
    });
  });
});
