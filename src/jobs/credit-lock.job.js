import { PrismaClient } from '@prisma/client';
import { differenceInDays, format } from 'date-fns';
import { sendCreditLockedNotification } from '../utils/mailer.js';

const OVERDUE_LOCK_DAYS = 7;
const prisma = new PrismaClient();

export const autoLockCreditOverdue = async () => {
  try {
    console.log("Running credit auto lock job...");

    const today = new Date();

    const overdueInvoices = await prisma.creditInvoice.findMany({
      where: {
        status: "OVERDUE",
        credit: {
          isLocked: false
        }
      },
      include: {
        credit: {
          include: {
            user: true
          }
        }
      }
    });

    for (const inv of overdueInvoices) {

      const overdueDays = differenceInDays(today, new Date(inv.dueDate));

      if (!inv.credit.isLocked && overdueDays >= OVERDUE_LOCK_DAYS) {

        await prisma.creditRegistration.update({
          where: { id: inv.creditId },
          data: { isLocked: true }
        });

        console.log(
          `Credit locked for user ${inv.credit.userId} | Invoice #${inv.id} overdue ${overdueDays} days`
        );

        if (inv.credit?.user?.email) {

          await sendCreditLockedNotification(
            inv.credit.user.email,
            inv.id,
            overdueDays,
            format(inv.dueDate, "dd/MM/yyyy")
          );

          console.log(`Lock email sent to ${inv.credit.user.email}`);
        } else {
          console.log(` User ${inv.credit.userId} has no email — cannot send notification`);
        }
      }
    }
  } catch (error) {
    console.error("Error locking overdue credits: ", error);
  }
};
