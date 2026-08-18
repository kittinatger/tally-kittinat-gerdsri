"use client";

import Modal from "./Modal";
import { MembershipCardIcon } from "@/lib/icons";
import { useT } from "@/lib/language-context";

function BankIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
      <path d="M2.5 8.5 10 3l7.5 5.5" />
      <path d="M4 8.5v7M8 8.5v7M12 8.5v7M16 8.5v7" />
      <path d="M2.5 15.5h15" />
    </svg>
  );
}

function CardGlyphIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
      <rect x="2.5" y="4.5" width="15" height="11" rx="1.8" />
      <path d="M2.5 8h15" />
    </svg>
  );
}

function Row({ icon, label, desc, onClick }: { icon: React.ReactNode; label: string; desc: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-card border border-line bg-surface p-3.5 text-left transition hover:border-navy"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy/10 text-navy dark:text-blue-300">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-foreground">{label}</span>
        <span className="block text-xs text-ink-soft">{desc}</span>
      </span>
    </button>
  );
}

// The "+" entry menu on the merged Wallet page — one place to start adding
// any of the four things the stack can hold.
export default function WalletEntryModal({
  onClose,
  onAddAccount,
  onAddCard,
  onAddPass,
  onAddMembership,
}: {
  onClose: () => void;
  onAddAccount: () => void;
  onAddCard: () => void;
  onAddPass: () => void;
  onAddMembership: () => void;
}) {
  const t = useT();
  return (
    <Modal onClose={onClose} title={t("wallet.entryTitle")}>
      <div className="space-y-2">
        <Row icon={<BankIcon />} label={t("wallet.addWallet")} desc={t("wallet.entryAccountDesc")} onClick={onAddAccount} />
        <Row icon={<CardGlyphIcon />} label={t("wallet.addCard")} desc={t("wallet.entryCardDesc")} onClick={onAddCard} />
        <Row icon={<MembershipCardIcon className="h-4.5 w-4.5" />} label={t("wallet.addPass")} desc={t("wallet.entryPassDesc")} onClick={onAddPass} />
        <Row icon={<MembershipCardIcon className="h-4.5 w-4.5" />} label={t("membership.addCard")} desc={t("wallet.entryMembershipDesc")} onClick={onAddMembership} />
      </div>
    </Modal>
  );
}
