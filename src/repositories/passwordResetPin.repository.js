import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class PasswordResetPinRepository {
  async createPin({ userId, pinHash, expiresAt }) {
    return prisma.passwordResetPin.create({
      data: { userId, pinHash, expiresAt }
    });
  }

  async findLatestActiveByUser(userId) {
    return prisma.passwordResetPin.findFirst({
      where: {
        userId,
        used: false,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async markUsed(id) {
    return prisma.passwordResetPin.update({
      where: { id },
      data: { used: true }
    });
  }

  async incrementAttempts(id) {
    return prisma.passwordResetPin.update({
      where: { id },
      data: { attemptCount: { increment: 1 } }
    });
  }

  async invalidatePinsForUser(userId) {
    return prisma.passwordResetPin.updateMany({
      where: {
        userId,
        used: false,
        expiresAt: { gt: new Date() }
      },
      data: { used: true }
    });
  }

  async markVerified(id) {
    return prisma.passwordResetPin.update({
      where: { id },
      data: { verified: true }
    });
  }

  async findLatestVerifiedByUser(userId) {
    return prisma.passwordResetPin.findFirst({
      where: {
        userId,
        verified: true,
        used: false,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}

export const passwordResetPinRepository = new PasswordResetPinRepository();
