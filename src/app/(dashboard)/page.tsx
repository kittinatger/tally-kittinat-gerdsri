import { listExpenses, getRemaining, listCategories, getCurrency, listWallets, getDashboardWidgets } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import Dashboard from "@/components/Dashboard";
import { normalizeExpenseType, normalizeDirection, type Expense } from "@/types/expense";
import { isTransactionType } from "@/lib/categories";
import { isWalletKind } from "@/lib/wallets";
import type { CategoryOption } from "@/types/category";
import type { WalletOption } from "@/types/wallet";

// Always render fresh: the expense list changes on every write, and this
// also avoids the build needing a reachable database at build time.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const userId = await getUserId();
  const [rows, remaining, categoryRows, currency, walletRows, widgets] = await Promise.all([
    listExpenses(userId),
    getRemaining(userId),
    listCategories(userId),
    getCurrency(userId),
    listWallets(userId),
    getDashboardWidgets(userId),
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
  }));
  const categories: CategoryOption[] = categoryRows.map((c) => ({
    id: c.id,
    type: isTransactionType(c.type) ? c.type : "expense",
    name: c.name,
    color: c.color,
  }));
  const wallets: WalletOption[] = walletRows.map((w) => ({
    id: w.id,
    name: w.name,
    color: w.color,
    kind: isWalletKind(w.kind) ? w.kind : "cash",
    balance: Number(w.balance),
  }));

  return (
    <Dashboard
      initialExpenses={expenses}
      initialRemaining={remaining}
      categories={categories}
      currency={currency}
      wallets={wallets}
      widgets={widgets}
    />
  );
}
