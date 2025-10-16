import { PrismaClient } from '@prisma/client';
import { withPrismaErrorHandling } from '../utils/prisma-error-handler.js';

const prisma = new PrismaClient();

export class EmailVerificationRepository {
  async createPin({ userId, pinHash, expiresAt }) {
    return await withPrismaErrorHandling(
      () => prisma.emailVerificationPin.create({
        data: { userId, pinHash, expiresAt }
      }),
      {}
    );
  }

  async findLatestActiveByUser(userId) {
    return await prisma.emailVerificationPin.findFirst({
      where: {
        userId,
        usedAt: null,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findActiveByUserAndPinHash(userId, pinHash) {
    return await prisma.emailVerificationPin.findFirst({
      where: {
        userId,
        pinHash,
        usedAt: null,
        expiresAt: { gt: new Date() }
      }
    });
  }

  async incrementAttempts(id) {
    return await withPrismaErrorHandling(
      () => prisma.emailVerificationPin.update({
        where: { id },
        data: { attempts: { increment: 1 } }
      }),
      {}
    );
  }

  async markUsed(id) {
    return await withPrismaErrorHandling(
      () => prisma.emailVerificationPin.update({
        where: { id },
        data: { usedAt: new Date() }
      }),
      {}
    );
  }

  async invalidatePinsForUser(userId) {
    return await withPrismaErrorHandling(
      () => prisma.emailVerificationPin.updateMany({
        where: { userId, usedAt: null },
        data: { usedAt: new Date() }
      }),
      {}
    );
  }
}

export const emailVerificationRepository = new EmailVerificationRepository();
