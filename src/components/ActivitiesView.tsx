"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import type { Expense } from "@/types/expense";
import type { CategoryOption } from "@/types/category";
import type { WalletOption } from "@/types/wallet";
import { CategoriesProvider } from "@/lib/categories-context";
import { CurrencyProvider } from "@/lib/currency-context";
import { WalletsProvider } from "@/lib/wallets-context";
import { useMediaQuery, DESKTOP_QUERY } from "@/lib/use-media-query";
import { useT } from "@/lib/language-context";
import PullToRefresh from "./PullToRefresh";
import ExpenseList, { type TypeFilter } from "./ExpenseList";
import ActivitiesBalanceCard from "./ActivitiesBalanceCard";
import ExpenseDetailContent from "./ExpenseDetailContent";
import AppHeader from "./AppHeader";

// None of these three are ever mounted on first paint (they all require a
// row click or the Add button first) — loading them on demand keeps them
// out of Activities' initial JS bundle.
const AddExpenseModal = dynamic(() => import("./AddExpenseModal"), { ssr: false });
const EditExpenseModal = dynamic(() => import("./EditExpenseModal"), { ssr: false });
const ExpenseDetailModal = dynamic(() => import("./ExpenseDetailModal"), { ssr: false });

function sortByDateDesc(a: Expense, b: Expense): number {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1;
  return b.id - a.id;
}

export default function ActivitiesView({
  initialExpenses,
  categories,
  currency,
  wallets,
  initialWalletFilter = "all",
  initialAddOpen = false,
}: {
  initialExpenses: Expense[];
  categories: CategoryOption[];
  currency: string;
  wallets: WalletOption[];
  /** Wallet name to scope the balance card/list to on load — from Settings
   * > Wallets' "Default wallet for Activities" setting. "all" means every
   * wallet. */
  initialWalletFilter?: string;
  /** Opens the Add-expense modal immediately — from the PWA's "Add
   * expense" home-screen shortcut (`?add=expense`, read server-side in
   * page.tsx), same pattern Dashboard.tsx used before Activities became
   * the root page. */
  initialAddOpen?: boolean;
}) {
  const t = useT();
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [addOpen, setAddOpen] = useState(initialAddOpen);

  // Strips the `?add=expense` param once consumed (replace, not push) so
  // it doesn't linger in history and reopen the modal on back/refresh.
  useEffect(() => {
    if (!initialAddOpen) return;
    router.replace("/", { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount only
  }, []);
  const [viewing, setViewing] = useState<Expense | null>(null);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [walletFilter, setWalletFilter] = useState(initialWalletFilter);
  const isDesktop = useMediaQuery(DESKTOP_QUERY);

  const activeWallets = wallets.filter((w) => !w.archived);

  function handleCreated(expense: Expense) {
    setExpenses((prev) => [expense, ...prev].sort(sortByDateDesc));
  }

  function handleUpdated(expense: Expense) {
    setExpenses((prev) => prev.map((e) => (e.id === expense.id ? expense : e)).sort(sortByDateDesc));
    setEditing(null);
    // Keep the desktop detail pane in sync — without this it would keep
    // showing the pre-edit amount/category/notes until the row is reselected.
    setViewing((prev) => (prev && prev.id === expense.id ? expense : prev));
  }

  function handleDeleted(id: number) {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    setEditing(null);
    // The detail pane must not keep showing (and offering to edit) a
    // transaction that no longer exists.
    setViewing((prev) => (prev && prev.id === id ? null : prev));
  }

  function handleEditFromDetail() {
    setEditing(viewing);
    setViewing(null);
  }

  function handleBulkDeleted(ids: number[]) {
    const idSet = new Set(ids);
    setExpenses((prev) => prev.filter((e) => !idSet.has(e.id)));
    setViewing((prev) => (prev && idSet.has(prev.id) ? null : prev));
  }

  function handleBulkUpdated(updated: Expense[]) {
    const byId = new Map(updated.map((e) => [e.id, e]));
    setExpenses((prev) => prev.map((e) => byId.get(e.id) ?? e));
    setViewing((prev) => (prev ? (byId.get(prev.id) ?? prev) : prev));
  }

  return (
    <CategoriesProvider categories={categories}>
      <WalletsProvider wallets={wallets}>
      <CurrencyProvider currency={currency}>
        <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-3 pb-28 pt-3 sm:px-4 sm:pb-10 lg:max-w-6xl">
          <PullToRefresh>
            <AppHeader onAddClick={() => setAddOpen(true)} />

            <main className="flex-1 px-1 py-6 sm:px-2 lg:flex lg:items-start lg:gap-6">
              <div className="lg:w-[420px] lg:shrink-0">
                <ActivitiesBalanceCard
                  wallets={activeWallets}
                  currency={currency}
                  typeFilter={typeFilter}
                  onTypeFilterChange={setTypeFilter}
                  walletFilter={walletFilter}
                  onWalletFilterChange={setWalletFilter}
                />
                <ExpenseList
                  expenses={expenses}
                  onSelect={setViewing}
                  onEdit={setEditing}
                  onBulkDeleted={handleBulkDeleted}
                  onBulkUpdated={handleBulkUpdated}
                  typeFilter={typeFilter}
                  onTypeFilterChange={setTypeFilter}
                  walletFilter={walletFilter}
                  onWalletFilterChange={setWalletFilter}
                />
              </div>

              {/* Desktop-only right pane — below lg: transaction detail is
                  always the ExpenseDetailModal bottom sheet instead (see
                  isDesktop guard further down), so this stays out of the DOM
                  on mobile/tablet rather than just being visually hidden. */}
              <div className="hidden lg:sticky lg:top-20 lg:block lg:flex-1">
                {viewing ? (
                  <div className="rounded-card border border-surface-line bg-surface p-5 sm:p-6">
                    <ExpenseDetailContent expense={viewing} onEdit={handleEditFromDetail} />
                  </div>
                ) : (
                  <div className="flex h-64 flex-col items-center justify-center gap-1 rounded-card border border-dashed border-surface-line px-6 text-center">
                    <p className="text-sm font-medium text-foreground">{t("activities.noTransactionSelected")}</p>
                    <p className="text-xs text-ink-soft">{t("activities.noTransactionSelectedDesc")}</p>
                  </div>
                )}
              </div>
            </main>
          </PullToRefresh>

          {addOpen && <AddExpenseModal onClose={() => setAddOpen(false)} onCreated={handleCreated} />}
          {viewing && !isDesktop && (
            <ExpenseDetailModal expense={viewing} onClose={() => setViewing(null)} onEdit={handleEditFromDetail} />
          )}
          {editing && (
            <EditExpenseModal
              expense={editing}
              onClose={() => setEditing(null)}
              onUpdated={handleUpdated}
              onDeleted={handleDeleted}
              onDuplicated={handleCreated}
            />
          )}
        </div>
      </CurrencyProvider>
      </WalletsProvider>
    </CategoriesProvider>
  );
}
