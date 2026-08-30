"use client";

import { useEffect, useState } from "react";
import { ArchiveIcon, CategoryIcon } from "@/lib/icons";
import { useT } from "@/lib/language-context";
import { useCurrency } from "@/lib/currency-context";
import { useCategoryColor, useCategoryIcon } from "@/lib/categories-context";
import { isCategoryIconKey } from "@/lib/category-icons";
import { badgeClasses } from "@/lib/category-styles";
import { formatCurrency, formatDateLong } from "@/lib/format";
import { normalizeExpenseType, normalizeDirection, signedAmount, type Expense } from "@/types/expense";
import AccountCardShape from "./AccountCardShape";
import WalletCardShape from "./WalletCardShape";
import type { WalletOption } from "@/types/wallet";

type RecentExpenseRow = {
  id: number;
  type: string;
  direction: string | null;
  date: string;
  amount: string;
  merchant: string;
  category: string;
  notes: string | null;
  tags: string[];
  has_receipt: boolean;
  wallet_id: number | null;
  wallet_name: string | null;
  split_group_id: string | null;
};

function toExpense(r: RecentExpenseRow): Expense {
  return {
    id: r.id,
    type: normalizeExpenseType(r.type),
    direction: normalizeDirection(r.direction),
    date: r.date,
    amount: Number(r.amount),
    merchant: r.merchant,
    category: r.category,
    notes: r.notes,
    tags: r.tags ?? [],
    hasReceipt: r.has_receipt,
    walletId: r.wallet_id,
    walletName: r.wallet_name,
    splitGroupId: r.split_group_id,
  };
}

// A compact, read-only row — the "Latest Transactions" list below is a
// preview, not the full swipe/edit/delete ExpenseRow used on Activities;
// tapping through to edit one from here isn't wired up yet.
function TransactionRow({ expense, currency }: { expense: Expense; currency: string }) {
  const color = useCategoryColor(expense.type, expense.category);
  const icon = useCategoryIcon(expense.type, expense.category);
  return (
    <div className="flex items-center gap-3 px-3.5 py-3">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${badgeClasses(color)}`}>
        {icon && isCategoryIconKey(icon) ? (
          <CategoryIcon iconKey={icon} className="h-4 w-4" />
        ) : (
          <span className="text-sm">{expense.category.charAt(0).toUpperCase()}</span>
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{expense.merchant}</p>
        <p className="mt-0.5 truncate text-xs text-ink-soft">
          {expense.category} · {formatDateLong(expense.date)}
        </p>
      </div>
      <p
        className={`shrink-0 text-sm font-semibold ${
          expense.type === "income"
            ? "text-emerald-600 dark:text-emerald-400"
            : expense.type === "transfer"
              ? "text-ink-soft"
              : "text-red-600 dark:text-red-400"
        }`}
      >
        {signedAmount(expense) >= 0 ? "+" : "-"}
        {formatCurrency(expense.amount, currency)}
      </p>
    </div>
  );
}

// A wallet is archived here, never hard-deleted — reversible any time from
// Manage accounts (WalletManager still has a real, permanent delete for
// when that's actually wanted). updateWallet (db.ts) itself already
// refuses to archive the last active wallet, which surfaces here as an
// inline error rather than blocking the trigger from being tappable at
// all. Renders as a payment card (WalletCardShape) when the wallet has a
// network set, or a plain account (AccountCardShape) otherwise — see
// WalletPageView. Edit and the Archive *trigger* both live in the Modal
// header's overflow menu now — nothing sits as a permanently-visible
// button any more, so a stray tap can't reach either one. Archive's own
// confirm step (confirmArchive/onCancelArchive, owned by the caller so it
// can reset when a different wallet is opened) still renders here in the
// body, one deliberate step further from the trigger.
export default function AccountDetail({
  wallet,
  onArchive,
  archiveError,
  confirmArchive,
  onCancelArchive,
}: {
  wallet: WalletOption;
  onArchive: () => void;
  archiveError: string | null;
  confirmArchive: boolean;
  onCancelArchive: () => void;
}) {
  const t = useT();
  const appCurrency = useCurrency();
  const [recent, setRecent] = useState<Expense[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Reset to the loading state for the newly-viewed wallet before the
    // fetch below resolves — otherwise switching accounts would briefly
    // show the previous one's transactions.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRecent(null);
    fetch(`/api/wallets/${wallet.id}/transactions?limit=5`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        const rows = (data.expenses as RecentExpenseRow[] | undefined) ?? [];
        setRecent(rows.map(toExpense));
      })
      .catch(() => {
        if (!cancelled) setRecent([]);
      });
    return () => {
      cancelled = true;
    };
  }, [wallet.id]);

  const walletCurrency = wallet.currency ?? appCurrency;

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
          currency={walletCurrency}
          showBalance={wallet.showBalance}
          showCurrency={wallet.showCurrency}
          showCardNumber={wallet.showCardNumber}
          showName={wallet.showName}
          showHolderName={wallet.showHolderName}
          showExpiry={wallet.showExpiry}
        />
      ) : (
        <AccountCardShape wallet={wallet} currency={appCurrency} />
      )}

      <div className="mt-4 rounded-card border border-line bg-surface p-3.5">
        <p className="text-xs uppercase tracking-wide text-ink-soft">{t("wallet.balanceLabel")}</p>
        <p className="mt-0.5 text-2xl font-bold text-foreground">{formatCurrency(wallet.balance, walletCurrency)}</p>
      </div>

      <div className="mt-4 space-y-2 rounded-card border border-line bg-surface p-3.5 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-ink-soft">{t("wallet.typeLabel")}</span>
          <span className="font-medium text-foreground">{wallet.kind === "digital" ? t("wallet.digital") : t("wallet.cash")}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-ink-soft">{t("wallet.currencyLabel")}</span>
          <span className="font-medium text-foreground">{walletCurrency}</span>
        </div>
        {wallet.isDefault && (
          <div className="flex items-center justify-between">
            <span className="text-ink-soft">{t("wallet.defaultWalletLabel")}</span>
            <span className="h-2 w-2 rounded-full bg-navy" aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="mt-4">
        <h3 className="mb-2 px-1 text-sm font-semibold text-foreground">{t("wallet.latestTransactions")}</h3>
        {recent === null ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[52px] animate-pulse rounded-card border border-line bg-surface" />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <p className="rounded-card border border-dashed border-line px-3.5 py-4 text-center text-xs text-ink-soft">
            {t("wallet.noTransactionsYet")}
          </p>
        ) : (
          <div className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
            {recent.map((expense) => (
              <TransactionRow key={expense.id} expense={expense} currency={walletCurrency} />
            ))}
          </div>
        )}
      </div>

      {archiveError && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{archiveError}</p>}

      {/* Only rendered once "..." → Archive has actually been tapped (see
       * WalletPageView) — no control is ever just sitting here by default.
       * Not styled as a destructive/red warning — archiving is reversible
       * from Manage accounts, unlike a real delete. */}
      {confirmArchive && (
        <div className="mt-4 space-y-2 rounded-card border border-line bg-bg-soft p-3.5">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <ArchiveIcon className="h-4 w-4" />
            {t("wallet.confirmArchiveTitle")}
          </p>
          <p className="text-xs text-ink-soft">{t("wallet.confirmArchiveDesc")}</p>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onCancelArchive}
              className="flex-1 rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold text-foreground transition hover:border-navy"
            >
              {t("common.cancel")}
            </button>
            <button type="button" onClick={onArchive} className="flex-1 rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-navy-dark">
              {t("wallet.archive")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
