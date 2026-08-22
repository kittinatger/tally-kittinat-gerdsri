"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import AppHeader from "./AppHeader";
import PullToRefresh from "./PullToRefresh";
import Modal from "./Modal";
import CardStack from "./CardStack";
import AccountCardShape from "./AccountCardShape";
import WalletCardShape from "./WalletCardShape";
import PassShape from "./PassShape";
import { useT } from "@/lib/language-context";
import { useCurrency } from "@/lib/currency-context";
import { describeFetchError } from "@/lib/fetch-error";
import { PlusIcon, GearIcon } from "@/lib/icons";
import type { WalletOption } from "@/types/wallet";
import type { WalletCard } from "@/types/wallet-card";
import type { MembershipCard } from "@/types/membership";
import type { MembershipCodeFormat } from "@/lib/memberships";

// None of these are needed on first paint — every one requires a tap first.
const WalletManager = dynamic(() => import("./WalletManager"), { ssr: false });
const WalletModal = dynamic(() => import("./WalletModal"), { ssr: false });
const WalletCardModal = dynamic(() => import("./WalletCardModal"), { ssr: false });
const MembershipCardModal = dynamic(() => import("./MembershipCardModal"), { ssr: false });
const MembershipCardDetail = dynamic(() => import("./MembershipCardDetail"), { ssr: false });
const AccountDetail = dynamic(() => import("./AccountDetail"), { ssr: false });
const WalletCardDetail = dynamic(() => import("./WalletCardDetail"), { ssr: false });
const WalletEntryModal = dynamic(() => import("./WalletEntryModal"), { ssr: false });
const AddCardEntryModal = dynamic(() => import("./AddCardEntryModal"), { ssr: false });
const ScanCardModal = dynamic(() => import("./ScanCardModal"), { ssr: false });

type PassCategory = "pass" | "membership";

// The merged "Wallet" page — a single Apple-Wallet-style stack combining
// money accounts, payment-card visuals, passes, and memberships, replacing
// the earlier four-tab layout. Accounts still use router.refresh() after
// a save (same as WalletManager already did as a Settings panel — it has
// no local list of its own to patch); wallet cards and passes/memberships
// keep locally-patched state so adding/editing one feels instant.
export default function WalletPageView({
  wallets,
  activitiesDefaultWalletId,
  walletCards: initialWalletCards,
  passes: initialPasses,
  memberships: initialMemberships,
}: {
  wallets: WalletOption[];
  activitiesDefaultWalletId: number | null;
  walletCards: WalletCard[];
  passes: MembershipCard[];
  memberships: MembershipCard[];
}) {
  const t = useT();
  const router = useRouter();
  const currency = useCurrency();

  const [walletCards, setWalletCards] = useState(initialWalletCards);
  const [passes, setPasses] = useState(initialPasses);
  const [memberships, setMemberships] = useState(initialMemberships);
  const [error, setError] = useState<string | null>(null);

  const [entryOpen, setEntryOpen] = useState(false);
  const [manageAccountsOpen, setManageAccountsOpen] = useState(false);
  const [accountModal, setAccountModal] = useState<{ mode: "edit"; wallet: WalletOption } | { mode: "add" } | null>(null);
  const [cardModal, setCardModal] = useState<{ mode: "edit"; card: WalletCard } | { mode: "add" } | null>(null);
  const [passModal, setPassModal] = useState<
    | { mode: "add"; category: PassCategory; scannedValue?: { value: string; format: MembershipCodeFormat } | null }
    | { mode: "edit"; category: PassCategory; card: MembershipCard }
    | null
  >(null);
  const [viewingPass, setViewingPass] = useState<MembershipCard | null>(null);
  const [viewingAccount, setViewingAccount] = useState<WalletOption | null>(null);
  const [accountDeleteError, setAccountDeleteError] = useState<string | null>(null);
  const [viewingCard, setViewingCard] = useState<WalletCard | null>(null);
  const [entryCategoryOpen, setEntryCategoryOpen] = useState<PassCategory | null>(null);
  const [scanCategory, setScanCategory] = useState<PassCategory | null>(null);

  function setPassesFor(category: PassCategory) {
    return category === "pass" ? setPasses : setMemberships;
  }

  function handlePassSaved(category: PassCategory, card: MembershipCard) {
    setPassesFor(category)((prev) => {
      const exists = prev.some((c) => c.id === card.id);
      return exists ? prev.map((c) => (c.id === card.id ? card : c)) : [...prev, card];
    });
    setPassModal(null);
    setViewingPass(null);
  }

  async function handleDeletePass(category: PassCategory, id: number) {
    setError(null);
    try {
      const res = await fetch(`/api/memberships/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(typeof data?.error === "string" ? data.error : t("membership.couldNotDelete"));
        return;
      }
      setPassesFor(category)((prev) => prev.filter((c) => c.id !== id));
      setViewingPass(null);
    } catch (err) {
      setError(describeFetchError(err));
    }
  }

  function handleCardSaved(card: WalletCard) {
    setWalletCards((prev) => {
      const exists = prev.some((c) => c.id === card.id);
      return exists ? prev.map((c) => (c.id === card.id ? card : c)) : [...prev, card];
    });
    setCardModal(null);
  }

  async function handleDeleteCard(id: number) {
    setError(null);
    try {
      const res = await fetch(`/api/wallet-cards/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(typeof data?.error === "string" ? data.error : "Could not delete that card.");
        return;
      }
      setWalletCards((prev) => prev.filter((c) => c.id !== id));
      setViewingCard(null);
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

  const accountItems = wallets
    .filter((w) => !w.archived)
    .map((wallet) => ({
      key: `account-${wallet.id}`,
      node: <AccountCardShape wallet={wallet} currency={currency} />,
      onOpen: () => {
        setAccountDeleteError(null);
        setViewingAccount(wallet);
      },
      ariaLabel: wallet.name,
    }));
  const cardItems = walletCards.map((card) => ({
    key: `card-${card.id}`,
    node: (
      <WalletCardShape
        label={card.label}
        holderName={card.holderName}
        last4={card.last4}
        expiryMonth={card.expiryMonth}
        expiryYear={card.expiryYear}
        network={card.network}
        color={card.color}
        background={card.background}
        showNetworkBadge={card.showNetworkBadge}
        textColor={card.textColor}
        showChip={card.showChip}
        chipColor={card.chipColor}
      />
    ),
    onOpen: () => setViewingCard(card),
    ariaLabel: card.label,
  }));
  const cardsStack = [...accountItems, ...cardItems];

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
          <div className="mx-auto max-w-md">
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
              </>
            )}
          </div>
        </main>
      </PullToRefresh>

      {entryOpen && (
        <WalletEntryModal
          onClose={() => setEntryOpen(false)}
          onAddAccount={() => {
            setEntryOpen(false);
            setAccountModal({ mode: "add" });
          }}
          onAddCard={() => {
            setEntryOpen(false);
            setCardModal({ mode: "add" });
          }}
          onAddPass={() => {
            setEntryOpen(false);
            setEntryCategoryOpen("pass");
          }}
          onAddMembership={() => {
            setEntryOpen(false);
            setEntryCategoryOpen("membership");
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

      {cardModal && (
        <WalletCardModal
          card={cardModal.mode === "edit" ? cardModal.card : undefined}
          onClose={() => setCardModal(null)}
          onSaved={handleCardSaved}
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

      {viewingCard && (
        <Modal onClose={() => setViewingCard(null)} title={viewingCard.label}>
          <WalletCardDetail
            key={viewingCard.id}
            card={viewingCard}
            onEdit={() => {
              setCardModal({ mode: "edit", card: viewingCard });
              setViewingCard(null);
            }}
            onDelete={() => handleDeleteCard(viewingCard.id)}
          />
        </Modal>
      )}

      {viewingPass && (
        <Modal onClose={() => setViewingPass(null)} title={viewingPass.name}>
          <MembershipCardDetail
            key={viewingPass.id}
            card={viewingPass}
            onEdit={() => {
              setPassModal({ mode: "edit", category: viewingPass.category, card: viewingPass });
              setViewingPass(null);
            }}
            onDelete={() => handleDeletePass(viewingPass.category, viewingPass.id)}
          />
        </Modal>
      )}

      {entryCategoryOpen && (
        <AddCardEntryModal
          onClose={() => setEntryCategoryOpen(null)}
          onNewPass={() => {
            const category = entryCategoryOpen;
            setEntryCategoryOpen(null);
            setPassModal({ mode: "add", category });
          }}
          onScanRequested={() => {
            const category = entryCategoryOpen;
            setEntryCategoryOpen(null);
            setScanCategory(category);
          }}
          onScanned={(result) => {
            const category = entryCategoryOpen;
            setEntryCategoryOpen(null);
            setPassModal({ mode: "add", category, scannedValue: result });
          }}
        />
      )}

      {scanCategory && (
        <ScanCardModal
          onClose={() => setScanCategory(null)}
          onScanned={(result) => {
            const category = scanCategory;
            setScanCategory(null);
            setPassModal({ mode: "add", category, scannedValue: result });
          }}
        />
      )}

      {passModal && (
        <MembershipCardModal
          card={passModal.mode === "edit" ? passModal.card : undefined}
          scannedValue={passModal.mode === "add" ? (passModal.scannedValue ?? null) : null}
          category={passModal.category}
          onClose={() => setPassModal(null)}
          onSaved={(card) => handlePassSaved(passModal.category, card)}
          onScanRequested={() => {
            const category = passModal.category;
            setPassModal(null);
            setScanCategory(category);
          }}
        />
      )}
    </div>
  );
}
