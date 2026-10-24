import { notFound } from "next/navigation";
import { getExpense, listCategories, getCurrency, listWallets } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import TransactionDetailView from "@/components/TransactionDetailView";
import { locationFromRow, normalizeExpenseType, normalizeDirection, type Expense } from "@/types/expense";
import { isTransactionType } from "@/lib/categories";
import { toWalletOption } from "@/lib/wallet-mapper";
import type { CategoryOption } from "@/types/category";
import type { WalletOption } from "@/types/wallet";

export const dynamic = "force-dynamic";

// A transaction's details on their own page (opened from a row on
// Activities) rather than a bottom sheet / side pane.
export default async function TransactionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const userId = await getUserId();
  const [row, categoryRows, currency, walletRows] = await Promise.all([
    getExpense(userId, id),
    listCategories(userId),
    getCurrency(userId),
    listWallets(userId),
  ]);
  if (!row) notFound();

  const expense: Expense = {
    id: row.id,
    type: normalizeExpenseType(row.type),
    direction: normalizeDirection(row.direction),
    date: row.date,
    amount: Number(row.amount),
    merchant: row.merchant,
    category: row.category,
    notes: row.notes,
    tags: row.tags ?? [],
    hasReceipt: row.has_receipt,
    walletId: row.wallet_id,
    walletName: row.wallet_name,
    splitGroupId: row.split_group_id,
    ...locationFromRow(row),
    createdAt: (row as { created_at?: string | null }).created_at ?? null,
  };
  const categories: CategoryOption[] = categoryRows.map((c) => ({
    id: c.id,
    type: isTransactionType(c.type) ? c.type : "expense",
    name: c.name,
    color: c.color,
    icon: c.icon,
  }));
  const wallets: WalletOption[] = walletRows.map(toWalletOption);

  return <TransactionDetailView initialExpense={expense} categories={categories} currency={currency} wallets={wallets} />;
}
