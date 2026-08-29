"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import AppHeader from "./AppHeader";
import PullToRefresh from "./PullToRefresh";
import Modal from "./Modal";
import CardStack from "./CardStack";
import CardGrid from "./CardGrid";
import AccountCardShape from "./AccountCardShape";
import WalletCardShape from "./WalletCardShape";
import PassShape from "./PassShape";
import { useT } from "@/lib/language-context";
import { useCurrency } from "@/lib/currency-context";
import { describeFetchError } from "@/lib/fetch-error";
import { PlusIcon, GearIcon } from "@/lib/icons";
import type { WalletOption } from "@/types/wallet";
import type { MembershipCard } from "@/types/membership";
import type { MembershipCodeFormat } from "@/lib/memberships";

// None of these are needed on first paint — every one requires a tap first.
const WalletManager = dynamic(() => import("./WalletManager"), { ssr: false });
const WalletModal = dynamic(() => import("./WalletModal"), { ssr: false });
const MembershipCardModal = dynamic(() => import("./MembershipCardModal"), { ssr: false });
const MembershipCardDetail = dynamic(() => import("./MembershipCardDetail"), { ssr: false });
const AccountDetail = dynamic(() => import("./AccountDetail"), { ssr: false });
const WalletEntryModal = dynamic(() => import("./WalletEntryModal"), { ssr: false });
const AddCardEntryModal = dynamic(() => import("./AddCardEntryModal"), { ssr: false });
const ScanCardModal = dynamic(() => import("./ScanCardModal"), { ssr: false });

type PassCategory = "pass" | "membership";

// The merged "Wallet" page — a single Apple-Wallet-style stack combining
// money accounts, payment-card visuals, passes, and memberships. Accounts
// and payment cards used to be two separate lists (wallets vs. a purely
// decorative wallet_cards table); they're one list now — see the wallets
// migration comments in db.ts — so this component no longer needs its own
// locally-patched card list at all: every wallet, card-look or not, comes
// from the same `wallets` prop and the same router.refresh()-after-save
// flow WalletManager already used.
export default function WalletPageView({
  wallets,
  activitiesDefaultWalletId,
  passes: initialPasses,
  memberships: initialMemberships,
}: {
  wallets: WalletOption[];
  activitiesDefaultWalletId: number | null;
  passes: MembershipCard[];
  memberships: MembershipCard[];
}) {
  const t = useT();
  const router = useRouter();
  const currency = useCurrency();

  const [passes, setPasses] = useState(initialPasses);
  const [memberships, setMemberships] = useState(initialMemberships);
  const [error, setError] = useState<string | null>(null);

  const [entryOpen, setEntryOpen] = useState(false);
  const [manageAccountsOpen, setManageAccountsOpen] = useState(false);
  const [accountModal, setAccountModal] = useState<{ mode: "edit"; wallet: WalletOption } | { mode: "add" } | null>(null);
  const [passModal, setPassModal] = useState<
    | { mode: "add"; scannedValue?: { value: string; format: MembershipCodeFormat } | null }
    | { mode: "edit"; card: MembershipCard }
    | null
  >(null);
  const [viewingPass, setViewingPass] = useState<MembershipCard | null>(null);
  const [viewingAccount, setViewingAccount] = useState<WalletOption | null>(null);
  const [accountDeleteError, setAccountDeleteError] = useState<string | null>(null);
  const [passEntryOpen, setPassEntryOpen] = useState(false);
  const [passScanOpen, setPassScanOpen] = useState(false);

  // A saved card's own `category` (derived in MembershipCardModal from
  // whichever template was picked — see CATEGORY_BY_TEMPLATE there) says
  // which of the two locally-patched lists it belongs in; the entry menu
  // no longer asks the user this up front, so it has to be read back off
  // the card instead of threaded through from the "add" flow.
  function setPassesFor(category: PassCategory) {
    return category === "pass" ? setPasses : setMemberships;
  }

  function handlePassSaved(card: MembershipCard) {
    setPassesFor(card.category)((prev) => {
      const exists = prev.some((c) => c.id === card.id);
      return exists ? prev.map((c) => (c.id === card.id ? card : c)) : [...prev, card];
    });
    // A card can change category on edit (switching to a different
    // template), so it also has to be pruned from whichever list it used
    // to be in — a no-op filter on the list it's actually in.
    setPassesFor(card.category === "pass" ? "membership" : "pass")((prev) => prev.filter((c) => c.id !== card.id));
    setPassModal(null);
    setViewingPass(null);
  }

  async function handleDeletePass(id: number) {
    setError(null);
    try {
      const res = await fetch(`/api/memberships/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(typeof data?.error === "string" ? data.error : t("membership.couldNotDelete"));
        return;
      }
      setPasses((prev) => prev.filter((c) => c.id !== id));
      setMemberships((prev) => prev.filter((c) => c.id !== id));
      setViewingPass(null);
    } catch (err) {
      setError(describeFetchError(err));
    }
  }

  // deleteWallet (db.ts) refuses to delete a wallet with transactions on
  // it, so the error is shown inline in AccountDetail rather than closing
  // the modal — same as WalletManager's own delete flow.
  async function handleDeleteAccount(id: number) {
    setAccountDeleteError(null);
    try {
      const res = await fetch(`/api/wallets/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setAccountDeleteError(typeof data?.error === "string" ? data.error : "Could not delete that wallet.");
        return;
      }
      setViewingAccount(null);
      router.refresh();
    } catch (err) {
      setAccountDeleteError(describeFetchError(err));
    }
  }

  // A wallet with a network set gets the payment-card visual
  // (WalletCardShape, including its own balance/currency preview per
  // showBalance/showCurrency); one without renders as a plain account
  // (AccountCardShape, which always shows its balance — that's the whole
  // point of an account, not something the card-only toggles apply to).
  const accountItems = wallets
    .filter((w) => !w.archived)
    .map((wallet) => ({
      key: `wallet-${wallet.id}`,
      node: wallet.network ? (
        <WalletCardShape
          label={wallet.name}
          holderName={wallet.holderName}
          last4={wallet.last4}
          expiryMonth={wallet.expiryMonth}
          expiryYear={wallet.expiryYear}
          network={wallet.network}
          color={wallet.color}
          background={wallet.background}
          showNetworkBadge={wallet.showNetworkBadge}
          badgePosition={wallet.badgePosition}
          textColor={wallet.textColor}
          iconColor={wallet.iconColor}
          showChip={wallet.showChip}
          chipColor={wallet.chipColor}
          chipPosition={wallet.chipPosition}
          balance={wallet.balance}
          currency={wallet.currency ?? currency}
          showBalance={wallet.showBalance}
          showCurrency={wallet.showCurrency}
        />
      ) : (
        <AccountCardShape wallet={wallet} currency={currency} />
      ),
      onOpen: () => {
        setAccountDeleteError(null);
        setViewingAccount(wallet);
      },
      ariaLabel: wallet.name,
    }));
  const cardsStack = accountItems;

  function passStackItem(card: MembershipCard) {
    return {
      key: `${card.category}-${card.id}`,
      node: (
        <PassShape
          name={card.name}
          color={card.color}
          background={card.background}
          textColor={card.textColor}
          icon={card.icon}
          template={card.template}
          fields={card.fields}
          layout={card.layout}
          codeValue={card.codeValue}
          codeFormat={card.codeFormat}
          codeSize="small"
          logoUrl={card.hasLogo ? `/api/memberships/${card.id}/logo` : null}
          bannerUrl={card.hasBanner ? `/api/memberships/${card.id}/banner` : null}
        />
      ),
      onOpen: () => setViewingPass(card),
      ariaLabel: card.name,
    };
  }
  const passesStack = [...passes, ...memberships].map(passStackItem);

  const isEmpty = cardsStack.length === 0 && passesStack.length === 0;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-3 pb-28 pt-3 sm:px-4 sm:pb-10 lg:max-w-6xl">
      <PullToRefresh>
        <AppHeader />

        <main className="flex-1 px-1 py-6 sm:px-2">
          <div className="mx-auto max-w-md lg:max-w-none">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-2xl text-foreground">{t("nav.wallet")}</h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setManageAccountsOpen(true)}
                  aria-label={t("wallet.manageAccounts")}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-ink-soft transition hover:border-navy hover:text-foreground"
                >
                  <GearIcon className="h-4.5 w-4.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setEntryOpen(true)}
                  aria-label={t("wallet.entryTitle")}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy text-white shadow-soft transition hover:bg-navy-dark"
                >
                  <PlusIcon className="h-4 w-4 shrink-0" />
                </button>
              </div>
            </div>

            {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

            {isEmpty ? (
              <div className="mt-6 flex flex-col items-center gap-2 rounded-card border border-dashed border-line px-6 py-12 text-center">
                <p className="text-sm font-medium text-foreground">{t("wallet.stackEmptyTitle")}</p>
                <p className="text-xs text-ink-soft">{t("wallet.stackEmptyDesc")}</p>
              </div>
            ) : (
              <>
                {/* Below lg, width is too tight for a multi-column grid to
                    read well, so it keeps the peeking-stack "Wallet app"
                    look, capped to max-w-md above. At lg+ there's enough
                    room to just show every card at once instead of only
                    the front of a stack. */}
                <div className="lg:hidden">
                  {cardsStack.length > 0 && (
                    <div className="mt-5">
                      <CardStack items={cardsStack} />
                    </div>
                  )}
                  {passesStack.length > 0 && (
                    <div className="mt-8">
                      <CardStack items={passesStack} />
                    </div>
                  )}
                </div>
                <div className="hidden lg:block">
                  {cardsStack.length > 0 && (
                    <div className="mt-6">
                      <CardGrid items={cardsStack} />
                    </div>
                  )}
                  {passesStack.length > 0 && (
                    <div className="mt-8">
                      <CardGrid items={passesStack} />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </main>
      </PullToRefresh>

      {entryOpen && (
        <WalletEntryModal
          onClose={() => setEntryOpen(false)}
          onAddWallet={() => {
            setEntryOpen(false);
            setAccountModal({ mode: "add" });
          }}
          onAddPass={() => {
            setEntryOpen(false);
            setPassEntryOpen(true);
          }}
        />
      )}

      {accountModal && (
        <WalletModal
          wallet={accountModal.mode === "edit" ? accountModal.wallet : undefined}
          onClose={() => setAccountModal(null)}
          onSaved={() => {
            setAccountModal(null);
            router.refresh();
          }}
        />
      )}

      {manageAccountsOpen && (
        <Modal onClose={() => setManageAccountsOpen(false)} title={t("wallet.manageAccounts")}>
          <WalletManager wallets={wallets} initialActivitiesDefaultWalletId={activitiesDefaultWalletId} />
        </Modal>
      )}

      {viewingAccount && (
        <Modal onClose={() => setViewingAccount(null)} title={viewingAccount.name}>
          <AccountDetail
            key={viewingAccount.id}
            wallet={viewingAccount}
            deleteError={accountDeleteError}
            onEdit={() => {
              setAccountModal({ mode: "edit", wallet: viewingAccount });
              setViewingAccount(null);
            }}
            onDelete={() => handleDeleteAccount(viewingAccount.id)}
          />
        </Modal>
      )}

      {viewingPass && (
        <Modal onClose={() => setViewingPass(null)} title={viewingPass.name}>
          <MembershipCardDetail
            key={viewingPass.id}
            card={viewingPass}
            onEdit={() => {
              setPassModal({ mode: "edit", card: viewingPass });
              setViewingPass(null);
            }}
            onDelete={() => handleDeletePass(viewingPass.id)}
          />
        </Modal>
      )}

      {passEntryOpen && (
        <AddCardEntryModal
          onClose={() => setPassEntryOpen(false)}
          onNewPass={() => {
            setPassEntryOpen(false);
            setPassModal({ mode: "add" });
          }}
          onScanRequested={() => {
            setPassEntryOpen(false);
            setPassScanOpen(true);
          }}
          onScanned={(result) => {
            setPassEntryOpen(false);
            setPassModal({ mode: "add", scannedValue: result });
          }}
        />
      )}

      {passScanOpen && (
        <ScanCardModal
          onClose={() => setPassScanOpen(false)}
          onScanned={(result) => {
            setPassScanOpen(false);
            setPassModal({ mode: "add", scannedValue: result });
          }}
        />
      )}

      {passModal && (
        <MembershipCardModal
          card={passModal.mode === "edit" ? passModal.card : undefined}
          scannedValue={passModal.mode === "add" ? (passModal.scannedValue ?? null) : null}
          onClose={() => setPassModal(null)}
          onSaved={handlePassSaved}
          onScanRequested={() => {
            setPassModal(null);
            setPassScanOpen(true);
          }}
        />
      )}
    </div>
  );
}
