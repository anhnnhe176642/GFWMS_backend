import { dashboardRepository } from '../repositories/dashboard.repository.js';
import { ValidationError } from '../utils/errors.js';

export class DashboardService {

  /**
   * Validate date range filters
   */
  #validateDateRange(startDate, endDate) {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new ValidationError('Định dạng ngày không hợp lệ');
      }
      
      if (start > end) {
        throw new ValidationError('Ngày bắt đầu phải nhỏ hơn ngày kết thúc');
      }
    }
  }

  /**
   * Get dashboard overview with all key metrics
   */
  async getDashboardOverview(filters = {}) {
    this.#validateDateRange(filters.startDate, filters.endDate);
    return await dashboardRepository.getDashboardOverview(filters);
  }

  /**
   * Get total revenue statistics
   */
  async getTotalRevenue(filters = {}) {
    this.#validateDateRange(filters.startDate, filters.endDate);
    return await dashboardRepository.getTotalRevenue(filters);
  }

  /**
   * Get revenue by period (day/month/year)
   */
  async getRevenueByPeriod(period = 'day', filters = {}) {
    this.#validateDateRange(filters.startDate, filters.endDate);
    
    const validPeriods = ['day', 'month', 'year'];
    if (!validPeriods.includes(period)) {
      throw new ValidationError('Kỳ thống kê phải là: day, month, year');
    }
    
    return await dashboardRepository.getRevenueByPeriod(period, filters);
  }

  /**
   * Get revenue by fabric category
   */
  async getRevenueByCategory(filters = {}) {
    this.#validateDateRange(filters.startDate, filters.endDate);
    return await dashboardRepository.getRevenueByCategory(filters);
  }

  /**
   * Get revenue by color
   */
  async getRevenueByColor(filters = {}) {
    this.#validateDateRange(filters.startDate, filters.endDate);
    return await dashboardRepository.getRevenueByColor(filters);
  }

  /**
   * Get revenue by store
   */
  async getRevenueByStore(filters = {}) {
    this.#validateDateRange(filters.startDate, filters.endDate);
    return await dashboardRepository.getRevenueByStore(filters);
  }

  /**
   * Get profit statistics (gross, net, margin)
   */
  async getProfitStatistics(filters = {}) {
    this.#validateDateRange(filters.startDate, filters.endDate);
    return await dashboardRepository.getProfitStatistics(filters);
  }

  /**
   * Get profit by product
   */
  async getProfitByProduct(filters = {}) {
    this.#validateDateRange(filters.startDate, filters.endDate);
    return await dashboardRepository.getProfitByProduct(filters);
  }

  /**
   * Get order statistics
   */
  async getOrderStatistics(filters = {}) {
    this.#validateDateRange(filters.startDate, filters.endDate);
    return await dashboardRepository.getOrderStatistics(filters);
  }

  /**
   * Get daily orders with details
   */
  async getDailyOrders(filters = {}) {
    this.#validateDateRange(filters.startDate, filters.endDate);
    return await dashboardRepository.getDailyOrders(filters);
  }

  /**
   * Get top customers by purchase
   */
  async getTopCustomers(filters = {}) {
    this.#validateDateRange(filters.startDate, filters.endDate);
    return await dashboardRepository.getTopCustomers(filters);
  }

  /**
   * Get purchase frequency statistics
   */
  async getPurchaseFrequency(filters = {}) {
    this.#validateDateRange(filters.startDate, filters.endDate);
    return await dashboardRepository.getPurchaseFrequency(filters);
  }

  /**
   * Get low stock fabrics
   */
  async getLowStockFabrics(filters = {}) {
    return await dashboardRepository.getLowStockFabrics(filters);
  }

  /**
   * Get low stock by category and color
   */
  async getLowStockByCategory(filters = {}) {
    return await dashboardRepository.getLowStockByCategory(filters);
  }

  /**
   * Get sales by day with detailed breakdown
   */
  async getSalesByDay(filters = {}) {
    this.#validateDateRange(filters.startDate, filters.endDate);
    return await dashboardRepository.getSalesByDay(filters);
  }

  /**
   * Get comprehensive dashboard data with all statistics
   */
  async getFullDashboard(filters = {}) {
    this.#validateDateRange(filters.startDate, filters.endDate);

    const [
      overview,
      revenueByPeriod,
      revenueByCategory,
      revenueByStore,
      profitStats,
      orderStats,
      topCustomers,
      purchaseFrequency,
      lowStock
    ] = await Promise.all([
      dashboardRepository.getDashboardOverview(filters),
      dashboardRepository.getRevenueByPeriod(filters.period || 'day', filters),
      dashboardRepository.getRevenueByCategory(filters),
      dashboardRepository.getRevenueByStore(filters),
      dashboardRepository.getProfitStatistics(filters),
      dashboardRepository.getOrderStatistics(filters),
      dashboardRepository.getTopCustomers(filters),
      dashboardRepository.getPurchaseFrequency(filters),
      dashboardRepository.getLowStockFabrics(filters)
    ]);

    return {
      overview,
      revenue: {
        byPeriod: revenueByPeriod,
        byCategory: revenueByCategory,
        byStore: revenueByStore
      },
      profit: profitStats,
      orders: orderStats,
      customers: {
        topCustomers,
        purchaseFrequency
      },
      inventory: {
        lowStockAlerts: lowStock
      }
    };
  }
}

export const dashboardService = new DashboardService();
