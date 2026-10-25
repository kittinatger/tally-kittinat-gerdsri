"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { CaretLeftIcon } from "@phosphor-icons/react/dist/ssr";
import type { WalletOption } from "@/types/wallet";
import { CurrencyProvider } from "@/lib/currency-context";
import { useT } from "@/lib/language-context";
import AppHeader from "./AppHeader";

const WalletForm = dynamic(() => import("./WalletModal"), { ssr: false });

// Add or edit a wallet / card on its own page (/wallet/new and
// /wallet/[id]/edit) instead of a popup: the live card preview stays pinned
// beside the fields on wide screens, with the same tabs and options as before.
export default function WalletFormPage({
  wallet,
  currency,
  returnTo,
  initialTab,
  defaultSignature = null,
}: {
  wallet?: WalletOption;
  currency: string;
  /** Where Cancel and a successful save go (a card's own page when editing). */
  returnTo: string;
  initialTab?: "basics" | "card" | "look" | "template" | "back";
  defaultSignature?: string | null;
}) {
  const t = useT();
  const router = useRouter();

  function leave() {
    router.push(returnTo);
    router.refresh();
  }

  return (
    <CurrencyProvider currency={currency}>
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-3 pb-28 pt-3 sm:px-4 sm:pb-10 lg:max-w-6xl">
        <AppHeader />
        <main className="flex-1 px-1 py-4 sm:px-2 sm:py-6">
          <button
            type="button"
            onClick={() => router.push(returnTo)}
            className="mb-3 flex items-center gap-1.5 rounded-full py-1.5 pr-3 text-sm font-semibold text-ink-soft transition hover:text-foreground"
          >
            <CaretLeftIcon weight="fill" aria-hidden="true" className="h-4 w-4" />
            {wallet ? wallet.name : t("nav.wallet")}
          </button>
          <h1 className="mb-5 font-display text-2xl text-foreground">{wallet ? t("wallet.editTitle") : t("wallet.addWallet")}</h1>
          <WalletForm wallet={wallet} asPage initialTab={initialTab} defaultSignature={defaultSignature} onClose={() => router.push(returnTo)} onSaved={leave} />
        </main>
      </div>
    </CurrencyProvider>
  );
}
