import {
  getUserById,
  getNotifyRecurringEmail,
  getNotifyBudgetEmail,
  markBudgetNotified,
  type AutoLoggedTransaction,
  type BudgetRow,
} from "@/lib/db";
import { sendEmail, recurringLoggedEmailHtml, budgetOverLimitEmailHtml } from "@/lib/email";
import { computeEffectiveBudgetLimit } from "@/lib/budget-rollover";
import { monthKey, todayInputValue } from "@/lib/format";
import type { Expense } from "@/types/expense";

// Fires opt-in email notifications for events that just happened during this
// page load — there's no cron worker in this deployment, so "just happened"
// really means "since the last time this user opened the app". Best-effort:
// failures are swallowed so a broken/missing RESEND_API_KEY never blocks the
// dashboard from rendering.
export async function sendPendingNotifications(
  userId: number,
  loggedRecurring: AutoLoggedTransaction[],
  budgetRows: BudgetRow[],
  expenses: Expense[],
  currency: string,
): Promise<void> {
  try {
    const user = await getUserById(userId);
    if (!user?.email) return;

    const [notifyRecurring, notifyBudget] = await Promise.all([
      getNotifyRecurringEmail(userId),
      getNotifyBudgetEmail(userId),
    ]);

    if (notifyRecurring && loggedRecurring.length > 0) {
      await sendEmail(
        user.email,
        `Tally logged ${loggedRecurring.length} recurring transaction${loggedRecurring.length === 1 ? "" : "s"}`,
        recurringLoggedEmailHtml(loggedRecurring, currency),
      );
    }

    if (notifyBudget) {
      const currentMonthKey = monthKey(todayInputValue());
      for (const b of budgetRows) {
        if (b.notified_alert_month === currentMonthKey) continue;
        const budget = {
          category: b.category,
          monthlyLimit: Number(b.monthly_limit),
          rollover: b.rollover,
        };
        const limit = computeEffectiveBudgetLimit(
          expenses.map((e) => ({ type: e.type, category: e.category, date: e.date, amount: e.amount })),
          budget,
          currentMonthKey,
        );
        const spent = expenses
          .filter((e) => e.type === "expense" && e.category === b.category && monthKey(e.date) === currentMonthKey)
          .reduce((sum, e) => sum + e.amount, 0);
        if (limit > 0 && spent >= limit) {
          await sendEmail(user.email, `Over budget: ${b.category}`, budgetOverLimitEmailHtml(b.category, spent, limit, currency));
          await markBudgetNotified(userId, b.id, currentMonthKey);
        }
      }
    }
  } catch {
    // Best-effort — never let a notification failure break the dashboard load.
  }
}
