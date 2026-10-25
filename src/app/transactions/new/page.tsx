import { listCategories, getCurrency, listWallets, listRecentEntryTemplates } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import AddTransactionView from "@/components/AddTransactionView";
import type { RecentEntry } from "@/components/TransactionComposer";
import { isTransactionType, isTransferDirection } from "@/lib/categories";
import { toWalletOption } from "@/lib/wallet-mapper";
import type { CategoryOption } from "@/types/category";
import type { WalletOption } from "@/types/wallet";

export const dynamic = "force-dynamic";

// Only same-app paths, so ?from= can't send anyone off-site after saving.
function safeReturnPath(from: string | undefined): string {
  return from && from.startsWith("/") && !from.startsWith("//") ? from : "/";
}

// Adding a transaction on its own page rather than in a popup. Optional
// ?type=income|expense|transfer and ?wallet=<id> pre-fill the form (e.g. a
// wallet's "Add money"); ?from= is where to land after saving.
export default async function NewTransactionPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; wallet?: string; from?: string }>;
}) {
  const { type, wallet, from } = await searchParams;
  const userId = await getUserId();
  const [categoryRows, currency, walletRows, templateRows] = await Promise.all([
    listCategories(userId),
    getCurrency(userId),
    listWallets(userId),
    listRecentEntryTemplates(userId),
  ]);
  const recent: RecentEntry[] = templateRows.map((r) => ({
    merchant: r.merchant,
    type: isTransactionType(r.type) ? r.type : "expense",
    direction: r.direction && isTransferDirection(r.direction) ? r.direction : "out",
    category: r.category,
    amount: Number(r.amount),
    walletId: r.wallet_id,
  }));
  const categories: CategoryOption[] = categoryRows.map((c) => ({
    id: c.id,
    type: isTransactionType(c.type) ? c.type : "expense",
    name: c.name,
    color: c.color,
    icon: c.icon,
  }));
  const wallets: WalletOption[] = walletRows.map(toWalletOption);
  const walletId = Number(wallet);

  return (
    <AddTransactionView
      categories={categories}
      currency={currency}
      wallets={wallets}
      initialType={type && isTransactionType(type) ? type : "expense"}
      initialWalletId={wallets.some((w) => w.id === walletId) ? walletId : null}
      returnTo={safeReturnPath(from)}
      recent={recent}
    />
  );
}
