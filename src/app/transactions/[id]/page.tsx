import { notFound } from "next/navigation";
import {
  getExpense,
  listCategories,
  getCurrency,
  listWallets,
  getMerchantInsights,
  listExpenseReceipts,
  listSplitGroupLines,
} from "@/lib/db";
import { getUserId } from "@/lib/auth";
import TransactionDetailView from "@/components/TransactionDetailView";
import type { TransactionExtras } from "@/components/ExpenseDetailContent";
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
  const [row, categoryRows, currency, walletRows, receiptRows] = await Promise.all([
    getExpense(userId, id),
    listCategories(userId),
    getCurrency(userId),
    listWallets(userId),
    listExpenseReceipts(userId, id),
  ]);
  if (!row) notFound();

  const extra = row as unknown as {
    created_at?: string | null;
    has_primary_receipt?: boolean;
    created_by_id?: number;
    created_by?: string | null;
  };
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
    createdAt: extra.created_at ?? null,
  };

  // The second round of lookups depends on the transaction itself.
  const [insights, splitLines] = await Promise.all([
    getMerchantInsights(userId, expense.merchant, expense.type, expense.id),
    expense.splitGroupId ? listSplitGroupLines(userId, expense.splitGroupId) : Promise.resolve([]),
  ]);
  const extras: TransactionExtras = {
    insights,
    receiptUrls: [
      ...(extra.has_primary_receipt ? [`/api/expenses/${id}/receipt`] : []),
      ...receiptRows.map((r) => `/api/expenses/${id}/receipts/${r.id}`),
    ],
    splitLines: splitLines.length > 1 ? splitLines : [],
    // Only worth saying in a shared wallet, when someone else added it.
    addedBy: extra.created_by_id !== undefined && extra.created_by_id !== userId ? (extra.created_by ?? null) : null,
  };

  const categories: CategoryOption[] = categoryRows.map((c) => ({
    id: c.id,
    type: isTransactionType(c.type) ? c.type : "expense",
    name: c.name,
    color: c.color,
    icon: c.icon,
  }));
  const wallets: WalletOption[] = walletRows.map(toWalletOption);

  return <TransactionDetailView initialExpense={expense} extras={extras} categories={categories} currency={currency} wallets={wallets} />;
}
