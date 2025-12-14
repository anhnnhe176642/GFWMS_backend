import { PrismaClient } from '@prisma/client';
import { withPrismaErrorHandling } from '../utils/prisma-error-handler.js';

const prisma = new PrismaClient();

export class WarehouseManagerRepository {
  /**
   * Get all warehouses assigned to a user
   * @param {string} userId
   * @returns {Promise<Array>}
   */
  async getUserWarehouses(userId) {
    return await prisma.warehouseManage.findMany({
      where: { userId },
      include: {
        warehouse: {
          select: {
            id: true,
            name: true,
            address: true,
            createdAt: true,
            updatedAt: true
          }
        },
        assignedUser: {
          select: {
            id: true,
            username: true,
            fullname: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  /**
   * Get all managers assigned to a warehouse
   * @param {number} warehouseId
   * @returns {Promise<Array>}
   */
  async getWarehouseManagers(warehouseId) {
    return await prisma.warehouseManage.findMany({
      where: { warehouseId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullname: true,
            email: true,
            phone: true,
            status: true
          }
        },
        assignedUser: {
          select: {
            id: true,
            username: true,
            fullname: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  /**
   * Check if user is assigned to a warehouse
   * @param {string} userId
   * @param {number} warehouseId
   * @returns {Promise<boolean>}
   */
  async isUserAssignedToWarehouse(userId, warehouseId) {
    const result = await prisma.warehouseManage.findUnique({
      where: {
        userId_warehouseId: {
          userId,
          warehouseId
        }
      }
    });

    return !!result;
  }

  /**
   * Get warehouse IDs for a user
   * @param {string} userId
   * @returns {Promise<Array<number>>}
   */
  async getUserWarehouseIds(userId) {
    const warehouses = await prisma.warehouseManage.findMany({
      where: { userId },
      select: {
        warehouseId: true
      }
    });

    return warehouses.map(w => w.warehouseId);
  }

  /**
   * Batch assign warehouses to a user
   * @param {string} userId
   * @param {Array<number>} warehouseIds
   * @param {string} assignedBy
   * @returns {Promise<Object>}
   */
  async assignMultipleWarehousesToUser(userId, warehouseIds, assignedBy) {
    const results = {
      count: 0,
      failed: [],
      successful: []
    };

    for (const warehouseId of warehouseIds) {
      try {
        const existingAssignment = await prisma.warehouseManage.findUnique({
          where: {
            userId_warehouseId: {
              userId,
              warehouseId
            }
          }
        });

        if (!existingAssignment) {
          await withPrismaErrorHandling(() =>
            prisma.warehouseManage.create({
              data: {
                userId,
                warehouseId,
                assignedBy
              }
            })
          );
          results.count++;
          results.successful.push(warehouseId);
        }
      } catch (error) {
        results.failed.push({ warehouseId, error: error.message });
      }
    }

    return results;
  }

  /**
   * Remove all warehouses from a user
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  async removeAllWarehousesFromUser(userId) {
    return await withPrismaErrorHandling(() =>
      prisma.warehouseManage.deleteMany({
        where: { userId }
      })
    );
  }
}

export const warehouseManagerRepository = new WarehouseManagerRepository();
