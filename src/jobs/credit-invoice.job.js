import { PrismaClient } from '@prisma/client';
import { isAfter, differenceInDays, format } from 'date-fns';
import {
  sendInvoiceOverdueReminder,
  sendCreditLockedNotification
} from '../utils/mailer.js';

const prisma = new PrismaClient();

const OVERDUE_DAYS = 1;      // bắt đầu nhắc sau 1 ngày
const MAX_REMINDER = 5;      // gửi tối đa 5 mail

export const handleCreditOverdue = async () => {
  try {
    console.log("Running credit overdue job...");

    const now = new Date();

    const invoices = await prisma.creditInvoice.findMany({
      where: {
        status: {
          in: ["PENDING", "OVERDUE"]
        }
      },
      include: {
        credit: {
          include: { user: true }
        }
      }
    });

    const creditMap = new Map();

    for (const inv of invoices) {
      const dueDate = new Date(inv.dueDate);

      if (!isAfter(now, dueDate)) continue;

      const overdueDays = differenceInDays(now, dueDate);
      if (overdueDays < OVERDUE_DAYS) continue;

      const credit = inv.credit;

      if (!creditMap.has(credit.id)) {
        creditMap.set(credit.id, {
          credit,
          maxOverdueDays: overdueDays,
          invoices: []
        });
      }

      const entry = creditMap.get(credit.id);
      entry.maxOverdueDays = Math.max(
        entry.maxOverdueDays,
        overdueDays
      );
      entry.invoices.push(inv);
    }

    // ===== XỬ LÝ TỪNG CREDIT =====
    for (const { credit, maxOverdueDays, invoices } of creditMap.values()) {
      const user = credit.user;
      const reminderCount = credit.reminderCount ?? 0;

      console.log({
        creditId: credit.id,
        email: user?.email,
        overdueDays: maxOverdueDays,
        reminderCount,
        isLocked: credit.isLocked
      });

      if (!user?.email) continue;

      /** GỬI MAIL NHẮC NỢ */
      if (!credit.isLocked && reminderCount < MAX_REMINDER) {

        await sendInvoiceOverdueReminder(
          user.email,
          credit.id,
          maxOverdueDays
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

      /** Khóa tài khoản */
      if (!credit.isLocked && reminderCount >= MAX_REMINDER) {

        await prisma.creditRegistration.update({
          where: { id: credit.id },
          data: { isLocked: true }
        });

        const firstInvoice = invoices[0];

        await sendCreditLockedNotification(
          user.email,
          credit.id,
          maxOverdueDays,
          format(firstInvoice.dueDate, "dd/MM/yyyy")
        );

        console.log(
          `Credit LOCKED | Credit ${credit.id} | User ${user.id}`
        );
      }
    }

  } catch (error) {
    console.error("Error in credit overdue job:", error);
  }
};
