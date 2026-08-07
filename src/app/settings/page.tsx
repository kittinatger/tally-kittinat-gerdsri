import { listCategories, getCurrency, getUserById, listWallets, listExpenses, getRemaining } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import SettingsView from "@/components/SettingsView";
import { isTransactionType } from "@/lib/categories";
import { isWalletKind } from "@/lib/wallets";
import { normalizeExpenseType, normalizeDirection, type Expense } from "@/types/expense";
import type { CategoryOption } from "@/types/category";
import type { WalletOption } from "@/types/wallet";

// Always render fresh, same reasoning as the dashboard page.
export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ githubLinked?: string; githubError?: string }>;
}) {
  const { githubLinked, githubError } = await searchParams;
  const userId = await getUserId();
  const [categoryRows, currency, user, walletRows, expenseRows, remaining] = await Promise.all([
    listCategories(userId),
    getCurrency(userId),
    getUserById(userId),
    listWallets(userId, { includeArchived: true }),
    listExpenses(userId),
    getRemaining(userId),
  ]);
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
  const expenses: Expense[] = expenseRows.map((r) => ({
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

  return (
    <SettingsView
      categories={categories}
      currency={currency}
      username={user?.username ?? ""}
      email={user?.email ?? null}
      wallets={wallets}
      expenses={expenses}
      remaining={remaining}
      githubLinked={githubLinked === "1"}
      githubError={githubError}
    />
  );
}
