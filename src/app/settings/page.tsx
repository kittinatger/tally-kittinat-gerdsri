import { listCategories, getCurrency, getUserById, listWallets } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import SettingsView from "@/components/SettingsView";
import { isTransactionType } from "@/lib/categories";
import type { CategoryOption } from "@/types/category";
import type { WalletOption } from "@/types/wallet";

// Always render fresh, same reasoning as the dashboard page.
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const userId = await getUserId();
  const [categoryRows, currency, user, walletRows] = await Promise.all([
    listCategories(userId),
    getCurrency(userId),
    getUserById(userId),
    listWallets(userId),
  ]);
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
    balance: Number(w.balance),
  }));

  return (
    <SettingsView categories={categories} currency={currency} username={user?.username ?? ""} wallets={wallets} />
  );
}
