"use client";

import { useState } from "react";
import { EditIcon, TrashIcon } from "@/lib/icons";
import { useT } from "@/lib/language-context";
import { useCurrency } from "@/lib/currency-context";
import AccountCardShape from "./AccountCardShape";
import WalletCardShape from "./WalletCardShape";
import type { WalletOption } from "@/types/wallet";

// Same two-click delete-confirm pattern as MembershipCardDetail —
// rendered with key={wallet.id} by the caller so switching accounts
// resets `confirming`. Deleting is only safe to expose here because
// deleteWallet (db.ts) itself already refuses to delete a wallet with
// transactions on it — this just surfaces that as an inline error rather
// than blocking the button from being tappable at all. Renders as a
// payment card (WalletCardShape) when the wallet has a network set, or a
// plain account (AccountCardShape) otherwise — see WalletPageView.
export default function AccountDetail({
  wallet,
  onEdit,
  onDelete,
  deleteError,
}: {
  wallet: WalletOption;
  onEdit: () => void;
  onDelete: () => void;
  deleteError: string | null;
}) {
  const t = useT();
  const appCurrency = useCurrency();
  const [confirming, setConfirming] = useState(false);

  function handleDeleteClick() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    onDelete();
  }

  return (
    <div>
      {wallet.network ? (
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
          currency={wallet.currency ?? appCurrency}
          showBalance={wallet.showBalance}
          showCurrency={wallet.showCurrency}
          showCardNumber={wallet.showCardNumber}
          showName={wallet.showName}
        />
      ) : (
        <AccountCardShape wallet={wallet} currency={appCurrency} />
      )}

      <div className="mt-4 space-y-2 rounded-card border border-line bg-surface p-3.5 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-ink-soft">{t("wallet.typeLabel")}</span>
          <span className="font-medium text-foreground">{wallet.kind === "digital" ? t("wallet.digital") : t("wallet.cash")}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-ink-soft">{t("wallet.currencyLabel")}</span>
          <span className="font-medium text-foreground">{wallet.currency ?? appCurrency}</span>
        </div>
        {wallet.isDefault && (
          <div className="flex items-center justify-between">
            <span className="text-ink-soft">{t("wallet.defaultWalletLabel")}</span>
            <span className="h-2 w-2 rounded-full bg-navy" aria-hidden="true" />
          </div>
        )}
      </div>

      {deleteError && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{deleteError}</p>}

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-foreground transition hover:border-navy"
        >
          <EditIcon className="h-4 w-4" />
          {t("common.edit")}
        </button>
        <button
          type="button"
          onClick={handleDeleteClick}
          aria-label={confirming ? t("common.confirmDelete") : t("common.delete")}
          className={`flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm font-semibold transition ${
            confirming
              ? "border-red-300 bg-red-600 text-white hover:bg-red-700"
              : "border-line text-ink-soft hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
          }`}
        >
          <TrashIcon />
          {confirming && <span>{t("common.confirmDelete")}</span>}
        </button>
      </div>
    </div>
  );
}
