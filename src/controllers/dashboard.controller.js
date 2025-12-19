import { dashboardService } from '../services/dashboard.service.js';

/**
 * Get dashboard overview
 */
export const getDashboardOverview = async (req, res, next) => {
  try {
    const { startDate, endDate, storeId } = req.query;
    const data = await dashboardService.getDashboardOverview({ startDate, endDate, storeId });
    
    res.json({
      message: 'Lấy tổng quan dashboard thành công',
      data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get full dashboard with all statistics
 */
export const getFullDashboard = async (req, res, next) => {
  try {
    const { startDate, endDate, storeId, period } = req.query;
    const data = await dashboardService.getFullDashboard({ startDate, endDate, storeId, period });
    
    res.json({
      message: 'Lấy toàn bộ dữ liệu dashboard thành công',
      data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get total revenue
 */
export const getTotalRevenue = async (req, res, next) => {
  try {
    const { startDate, endDate, storeId } = req.query;
    const data = await dashboardService.getTotalRevenue({ startDate, endDate, storeId });
    
    res.json({
      message: 'Lấy tổng doanh thu thành công',
      data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get revenue by period (day/month/year)
 */
export const getRevenueByPeriod = async (req, res, next) => {
  try {
    const { period = 'day', startDate, endDate, storeId } = req.query;
    const data = await dashboardService.getRevenueByPeriod(period, { startDate, endDate, storeId });
    
    res.json({
      message: `Lấy doanh thu theo ${period === 'day' ? 'ngày' : period === 'month' ? 'tháng' : 'năm'} thành công`,
      data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get revenue by fabric category
 */
export const getRevenueByCategory = async (req, res, next) => {
  try {
    const { startDate, endDate, storeId } = req.query;
    const data = await dashboardService.getRevenueByCategory({ startDate, endDate, storeId });
    
    res.json({
      message: 'Lấy doanh thu theo loại vải thành công',
      data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get revenue by color
 */
export const getRevenueByColor = async (req, res, next) => {
  try {
    const { startDate, endDate, storeId } = req.query;
    const data = await dashboardService.getRevenueByColor({ startDate, endDate, storeId });
    
    res.json({
      message: 'Lấy doanh thu theo màu sắc thành công',
      data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get revenue by store
 */
export const getRevenueByStore = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await dashboardService.getRevenueByStore({ startDate, endDate });
    
    res.json({
      message: 'Lấy doanh thu theo cửa hàng thành công',
      data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get profit statistics
 */
export const getProfitStatistics = async (req, res, next) => {
  try {
    const { startDate, endDate, storeId } = req.query;
    const data = await dashboardService.getProfitStatistics({ startDate, endDate, storeId });
    
    res.json({
      message: 'Lấy thống kê lợi nhuận thành công',
      data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get profit by product
 */
export const getProfitByProduct = async (req, res, next) => {
  try {
    const { startDate, endDate, storeId, limit } = req.query;
    const data = await dashboardService.getProfitByProduct({ startDate, endDate, storeId, limit });
    
    res.json({
      message: 'Lấy lợi nhuận theo sản phẩm thành công',
      data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get order statistics
 */
export const getOrderStatistics = async (req, res, next) => {
  try {
    const { startDate, endDate, storeId } = req.query;
    const data = await dashboardService.getOrderStatistics({ startDate, endDate, storeId });
    
    res.json({
      message: 'Lấy thống kê đơn hàng thành công',
      data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get daily orders
 */
export const getDailyOrders = async (req, res, next) => {
  try {
    const { startDate, endDate, storeId } = req.query;
    const data = await dashboardService.getDailyOrders({ startDate, endDate, storeId });
    
    res.json({
      message: 'Lấy đơn hàng theo ngày thành công',
      data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get top customers
 */
export const getTopCustomers = async (req, res, next) => {
  try {
    const { startDate, endDate, storeId, limit } = req.query;
    const data = await dashboardService.getTopCustomers({ startDate, endDate, storeId, limit });
    
    res.json({
      message: 'Lấy top khách hàng thành công',
      data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get purchase frequency
 */
export const getPurchaseFrequency = async (req, res, next) => {
  try {
    const { startDate, endDate, storeId } = req.query;
    const data = await dashboardService.getPurchaseFrequency({ startDate, endDate, storeId });
    
    res.json({
      message: 'Lấy tần suất mua hàng thành công',
      data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get low stock fabrics
 */
export const getLowStockFabrics = async (req, res, next) => {
  try {
    const { storeId, threshold } = req.query;
    const data = await dashboardService.getLowStockFabrics({ storeId, threshold });
    
    res.json({
      message: 'Lấy danh sách vải sắp hết thành công',
      data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get low stock by category
 */
export const getLowStockByCategory = async (req, res, next) => {
  try {
    const { storeId, threshold } = req.query;
    const data = await dashboardService.getLowStockByCategory({ storeId, threshold });
    
    res.json({
      message: 'Lấy vải sắp hết theo loại và màu thành công',
      data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get sales by day
 */
export const getSalesByDay = async (req, res, next) => {
  try {
    const { startDate, endDate, storeId } = req.query;
    const data = await dashboardService.getSalesByDay({ startDate, endDate, storeId });
    
    res.json({
      message: 'Lấy doanh số theo ngày thành công',
      data
    });
  } catch (error) {
    next(error);
  }
};
