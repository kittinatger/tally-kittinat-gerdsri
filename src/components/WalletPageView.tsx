"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import AppHeader from "./AppHeader";
import { useT } from "@/lib/language-context";
import MembershipsView from "./MembershipsView";
import WalletCardsView from "./WalletCardsView";
import type { WalletOption } from "@/types/wallet";
import type { WalletCard } from "@/types/wallet-card";
import type { MembershipCard } from "@/types/membership";
import type { MessageKey } from "@/lib/i18n/messages";

// WalletManager is a Settings-panel component today (still reachable from
// Settings too — see settings-panels.ts) — loaded on demand here since the
// Accounts tab isn't necessarily the first one a visitor lands on.
const WalletManager = dynamic(() => import("./WalletManager"), { ssr: false });

type Tab = "accounts" | "cards" | "passes" | "memberships";

const TAB_LABEL_KEYS: Record<Tab, MessageKey> = {
  accounts: "wallet.tabAccounts",
  cards: "wallet.tabCards",
  passes: "wallet.tabPasses",
  memberships: "wallet.tabMemberships",
};

const TABS: Tab[] = ["accounts", "cards", "passes", "memberships"];

// The merged "Wallet" page — one nav entry standing in for what used to be
// two separate things (the Settings > Wallets accounts panel, and the old
// /memberships route) plus a brand-new Cards tab. Each tab fully (un)mounts
// on switch rather than sharing lifted state — simplest way to combine four
// previously-independent features without rewriting them into controlled
// components, at the cost of a tab losing any open modal when you switch
// away and back.
export default function WalletPageView({
  wallets,
  activitiesDefaultWalletId,
  walletCards,
  passes,
  memberships,
}: {
  wallets: WalletOption[];
  activitiesDefaultWalletId: number | null;
  walletCards: WalletCard[];
  passes: MembershipCard[];
  memberships: MembershipCard[];
}) {
  const t = useT();
  const [tab, setTab] = useState<Tab>("accounts");

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-3 pb-28 pt-3 sm:px-4 sm:pb-10 lg:max-w-6xl">
      <AppHeader />

      <div className="mt-3 flex gap-1 overflow-x-auto rounded-full bg-bg-soft p-1">
        {TABS.map((tb) => (
          <button
            key={tb}
            type="button"
            onClick={() => setTab(tb)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
              tab === tb ? "bg-surface text-foreground shadow-sm" : "text-ink-soft hover:text-foreground"
            }`}
          >
            {t(TAB_LABEL_KEYS[tb])}
          </button>
        ))}
      </div>

      <div className="flex-1 py-6">
        {tab === "accounts" && (
          <WalletManager key="accounts" wallets={wallets} initialActivitiesDefaultWalletId={activitiesDefaultWalletId} />
        )}
        {tab === "cards" && <WalletCardsView key="cards" initialCards={walletCards} />}
        {tab === "passes" && <MembershipsView key="passes" initialCards={passes} category="pass" />}
        {tab === "memberships" && <MembershipsView key="memberships" initialCards={memberships} category="membership" />}
      </div>
    </div>
  );
}
