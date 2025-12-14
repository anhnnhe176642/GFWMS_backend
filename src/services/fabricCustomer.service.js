import { fabricCustomerRepository } from '../repositories/fabricCustomer.repository.js';
import { ValidationError } from '../utils/errors.js';

export class FabricCustomerService {
  /**
   * Get all fabric customers with filters and pagination
   */
  async getAllFabricCustomers(queryParams = {}) {
    return await fabricCustomerRepository.findAll(queryParams);
  }

  /**
   * Get fabric customer detail
   */
  async getFabricCustomerDetail(id) {
    if (!id) {
      throw new ValidationError('ID vải khách hàng là bắt buộc');
    }

    return await fabricCustomerRepository.findById(id);
  }

  /**
   * Get available filter options based on applied filters
   * @param {Object} appliedFilters - The filters already applied (categoryId, colorId, etc.)
   * @returns {Object} Available options for each filter field
   */
  async getFilterOptions(appliedFilters = {}) {
    return await fabricCustomerRepository.getFilterOptions(appliedFilters);
  }

  /**
   * Get grouped fabric customer data
   * @param {Object} appliedFilters - The filters to apply
   * @param {Array} groupBy - Fields to group by (e.g., ['category', 'color'])
   * @returns {Array} Grouped data
   */
  async getGroupedData(appliedFilters = {}, groupBy = []) {
    return await fabricCustomerRepository.getGroupedData(appliedFilters, groupBy);
  }

  /**
   * Get fabric customers with filter metadata
   * This returns both the list and available filter options
   */
  async getFabricCustomersWithFilters(queryParams = {}) {
    const {
      filters = {},
      search,
      sort,
      page = 1,
      limit = 20
    } = queryParams;

    // Get the paginated list
    const listResult = await this.getAllFabricCustomers({
      search,
      filters,
      sort,
      page,
      limit
    });

    // Get available filter options based on applied filters
    const filterOptions = await this.getFilterOptions(filters);

    // Determine which fields are grouped by (fields that have filters applied)
    const groupByFields = Object.keys(filters).filter(key => filters[key]);

    // Get grouped data if groupByFields is not empty
    let groupedData = null;
    if (groupByFields.length > 0) {
      const groupFieldMapping = {
        'categoryId': 'categoryId',
        'colorId': 'colorId',
        'glossId': 'glossId'
      };

      const groupBy = groupByFields
        .map(f => groupFieldMapping[f] || f)
        .filter(f => f);

      if (groupBy.length > 0) {
        groupedData = await this.getGroupedData(filters, groupBy);
      }
    }

    return {
      data: listResult.data,
      pagination: listResult.pagination,
      filters: filterOptions,
      grouped: groupedData
    };
  }
}

export const fabricCustomerService = new FabricCustomerService();
