import { fabricCustomerService } from '../services/fabricCustomer.service.js';
import { buildQueryParams } from '../utils/filter-builder.js';

/**
 * Get all fabric customers for customer viewing with advanced filtering
 * Validation được xử lý bởi middleware
 */
export const getAllFabricCustomers = async (req, res, next) => {
  try {
    const queryParams = buildQueryParams(req.query, {
      filterFields: ['categoryId', 'colorId', 'glossId', 'thickness', 'width', 'length']
    });

    const result = await fabricCustomerService.getFabricCustomersWithFilters(queryParams);

    res.json({
      message: 'Lấy danh sách vải khách hàng thành công',
      ...result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get fabric customer detail
 * Validation được xử lý bởi middleware
 */
export const getFabricCustomerDetail = async (req, res, next) => {
  try {
    const { fabricCustomerId } = req.params;

    const fabricCustomer = await fabricCustomerService.getFabricCustomerDetail(fabricCustomerId);

    res.json({
      message: 'Lấy chi tiết vải khách hàng thành công',
      data: fabricCustomer
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get available filter options for fabric customers
 * Returns available options for categoryId, colorId, glossId, thickness, width, length
 * Validation được xử lý bởi middleware
 */
export const getFilterOptions = async (req, res, next) => {
  try {
    const { categoryId, colorId, glossId, thickness, width, length } = req.query;

    // Build the applied filters object
    const appliedFilters = {};
    if (categoryId) appliedFilters.categoryId = categoryId;
    if (colorId) appliedFilters.colorId = colorId;
    if (glossId) appliedFilters.glossId = glossId;
    if (thickness) appliedFilters.thickness = thickness;
    if (width) appliedFilters.width = width;
    if (length) appliedFilters.length = length;

    const filterOptions = await fabricCustomerService.getFilterOptions(appliedFilters);

    res.json({
      message: 'Lấy các tùy chọn lọc thành công',
      data: filterOptions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get fabric customers grouped by applied filters
 * When you apply filters, this will show you the grouped data
 * Validation được xử lý bởi middleware
 */
export const getGroupedFabricCustomers = async (req, res, next) => {
  try {
    const { categoryId, colorId, glossId, thickness, width, length, groupBy } = req.query;

    // Build the applied filters object
    const appliedFilters = {};
    if (categoryId) appliedFilters.categoryId = categoryId;
    if (colorId) appliedFilters.colorId = colorId;
    if (glossId) appliedFilters.glossId = glossId;
    if (thickness) appliedFilters.thickness = thickness;
    if (width) appliedFilters.width = width;
    if (length) appliedFilters.length = length;

    // Parse groupBy parameter (e.g., "categoryId,colorId")
    const groupByFields = groupBy ? groupBy.split(',').map(f => f.trim()) : [];

    const groupedData = await fabricCustomerService.getGroupedData(appliedFilters, groupByFields);

    res.json({
      message: 'Lấy dữ liệu vải khách hàng được nhóm thành công',
      data: groupedData
    });
  } catch (error) {
    next(error);
  }
};
