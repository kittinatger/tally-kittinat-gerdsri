import { listExpenses, listCategories, getCurrency, listWallets, getActivitiesDefaultWalletId } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import ActivitiesView from "@/components/ActivitiesView";
import { normalizeExpenseType, normalizeDirection, type Expense } from "@/types/expense";
import { isTransactionType } from "@/lib/categories";
import { toWalletOption } from "@/lib/wallet-mapper";
import type { CategoryOption } from "@/types/category";
import type { WalletOption } from "@/types/wallet";

// Always render fresh: the expense list changes on every write, and this
// also avoids the build needing a reachable database at build time.
export const dynamic = "force-dynamic";

// Activities is the app's default landing page — the day-to-day "what did
// I spend" view. The old Dashboard (widgets, net worth, budgets, etc.)
// moved to /analytics; see that route for the equivalent history and the
// `?add=expense` PWA shortcut wiring this page now handles instead (see
// ActivitiesView's initialAddOpen prop).
export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ add?: string }>;
}) {
  const { add } = await searchParams;
  const userId = await getUserId();
  const [rows, categoryRows, currency, walletRows, activitiesDefaultWalletId] = await Promise.all([
    listExpenses(userId),
    listCategories(userId),
    getCurrency(userId),
    listWallets(userId),
    getActivitiesDefaultWalletId(userId),
  ]);
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
      initialAddOpen={add === "expense"}
    />
  );
}
