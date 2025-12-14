import { PrismaClient } from '@prisma/client';
import { withPrismaErrorHandling } from '../utils/prisma-error-handler.js';
import { NotFoundError } from '../utils/errors.js';

const prisma = new PrismaClient();

export class UserStoreRepository {
  /**
   * Assign a store to a user (add manager)
   * @param {string} userId
   * @param {number} storeId
   * @returns {Promise<Object>} UserStore object
   */
  async assignStoreToUser(userId, storeId) {
    return await withPrismaErrorHandling(() =>
      prisma.userStore.create({
        data: {
          userId,
          storeId
        },
        include: {
          store: {
            select: {
              id: true,
              name: true,
              address: true
            }
          }
        }
      }),
      {
        P2002: `User đã được assign cho cửa hàng này`
      }
    );
  }

  /**
   * Remove a store from a user (remove manager)
   * @param {string} userId
   * @param {number} storeId
   * @returns {Promise<Object>}
   */
  async removeStoreFromUser(userId, storeId) {
    const userStore = await prisma.userStore.findUnique({
      where: {
        userId_storeId: {
          userId,
          storeId
        }
      }
    });

    if (!userStore) {
      throw new NotFoundError('Không tìm thấy quan hệ User-Store');
    }

    return await withPrismaErrorHandling(() =>
      prisma.userStore.delete({
        where: {
          userId_storeId: {
            userId,
            storeId
          }
        },
        include: {
          store: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })
    );
  }

  /**
   * Get all stores assigned to a user
   * @param {string} userId
   * @returns {Promise<Array>}
   */
  async getUserStores(userId) {
    return await prisma.userStore.findMany({
      where: { userId },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            address: true,
            isActive: true,
            createdAt: true,
            updatedAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  /**
   * Get all managers assigned to a store
   * @param {number} storeId
   * @returns {Promise<Array>}
   */
  async getStoreManagers(storeId) {
    return await prisma.userStore.findMany({
      where: { storeId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            fullname: true,
            status: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  /**
   * Check if user is assigned to store
   * @param {string} userId
   * @param {number} storeId
   * @returns {Promise<boolean>}
   */
  async isUserAssignedToStore(userId, storeId) {
    const userStore = await prisma.userStore.findUnique({
      where: {
        userId_storeId: {
          userId,
          storeId
        }
      }
    });

    return !!userStore;
  }

  /**
   * Assign multiple stores to a user
   * @param {string} userId
   * @param {Array<number>} storeIds
   * @returns {Promise<Array>}
   */
  async assignMultipleStoresToUser(userId, storeIds) {
    // Remove duplicates
    const uniqueStoreIds = [...new Set(storeIds)];

    // Get existing assignments
    const existingAssignments = await prisma.userStore.findMany({
      where: { userId }
    });

    const existingStoreIds = existingAssignments.map(a => a.storeId);

    // Find new stores to add and old stores to remove
    const storesToAdd = uniqueStoreIds.filter(id => !existingStoreIds.includes(id));
    const storesToRemove = existingStoreIds.filter(id => !uniqueStoreIds.includes(id));

    // Remove old assignments
    if (storesToRemove.length > 0) {
      await prisma.userStore.deleteMany({
        where: {
          userId,
          storeId: { in: storesToRemove }
        }
      });
    }

    // Add new assignments
    if (storesToAdd.length > 0) {
      await prisma.userStore.createMany({
        data: storesToAdd.map(storeId => ({
          userId,
          storeId
        })),
        skipDuplicates: true
      });
    }

    // Return updated list
    return await this.getUserStores(userId);
  }

  /**
   * Remove all stores from a user
   * @param {string} userId
   * @returns {Promise<void>}
   */
  async removeAllStoresFromUser(userId) {
    await prisma.userStore.deleteMany({
      where: { userId }
    });
  }

  /**
   * Remove all managers from a store
   * @param {number} storeId
   * @returns {Promise<void>}
   */
  async removeAllManagersFromStore(storeId) {
    await prisma.userStore.deleteMany({
      where: { storeId }
    });
  }
}

export const userStoreRepository = new UserStoreRepository();
