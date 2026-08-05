import {
  listExpenses,
  getRemaining,
  listCategories,
  getCurrency,
  listWallets,
  getDashboardWidgets,
  processDueRecurringRules,
  listBudgets,
  listSavingsGoals,
} from "@/lib/db";
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
  await processDueRecurringRules(userId);
  const [rows, remaining, categoryRows, currency, walletRows, widgets, budgetRows, savingsGoalRows] = await Promise.all([
    listExpenses(userId),
    getRemaining(userId),
    listCategories(userId),
    getCurrency(userId),
    listWallets(userId),
    getDashboardWidgets(userId),
    listBudgets(userId),
    listSavingsGoals(userId),
  ]);
  const budgets = budgetRows.map((b) => ({ id: b.id, category: b.category, monthlyLimit: Number(b.monthly_limit) }));
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
  const wallets: WalletOption[] = walletRows.map((w) => ({
    id: w.id,
    name: w.name,
    color: w.color,
    kind: isWalletKind(w.kind) ? w.kind : "cash",
    currency: w.currency,
    isDefault: w.is_default,
    archived: w.archived,
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
      budgets={budgets}
      savingsGoals={savingsGoals}
    />
  );
}
