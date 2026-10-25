import { after } from "next/server";
import { redirect } from "next/navigation";
import {
  listExpenses,
  listCategories,
  getCurrency,
  listWallets,
  getActivitiesDefaultWalletId,
  getActivitiesPrefs,
  listRecurringRules,
  processDueRecurringRules,
  processDueRecurringSplits,
} from "@/lib/db";
import { sendPendingNotifications } from "@/lib/notifications";
import { getUserId } from "@/lib/auth";
import ActivitiesView from "@/components/ActivitiesView";
import type { UpcomingItem } from "@/components/UpcomingRecurring";
import { locationFromRow, normalizeExpenseType, normalizeDirection, type Expense } from "@/types/expense";
import { isTransactionType } from "@/lib/categories";
import { toWalletOption } from "@/lib/wallet-mapper";
import type { CategoryOption } from "@/types/category";
import type { WalletOption } from "@/types/wallet";

// Always render fresh: the expense list changes on every write, and this
// also avoids the build needing a reachable database at build time.
export const dynamic = "force-dynamic";

// A YYYY-MM-DD date `days` from now (server time; fine for a 7-day window).
function isoDaysFromNow(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
}

// Activities is the app's default landing page — the day-to-day "what did
// I spend" view. The old Dashboard (widgets, net worth, budgets, etc.)
// moved to /analytics; see that route for the equivalent history and the
// `?add=expense` PWA shortcut wiring this page now handles instead (see
// ActivitiesView's initialAddOpen prop).
export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ add?: string; vendor?: string }>;
}) {
  const { add, vendor } = await searchParams;
  // The PWA's "Add expense" shortcut and older links still point here.
  if (add === "expense") redirect("/transactions/new");
  const userId = await getUserId();
  // Activities is the landing page, so due recurring rules (rent, salary,
  // subscriptions) are logged here too — previously only Analytics did this,
  // so they didn't show up until it was opened. The check runs alongside the
  // page's own reads (one round trip, not two); the list is only re-read in
  // the uncommon case that the check just logged something.
  const [[loggedRecurring], firstRows, categoryRows, currency, walletRows, activitiesDefaultWalletId, activitiesPrefs, recurringRules] =
    await Promise.all([
      Promise.all([processDueRecurringRules(userId), processDueRecurringSplits(userId)]),
      listExpenses(userId),
      listCategories(userId),
      getCurrency(userId),
      listWallets(userId),
      getActivitiesDefaultWalletId(userId),
      getActivitiesPrefs(userId),
      listRecurringRules(userId),
    ]);
  const rows = loggedRecurring.length > 0 ? await listExpenses(userId) : firstRows;
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
    ...locationFromRow(r),
  }));
  const categories: CategoryOption[] = categoryRows.map((c) => ({
    id: c.id,
    type: isTransactionType(c.type) ? c.type : "expense",
    name: c.name,
    color: c.color,
    icon: c.icon,
  }));
  const wallets: WalletOption[] = walletRows.map(toWalletOption);
  if (loggedRecurring.length > 0) {
    // Same "recurring transactions logged" email/in-app notification Analytics
    // sends; no budget rows here, so only the recurring part applies.
    after(() => sendPendingNotifications(userId, loggedRecurring, [], [], currency));
  }

  // Recurring rules due within the next 7 days ("Coming up" on Activities).
  // Read alongside the recurring check above, so a rule it just logged may
  // still show its old date until the next load — harmless for a preview.
  const weekAhead = isoDaysFromNow(7);
  const upcoming: UpcomingItem[] = recurringRules
    .filter((r) => r.active && r.next_run_date <= weekAhead)
    .sort((a, b) => (a.next_run_date < b.next_run_date ? -1 : a.next_run_date > b.next_run_date ? 1 : 0))
    .map((r) => ({
      id: r.id,
      merchant: r.merchant,
      amount: Number(r.amount),
      type: normalizeExpenseType(r.type),
      category: r.category,
      nextRunDate: r.next_run_date,
    }));

  const initialWalletFilter = wallets.find((w) => w.id === activitiesDefaultWalletId && !w.archived)
    ? String(activitiesDefaultWalletId)
    : "all";

  return (
    <ActivitiesView
      initialExpenses={expenses}
      categories={categories}
      currency={currency}
      wallets={wallets}
      initialWalletFilter={initialWalletFilter}
      initialVendorFilter={vendor}
      prefs={activitiesPrefs}
      upcoming={upcoming}
    />
  );
}
