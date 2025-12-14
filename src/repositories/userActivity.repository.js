import { PrismaClient } from '@prisma/client';
import { withPrismaErrorHandling } from '../utils/prisma-error-handler.js';

const prisma = new PrismaClient();

export class UserActivityRepository {
  /**
   * Create a new user activity record (Polymorphic)
   */
  async createActivity(data) {
    return await withPrismaErrorHandling(
      () => prisma.userActivity.create({
        data: {
          userId: data.userId,
          activityType: data.activityType,
          entityType: data.entityType,
          entityId: data.entityId,
          description: data.description,
          metadata: data.metadata,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              fullname: true,
            }
          }
        }
      })
    );
  }

  /**
   * Get user's activity history with pagination
   */
  async getUserActivityHistory(userId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [activities, total] = await Promise.all([
      withPrismaErrorHandling(
        () => prisma.userActivity.findMany({
          where: { userId },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                fullname: true,
              }
            }
          }
        })
      ),
      withPrismaErrorHandling(
        () => prisma.userActivity.count({ where: { userId } })
      )
    ]);

    return {
      data: activities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get user's activity statistics by type
   */
  async getUserActivityStats(userId) {
    const activities = await withPrismaErrorHandling(
      () => prisma.userActivity.findMany({
        where: { userId },
        select: { activityType: true }
      })
    );

    const stats = {};
    for (const activity of activities) {
      stats[activity.activityType] = (stats[activity.activityType] || 0) + 1;
    }

    return stats;
  }

  /**
   * Get user's recent activities by type
   */
  async getRecentActivitiesByType(userId, activityType, limit = 10) {
    return await withPrismaErrorHandling(
      () => prisma.userActivity.findMany({
        where: {
          userId,
          activityType
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              fullname: true,
            }
          }
        }
      })
    );
  }

  /**
   * Get all activities of a specific entity type within a date range
   */
  async getActivitiesByDateRange(userId, startDate, endDate, activityType = null) {
    const where = {
      userId,
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    };

    if (activityType) {
      where.activityType = activityType;
    }

    return await withPrismaErrorHandling(
      () => prisma.userActivity.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              fullname: true,
            }
          }
        }
      })
    );
  }

  /**
   * Get activities by entity (e.g., all activities related to an order)
   */
  async getActivitiesByEntity(entityType, entityId) {
    return await withPrismaErrorHandling(
      () => prisma.userActivity.findMany({
        where: {
          entityType,
          entityId
        },
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              fullname: true,
            }
          }
        }
      })
    );
  }

  /**
   * Delete old activities (for cleanup)
   */
  async deleteOldActivities(olderThanDays = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    return await withPrismaErrorHandling(
      () => prisma.userActivity.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate
          }
        }
      })
    );
  }
}

export const userActivityRepository = new UserActivityRepository();
