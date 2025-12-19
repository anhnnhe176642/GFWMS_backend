import { PrismaClient } from '@prisma/client';
import { differenceInDays, format } from 'date-fns';
import {
  sendInvoiceOverdueReminder,
  sendCreditLockedNotification
} from '../utils/mailer.js';

const prisma = new PrismaClient();

/**
 * Cấu hình
 */
const REMIND_BEFORE_DAYS = 5; // nhắc trước hạn 5 ngày
const MAX_REMINDER = 5;       // tối đa 5 mail

export const handleCreditOverdue = async () => {
  try {
    console.log('Running credit before-due reminder job...');

    const now = new Date();

    /**
     * Lấy các invoice chưa thanh toán
     */
    const invoices = await prisma.creditInvoice.findMany({
      where: {
        status: {
          in: ['PENDING', 'OVERDUE']
        }
      },
      include: {
        credit: {
          include: { user: true }
        }
      }
    });

    /**
     * Gom invoice theo credit
     * → lấy ngày gần hạn nhất
     */
    const creditMap = new Map();

    for (const inv of invoices) {
      const dueDate = new Date(inv.dueDate);
      const daysBeforeDue = differenceInDays(dueDate, now);
      console.log({
        invoiceId: inv.id,
        dueDate,
        now,
        daysBeforeDue
      });

      // Đã quá hạn → job khác xử lý
      if (daysBeforeDue < 0) continue;

      // Chưa tới mốc nhắc
      if (daysBeforeDue > REMIND_BEFORE_DAYS) continue;

      const credit = inv.credit;
      if (!credit) continue;

      if (!creditMap.has(credit.id)) {
        creditMap.set(credit.id, {
          credit,
          minDaysBeforeDue: daysBeforeDue,
          invoices: []
        });
      }

      const entry = creditMap.get(credit.id);
      entry.minDaysBeforeDue = Math.min(
        entry.minDaysBeforeDue,
        daysBeforeDue
      );
      entry.invoices.push(inv);
    }

    /**
     * Xử lý từng credit
     */
    for (const { credit, minDaysBeforeDue, invoices } of creditMap.values()) {
      const user = credit.user;
      const reminderCount = credit.reminderCount ?? 0;

      console.log({
        creditId: credit.id,
        email: user?.email,
        daysBeforeDue: minDaysBeforeDue,
        reminderCount,
        isLocked: credit.isLocked
      });

      if (!user?.email) continue;

      /**
       * GỬI MAIL NHẮC TRƯỚC HẠN
       */
      if (!credit.isLocked && reminderCount < MAX_REMINDER) {
        await sendInvoiceOverdueReminder(
          user.email,
          credit.id,
          minDaysBeforeDue
        );

        await prisma.creditRegistration.update({
          where: { id: credit.id },
          data: {
            reminderCount: { increment: 1 }
          }
        });

        console.log(
          `Reminder ${reminderCount + 1}/${MAX_REMINDER} sent | Credit ${credit.id}`
        );

        continue;
      }

      /**
       * KHÓA CREDIT SAU KHI NHẮC ĐỦ SỐ LẦN
       */
      if (!credit.isLocked && reminderCount >= MAX_REMINDER) {
        await prisma.creditRegistration.update({
          where: { id: credit.id },
          data: { isLocked: true }
        });

        const nearestInvoice = invoices[0];

        await sendCreditLockedNotification(
          user.email,
          credit.id,
          minDaysBeforeDue,
          format(nearestInvoice.dueDate, 'dd/MM/yyyy')
        );

        console.log(
          `Credit LOCKED | Credit ${credit.id} | User ${user.id}`
        );
      }
    }

  } catch (error) {
    console.error('Error in credit before-due reminder job:', error);
  }
};
