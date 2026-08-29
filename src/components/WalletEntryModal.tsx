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

// The "+" entry menu on the merged Wallet page. Used to be four rows (bank
// account / payment card / pass / loyalty card), but a payment card is now
// just a wallet with a card look (see WalletModal's "give this wallet a
// payment-card look" toggle), and "pass" vs "loyalty card" is the same
// underlying flow already (MembershipCardModal derives which one a saved
// card actually is from its template — see CATEGORY_BY_TEMPLATE there) —
// so both pairs collapse to one row apiece. "Add wallet" and "Add pass"
// both go straight into one form now (WalletModal /
// AddCardEntryModal+MembershipCardModal) — no separate bank-vs-card or
// pass-vs-loyalty question modal in between.
export default function WalletEntryModal({
  onClose,
  onAddWallet,
  onAddPass,
}: {
  onClose: () => void;
  onAddWallet: () => void;
  onAddPass: () => void;
}) {
  const t = useT();
  return (
    <Modal onClose={onClose} title={t("wallet.entryTitle")}>
      <div className="space-y-2">
        <Row icon={<BankIcon />} label={t("wallet.addWallet")} desc={t("wallet.entryWalletDesc")} onClick={onAddWallet} />
        <Row
          icon={<MembershipCardIcon className="h-4.5 w-4.5" />}
          label={t("wallet.addPass")}
          desc={t("wallet.entryPassCombinedDesc")}
          onClick={onAddPass}
        />
      </div>
    </Modal>
  );
}
