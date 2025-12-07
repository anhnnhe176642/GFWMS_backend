import prisma from '../utils/prisma.js';
import { isAfter, differenceInDays } from 'date-fns';
import { sendInvoiceOverdueReminder } from '../utils/mail.js';

export const checkCreditInvoices = async () => {
  try {
    console.log("Running credit invoice cron...");

    const today = new Date();

    const pendingInvoices = await prisma.creditInvoice.findMany({
      where: { status: "PENDING" },
      include: {
        credit: {
          include: { user: true }
        }
      }
    });

    const creditMap = new Map();

    for (const inv of pendingInvoices) {
      const dueDate = new Date(inv.dueDate);

      if (isAfter(today, dueDate)) {
        const overdueDays = differenceInDays(today, dueDate);
        const creditId = inv.creditId;
        const user = inv.credit.user;

        if (!creditMap.has(creditId)) {
          creditMap.set(creditId, {
            creditId,
            userId: user.id,
            userEmail: user.email,
            overdueDays,  
            invoices: []
          });
        }

        creditMap.get(creditId).invoices.push({
          invoiceId: inv.id,
          dueDate: inv.dueDate,
          overdueDays
        });
      }
    }

    const overdueList = Array.from(creditMap.values());

    for (const entry of overdueList) {
      if (!entry.userEmail) {
        console.log(` User ${entry.userId} has no email, skipping creditId ${entry.creditId}`);
        continue;
      }

      await sendInvoiceOverdueReminder(
        entry.userEmail,
        entry.creditId,
        entry.overdueDays
      );

      console.log(
        `Email sent to ${entry.userEmail} for creditId ${entry.creditId} (overdue ${entry.overdueDays} days)`
      );
    }

    return overdueList;

  } catch (error) {
    console.error("Error checking credit invoices: ", error);
  }
};
