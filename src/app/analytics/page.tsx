import {
  listExpenses,
  getRemaining,
  getConvertWalletBalances,
  listCategories,
  getCurrency,
  listWallets,
  listRecurringRules,
  getAnalyticsPrefs,
  processDueRecurringRules,
  processDueRecurringSplits,
  listBudgets,
  listSavingsGoals,
} from "@/lib/db";
import { after } from "next/server";
import { getUserId } from "@/lib/auth";
import { sendPendingNotifications } from "@/lib/notifications";
import { computeConvertedTotal } from "@/lib/wallet-conversion";
import AnalyticsPageView from "@/components/AnalyticsPage";
import { normalizeExpenseType, normalizeDirection, type Expense } from "@/types/expense";
import { isTransactionType } from "@/lib/categories";
import { toWalletOption } from "@/lib/wallet-mapper";
import type { CategoryOption } from "@/types/category";
import type { WalletOption } from "@/types/wallet";

// Always render fresh: the expense list changes on every write, and this
// also avoids the build needing a reachable database at build time.
export const dynamic = "force-dynamic";

// The fixed analytics view (period-driven spending trends, net worth,
// budgets/goals, forward-looking) — replaced the old customizable
// widget-grid dashboard. Formerly the root "/" page, moved here once
// Activities (the day-to-day transaction list) became the app's
// default landing page.
export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ add?: string }>;
}) {
  const { add } = await searchParams;
  const userId = await getUserId();
  const loggedRecurring = await processDueRecurringRules(userId);
  await processDueRecurringSplits(userId);
  const [rows, remaining, categoryRows, currency, walletRows, recurringRules, analyticsPrefs, budgetRows, savingsGoalRows, convertEnabled] =
    await Promise.all([
      listExpenses(userId),
      getRemaining(userId),
      listCategories(userId),
      getCurrency(userId),
      listWallets(userId),
      listRecurringRules(userId),
      getAnalyticsPrefs(userId),
      listBudgets(userId),
      listSavingsGoals(userId),
      getConvertWalletBalances(userId),
    ]);
  // Reuses the wallets/currency already fetched above instead of re-querying
  // them, and only touches the network (Frankfurter, with its own cache and
  // timeout — see lib/exchange-rate.ts) when the user has actually opted in.
  const convertedNetWorth = convertEnabled ? ((await computeConvertedTotal(walletRows, currency)) ?? remaining) : remaining;
  const budgets = budgetRows.map((b) => ({
    id: b.id,
    category: b.category,
    monthlyLimit: Number(b.monthly_limit),
    dismissedAlertMonth: b.dismissed_alert_month,
    rollover: b.rollover,
  }));
  const savingsGoals = savingsGoalRows.map((g) => ({
    id: g.id,
    name: g.name,
    color: g.color,
    targetAmount: Number(g.target_amount),
    currentAmount: Number(g.current_amount),
  }));
  const expenses: Expense[] = rows.map((r) => ({
    id: r.id,
    type: normalizeExpenseType(r.type),
    direction: normalizeDirection(r.direction),
    date: r.date,
    amount: Number(r.amount),
    merchant: r.merchant,
    category: r.category,
    notes: r.notes,
    tags: r.tags ?? [],
    hasReceipt: r.has_receipt,
    walletId: r.wallet_id,
    walletName: r.wallet_name,
    splitGroupId: r.split_group_id,
  }));
  const categories: CategoryOption[] = categoryRows.map((c) => ({
    id: c.id,
    type: isTransactionType(c.type) ? c.type : "expense",
    name: c.name,
    color: c.color,
    icon: c.icon,
  }));
  const wallets: WalletOption[] = walletRows.map(toWalletOption);

  // Scheduled to run after the response is sent, not awaited here — email
  // notifications (and the DB/Resend calls they involve) have no business
  // delaying the page render itself.
  after(() => sendPendingNotifications(userId, loggedRecurring, budgetRows, expenses, currency));

  return (
    <AnalyticsPageView
      initialExpenses={expenses}
      initialRemaining={remaining}
      convertedNetWorth={convertedNetWorth}
      categories={categories}
      currency={currency}
      wallets={wallets}
      budgets={budgets}
      savingsGoals={savingsGoals}
      recurringRules={recurringRules}
      initialPrefs={analyticsPrefs}
      initialAddType={add && isTransactionType(add) ? add : null}
    />
  );
}
