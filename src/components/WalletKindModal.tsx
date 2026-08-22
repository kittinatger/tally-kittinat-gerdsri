"use client";

import Modal from "./Modal";
import { Row } from "./WalletEntryModal";
import { useT } from "@/lib/language-context";

function CardGlyphIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
      <rect x="2.5" y="4.5" width="15" height="11" rx="1.8" />
      <path d="M2.5 8h15" />
    </svg>
  );
}

function BankIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
      <path d="M2.5 8.5 10 3l7.5 5.5" />
      <path d="M4 8.5v7M8 8.5v7M12 8.5v7M16 8.5v7" />
      <path d="M2.5 15.5h15" />
    </svg>
  );
}

// The second-level chooser behind WalletEntryModal's combined "Add wallet"
// row — asks the one follow-up question that row's two underlying flows
// (WalletModal for a bank/cash account, WalletCardModal for a payment-card
// visual) actually need answered, since they're different data models.
export default function WalletKindModal({
  onClose,
  onAddAccount,
  onAddCard,
}: {
  onClose: () => void;
  onAddAccount: () => void;
  onAddCard: () => void;
}) {
  const t = useT();
  return (
    <Modal onClose={onClose} title={t("wallet.addWallet")}>
      <div className="space-y-2">
        <Row icon={<BankIcon />} label={t("wallet.kindAccountLabel")} desc={t("wallet.entryAccountDesc")} onClick={onAddAccount} />
        <Row icon={<CardGlyphIcon />} label={t("wallet.kindCardLabel")} desc={t("wallet.entryCardDesc")} onClick={onAddCard} />
      </div>
    </Modal>
  );
}
