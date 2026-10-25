"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import type { Expense } from "@/types/expense";
import type { CategoryOption } from "@/types/category";
import type { WalletOption } from "@/types/wallet";
import { CategoriesProvider } from "@/lib/categories-context";
import { CurrencyProvider } from "@/lib/currency-context";
import { WalletsProvider } from "@/lib/wallets-context";
import { markOpenedFromList } from "@/lib/transaction-nav";
import { useMediaQuery } from "@/lib/use-media-query";
import { DEFAULT_ACTIVITIES_PREFS, type ActivitiesPrefs } from "@/lib/activities-prefs";
import PullToRefresh from "./PullToRefresh";
import ExpenseList, { type TypeFilter } from "./ExpenseList";
import ActivitiesBalanceCard from "./ActivitiesBalanceCard";
import ActivitiesSidebar from "./ActivitiesSidebar";
import AppHeader from "./AppHeader";

// Never mounted on first paint (it needs a swipe/hover Edit first) —
// loading it on demand keeps it out of Activities' initial JS bundle.
const EditExpenseModal = dynamic(() => import("./EditExpenseModal"), { ssr: false });

// iPad and desktop get their own Activities layout (sidebar + table); phones
// keep the original one untouched. Matches Tailwind's md: breakpoint.
const WIDE_QUERY = "(min-width: 768px)";
const noopSubscribe = () => () => {};

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
  initialVendorFilter,
  prefs = DEFAULT_ACTIVITIES_PREFS,
}: {
  initialExpenses: Expense[];
  categories: CategoryOption[];
  currency: string;
  wallets: WalletOption[];
  /** Wallet name to scope the balance card/list to on load — from Settings
   * > Wallets' "Default wallet for Activities" setting. "all" means every
   * wallet. */
  initialWalletFilter?: string;
  /** Scopes the list to one exact merchant on load — from the Vendors
   * settings panel's row links (`?vendor=NAME`, read server-side in
   * page.tsx) or a same-session merchant-name click (see
   * handleMerchantClick), both driving the same vendorFilter state. */
  initialVendorFilter?: string;
  /** Display/behavior defaults from the Settings > Activities panel — see
   * activities-prefs.ts. Read server-side in page.tsx, same as
   * activitiesDefaultWalletId above. */
  prefs?: ActivitiesPrefs;
}) {
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  // A fresh server render (e.g. back from a transaction's page after an
  // edit there) replaces the local list rather than being ignored.
  const [prevInitial, setPrevInitial] = useState(initialExpenses);
  if (prevInitial !== initialExpenses) {
    setPrevInitial(initialExpenses);
    setExpenses(initialExpenses);
  }

  // Strips the `?vendor=` param once consumed (replace, not push) so it
  // doesn't linger in history and reapply on back/refresh.
  useEffect(() => {
    if (!initialVendorFilter) return;
    router.replace("/", { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount only
  }, []);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>(prefs.defaultTypeFilter);
  const [walletFilter, setWalletFilter] = useState(initialWalletFilter);
  const [search, setSearch] = useState("");
  const [vendorFilter, setVendorFilter] = useState<string | null>(initialVendorFilter ?? null);

  const activeWallets = wallets.filter((w) => !w.archived);
  // The server can't know the screen size, so the first render (server and
  // hydration) includes both layouts with CSS choosing one — no flash of the
  // phone layout on desktop — and once hydrated only the matching one stays
  // mounted.
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const wide = useMediaQuery(WIDE_QUERY);
  const showPhone = !hydrated || !wide;
  const showWide = !hydrated || wide;

  // Adding a transaction happens on its own page (/transactions/new).
  function openAdd() {
    markOpenedFromList();
    router.push("/transactions/new");
  }

  function handleCreated(expense: Expense) {
    setExpenses((prev) => [expense, ...prev].sort(sortByDateDesc));
  }

  function handleUpdated(expense: Expense) {
    setExpenses((prev) => prev.map((e) => (e.id === expense.id ? expense : e)).sort(sortByDateDesc));
    setEditing(null);
  }

  function handleDeleted(id: number) {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    setEditing(null);
  }

  // A transaction's details open on their own page (/transactions/[id]).
  function openTransaction(expense: Expense) {
    markOpenedFromList();
    router.push(`/transactions/${expense.id}`);
  }

  function handleBulkDeleted(ids: number[]) {
    const idSet = new Set(ids);
    setExpenses((prev) => prev.filter((e) => !idSet.has(e.id)));
  }

  function handleBulkUpdated(updated: Expense[]) {
    const byId = new Map(updated.map((e) => [e.id, e]));
    setExpenses((prev) => prev.map((e) => byId.get(e.id) ?? e));
  }

  return (
    <CategoriesProvider categories={categories}>
      <WalletsProvider wallets={wallets}>
      <CurrencyProvider currency={currency}>
        <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-3 pb-28 pt-3 sm:px-4 sm:pb-10 lg:max-w-6xl">
          {showPhone && (
            <div className={hydrated ? "contents" : "contents md:hidden"}>
            <PullToRefresh>
              <AppHeader onAddClick={openAdd} />

              <main className="flex-1 px-1 py-6 sm:px-2">
                <div className="mx-auto w-full max-w-3xl">
                  <ActivitiesBalanceCard
                    expenses={expenses}
                    wallets={activeWallets}
                    currency={currency}
                    typeFilter={typeFilter}
                    onTypeFilterChange={setTypeFilter}
                    walletFilter={walletFilter}
                    onWalletFilterChange={setWalletFilter}
                  />
                  <ExpenseList
                    expenses={expenses}
                    onSelect={openTransaction}
                    onEdit={setEditing}
                    onBulkDeleted={handleBulkDeleted}
                    onBulkUpdated={handleBulkUpdated}
                    typeFilter={typeFilter}
                    onTypeFilterChange={setTypeFilter}
                    walletFilter={walletFilter}
                    onWalletFilterChange={setWalletFilter}
                    search={search}
                    onSearchChange={setSearch}
                    vendorFilter={vendorFilter}
                    onVendorFilterChange={setVendorFilter}
                    prefs={prefs}
                  />
                </div>

              </main>
            </PullToRefresh>

            </div>
          )}
          {showWide && (
            <div className={hydrated ? "flex flex-1 flex-col" : "hidden flex-1 flex-col md:flex"}>
              <PullToRefresh>
                <AppHeader onAddClick={openAdd} />
                <main className="flex-1 px-2 py-6 lg:grid lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start lg:gap-6">
                  <aside className="mb-6 lg:sticky lg:top-24 lg:mb-0">
                    <ActivitiesSidebar
                      expenses={expenses}
                      wallets={activeWallets}
                      currency={currency}
                      typeFilter={typeFilter}
                      onTypeFilterChange={setTypeFilter}
                      walletFilter={walletFilter}
                      onWalletFilterChange={setWalletFilter}
                      onAdd={openAdd}
                    />
                  </aside>
                  <div className="min-w-0">
                    <ExpenseList
                      layout="table"
                      expenses={expenses}
                      onSelect={openTransaction}
                      onEdit={setEditing}
                      onBulkDeleted={handleBulkDeleted}
                      onBulkUpdated={handleBulkUpdated}
                      typeFilter={typeFilter}
                      onTypeFilterChange={setTypeFilter}
                      walletFilter={walletFilter}
                      onWalletFilterChange={setWalletFilter}
                      search={search}
                      onSearchChange={setSearch}
                      vendorFilter={vendorFilter}
                      onVendorFilterChange={setVendorFilter}
                      prefs={prefs}
                    />
                  </div>
                </main>
              </PullToRefresh>
            </div>
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
