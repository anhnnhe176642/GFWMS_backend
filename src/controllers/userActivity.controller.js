import { userActivityService } from '../services/userActivity.service.js';

/**
 * Get comprehensive user statistics
 */
export const getUserStats = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    const stats = await userActivityService.getComprehensiveUserStats(userId);
    
    res.json({
      message: 'Lấy thống kê người dùng toàn diện thành công',
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get dashboard metrics for user
 */
export const getDashboardMetrics = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    const metrics = await userActivityService.getDashboardMetrics(userId);
    
    res.json({
      message: 'Lấy metrics dashboard thành công',
      data: metrics
    });
  } catch (error) {
    next(error);
  }
};
