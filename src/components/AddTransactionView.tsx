"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { XIcon } from "@phosphor-icons/react/dist/ssr";
import type { CategoryOption } from "@/types/category";
import type { WalletOption } from "@/types/wallet";
import type { TransactionType } from "@/lib/categories";
import { CategoriesProvider } from "@/lib/categories-context";
import { CurrencyProvider } from "@/lib/currency-context";
import { WalletsProvider } from "@/lib/wallets-context";
import { useT } from "@/lib/language-context";
import { consumeOpenedFromList } from "@/lib/transaction-nav";
import AppHeader from "./AppHeader";
import TransactionComposer from "./TransactionComposer";

export default function AddTransactionView({
  categories,
  currency,
  wallets,
  initialType,
  initialWalletId,
  returnTo,
}: {
  categories: CategoryOption[];
  currency: string;
  wallets: WalletOption[];
  initialType: TransactionType;
  initialWalletId: number | null;
  /** Where to land after saving (and on close when opened directly). */
  returnTo: string;
}) {
  const t = useT();
  const router = useRouter();
  // Read once: whether closing can just pop history (see transaction-nav.ts).
  const [fromApp] = useState(consumeOpenedFromList);
  // Scans can save several entries before the form closes, so this only
  // records that something was saved; the navigation happens on close.
  const savedRef = useRef(false);

  function close() {
    // After a save the previous page's cached copy is stale — load it fresh.
    if (savedRef.current || !fromApp) router.push(returnTo);
    else router.back();
  }

  return (
    <CategoriesProvider categories={categories}>
      <WalletsProvider wallets={wallets}>
        <CurrencyProvider currency={currency}>
          <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-3 pb-28 pt-3 sm:px-4 sm:pb-10">
            <AppHeader />

            <main className="mx-auto w-full max-w-2xl flex-1 px-1 py-4 sm:px-2 sm:py-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <h1 className="font-display text-2xl text-foreground">{t("form.addTransaction")}</h1>
                <button
                  type="button"
                  onClick={close}
                  aria-label={t("common.cancel")}
                  title={t("common.cancel")}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line text-ink-soft transition hover:text-foreground"
                >
                  <XIcon weight="bold" aria-hidden="true" className="h-4 w-4" />
                </button>
              </div>

              <div className="animate-[fade-in_0.15s_ease-out] motion-reduce:animate-none">
                <TransactionComposer
                  initialType={initialType}
                  initialWalletId={initialWalletId}
                  onSaved={() => {
                    savedRef.current = true;
                  }}
                  onDone={close}
                />
              </div>
            </main>
          </div>
        </CurrencyProvider>
      </WalletsProvider>
    </CategoriesProvider>
  );
}
