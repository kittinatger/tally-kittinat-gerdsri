import { listExpenses, listCategories, getCurrency, listWallets, getActivitiesDefaultWalletId } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import ActivitiesView from "@/components/ActivitiesView";
import { normalizeExpenseType, normalizeDirection, type Expense } from "@/types/expense";
import { isTransactionType } from "@/lib/categories";
import { isWalletKind } from "@/lib/wallets";
import { parseCardBackground } from "@/lib/card-backgrounds";
import type { CategoryOption } from "@/types/category";
import type { WalletOption } from "@/types/wallet";

// Always render fresh, same reasoning as the dashboard page.
export const dynamic = "force-dynamic";

export default async function ActivitiesPage() {
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
  const wallets: WalletOption[] = walletRows.map((w) => ({
    id: w.id,
    name: w.name,
    color: w.color,
    background: parseCardBackground(w.background),
    textColor: w.text_color,
    kind: isWalletKind(w.kind) ? w.kind : "cash",
    currency: w.currency,
    isDefault: w.is_default,
    archived: w.archived,
    balance: Number(w.balance),
    isOwner: w.is_owner,
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
    />
  );
}
