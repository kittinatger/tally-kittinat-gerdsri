"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { CaretLeftIcon } from "@phosphor-icons/react/dist/ssr";
import type { Expense } from "@/types/expense";
import type { CategoryOption } from "@/types/category";
import type { WalletOption } from "@/types/wallet";
import { CategoriesProvider } from "@/lib/categories-context";
import { CurrencyProvider } from "@/lib/currency-context";
import { WalletsProvider } from "@/lib/wallets-context";
import { useT } from "@/lib/language-context";
import { consumeOpenedFromList } from "@/lib/transaction-nav";
import AppHeader from "./AppHeader";
import PullToRefresh from "./PullToRefresh";
import ExpenseDetailContent from "./ExpenseDetailContent";

const EditExpenseModal = dynamic(() => import("./EditExpenseModal"), { ssr: false });

export default function TransactionDetailView({
  initialExpense,
  categories,
  currency,
  wallets,
}: {
  initialExpense: Expense;
  categories: CategoryOption[];
  currency: string;
  wallets: WalletOption[];
}) {
  const t = useT();
  const router = useRouter();
  const [expense, setExpense] = useState(initialExpense);
  // A pull-to-refresh re-render brings a fresh copy from the server.
  const [prevInitial, setPrevInitial] = useState(initialExpense);
  if (prevInitial !== initialExpense) {
    setPrevInitial(initialExpense);
    setExpense(initialExpense);
  }
  const [editing, setEditing] = useState(false);
  // Read once: whether Back can just pop history (see transaction-nav.ts).
  const [fromList] = useState(consumeOpenedFromList);
  // Once something changed here, Activities' cached copy is stale — Back
  // then loads "/" fresh instead of restoring it from history.
  const [changed, setChanged] = useState(false);

  function goBack() {
    if (fromList && !changed) router.back();
    else router.push("/");
  }

  return (
    <CategoriesProvider categories={categories}>
      <WalletsProvider wallets={wallets}>
        <CurrencyProvider currency={currency}>
          <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-3 pb-28 pt-3 sm:px-4 sm:pb-10 lg:max-w-5xl">
            <PullToRefresh>
            <AppHeader />

            <main className="flex-1 px-1 py-4 sm:px-2 sm:py-6">
              <div className="mb-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={goBack}
                  className="flex items-center gap-1.5 rounded-full py-1.5 pr-3 text-sm font-semibold text-ink-soft transition hover:text-foreground"
                >
                  <CaretLeftIcon weight="bold" aria-hidden="true" className="h-4 w-4" />
                  {t("nav.activities")}
                </button>
              </div>

              <div className="animate-[fade-in_0.15s_ease-out] motion-reduce:animate-none">
                <ExpenseDetailContent
                  expense={expense}
                  onEdit={() => setEditing(true)}
                  onMerchantClick={(merchant) => router.push(`/?vendor=${encodeURIComponent(merchant)}`)}
                />
              </div>
            </main>
            </PullToRefresh>

            {editing && (
              <EditExpenseModal
                expense={expense}
                onClose={() => setEditing(false)}
                onUpdated={(updated) => {
                  setExpense(updated);
                  setEditing(false);
                  setChanged(true);
                }}
                onDeleted={() => router.replace("/")}
                onDuplicated={() => setChanged(true)}
              />
            )}
          </div>
        </CurrencyProvider>
      </WalletsProvider>
    </CategoriesProvider>
  );
}
