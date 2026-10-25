"use client";

import { useMemo } from "react";
import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  ArrowsLeftRightIcon,
  ListBulletsIcon,
  PlusIcon,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";
import type { Expense } from "@/types/expense";
import { formatCurrency } from "@/lib/format";
import { dotClasses } from "@/lib/category-styles";
import { useT } from "@/lib/language-context";
import type { TypeFilter } from "./ExpenseList";

type SidebarWallet = { id: number; name: string; color: string; balance: number };

// The iPad/desktop Activities sidebar (the phone keeps ActivitiesBalanceCard):
// balance and this month's figures, every wallet with its balance as a
// filter, the type filter, and Add. Beside the table on desktop, above it on
// iPad.
export default function ActivitiesSidebar({
  expenses,
  wallets,
  currency,
  typeFilter,
  onTypeFilterChange,
  walletFilter,
  onWalletFilterChange,
  onAdd,
}: {
  expenses: Expense[];
  wallets: SidebarWallet[];
  currency: string;
  typeFilter: TypeFilter;
  onTypeFilterChange: (type: TypeFilter) => void;
  walletFilter: string;
  onWalletFilterChange: (wallet: string) => void;
  onAdd: () => void;
}) {
  const t = useT();
  const selectedWallet = walletFilter === "all" ? null : wallets.find((w) => String(w.id) === walletFilter);
  const balance = selectedWallet ? selectedWallet.balance : wallets.reduce((sum, w) => sum + w.balance, 0);

  // This calendar month in the chosen wallet scope; transfers only move money
  // between wallets, so they're left out.
  const month = useMemo(() => {
    const now = new Date();
    const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    let income = 0;
    let spent = 0;
    let count = 0;
    for (const e of expenses) {
      if (!e.date.startsWith(prefix)) continue;
      if (walletFilter !== "all" && String(e.walletId) !== walletFilter) continue;
      count++;
      if (e.type === "income") income += e.amount;
      else if (e.type === "expense") spent += e.amount;
    }
    return { income, spent, net: income - spent, count };
  }, [expenses, walletFilter]);

  const types: { type: TypeFilter; label: string; icon: Icon }[] = [
    { type: "all", label: t("activities.typeAll"), icon: ListBulletsIcon },
    { type: "expense", label: t("common.expense"), icon: ArrowDownLeftIcon },
    { type: "income", label: t("common.income"), icon: ArrowUpRightIcon },
    { type: "transfer", label: t("common.transfer"), icon: ArrowsLeftRightIcon },
  ];
  const rowClass = (on: boolean) =>
    `flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
      on ? "bg-surface-accent/10 text-surface-foreground" : "text-surface-foreground-soft hover:bg-[var(--surface-nav-hover)] hover:text-surface-foreground"
    }`;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
      {/* Balance + this month */}
      <section className="rounded-card border border-surface-line bg-surface p-5 md:row-span-2 lg:row-span-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-surface-foreground-soft">
          {selectedWallet ? selectedWallet.name : t("activities.yourBalance")}
        </p>
        <p className="mt-1.5 truncate text-3xl font-semibold tracking-tight tabular-nums text-surface-foreground">{formatCurrency(balance, currency)}</p>

        <div className="mt-5 space-y-2.5 border-t border-surface-line pt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-surface-foreground-soft">
            {t("activities.dateRangeThisMonth")} · {month.count} {month.count === 1 ? "transaction" : "transactions"}
          </p>
          <MonthRow label={t("common.income")} value={`+${formatCurrency(month.income, currency)}`} className="text-emerald-600 dark:text-emerald-400" />
          <MonthRow label={t("common.expense")} value={`−${formatCurrency(month.spent, currency)}`} className="text-red-600 dark:text-red-400" />
          <MonthRow
            label="Net"
            value={`${month.net >= 0 ? "+" : "−"}${formatCurrency(Math.abs(month.net), currency)}`}
            className={`font-semibold ${month.net >= 0 ? "text-surface-foreground" : "text-red-600 dark:text-red-400"}`}
          />
        </div>

        <button
          type="button"
          onClick={onAdd}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-dark"
        >
          <PlusIcon weight="bold" aria-hidden="true" className="h-4 w-4" />
          {t("form.addTransaction")}
        </button>
      </section>

      {/* Wallets as a filter */}
      {wallets.length > 1 && (
        <section className="rounded-card border border-surface-line bg-surface p-2">
          <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-surface-foreground-soft">{t("common.wallet")}</p>
          <button type="button" onClick={() => onWalletFilterChange("all")} aria-pressed={walletFilter === "all"} className={rowClass(walletFilter === "all")}>
            <span className="h-2 w-2 shrink-0 rounded-full bg-surface-foreground-soft/40" />
            <span className="min-w-0 flex-1 truncate">{t("activities.allWallets")}</span>
          </button>
          {wallets.map((w) => {
            const on = walletFilter === String(w.id);
            return (
              <button key={w.id} type="button" onClick={() => onWalletFilterChange(String(w.id))} aria-pressed={on} className={rowClass(on)}>
                <span className={`h-2 w-2 shrink-0 rounded-full ${dotClasses(w.color)}`} />
                <span className="min-w-0 flex-1 truncate">{w.name}</span>
                <span className="shrink-0 text-xs tabular-nums text-surface-foreground-soft">{formatCurrency(w.balance, currency)}</span>
              </button>
            );
          })}
        </section>
      )}

      {/* Type filter */}
      <section className="rounded-card border border-surface-line bg-surface p-2">
        <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-surface-foreground-soft">{t("detail.type")}</p>
        {types.map(({ type, label, icon: TypeIcon }) => (
          <button key={type} type="button" onClick={() => onTypeFilterChange(type)} aria-pressed={typeFilter === type} className={rowClass(typeFilter === type)}>
            <TypeIcon weight="bold" aria-hidden="true" className="h-4 w-4 shrink-0" />
            <span className="min-w-0 flex-1 truncate">{label}</span>
          </button>
        ))}
      </section>
    </div>
  );
}

function MonthRow({ label, value, className }: { label: string; value: string; className: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-surface-foreground-soft">{label}</span>
      <span className={`truncate tabular-nums ${className}`}>{value}</span>
    </div>
  );
}
