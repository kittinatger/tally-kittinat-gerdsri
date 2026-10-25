"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatCurrency } from "@/lib/format";
import { dotClasses } from "@/lib/category-styles";
import { GearIcon } from "@/lib/icons";
import { useT } from "@/lib/language-context";
import { useDesign } from "@/lib/use-design";
import type { TypeFilter } from "./ExpenseList";
import type { Expense } from "@/types/expense";
import { CaretDownIcon } from "@phosphor-icons/react/dist/ssr";
import { ArrowDownLeftIcon as PhArrowDownLeftIcon, ArrowUpRightIcon as PhArrowUpRightIcon, ArrowsLeftRightIcon as PhArrowsLeftRightIcon } from "@phosphor-icons/react/dist/ssr";

function IncomeIcon() {
  return <PhArrowUpRightIcon weight="fill" aria-hidden="true" className="h-4 w-4" />;
}

function ExpenseIcon() {
  return <PhArrowDownLeftIcon weight="fill" aria-hidden="true" className="h-4 w-4" />;
}

function TransferIcon() {
  return <PhArrowsLeftRightIcon weight="fill" aria-hidden="true" className="h-4.5 w-4.5" />;
}

export default function ActivitiesBalanceCard({
  expenses,
  wallets,
  currency,
  typeFilter,
  onTypeFilterChange,
  walletFilter,
  onWalletFilterChange,
}: {
  /** For the Modern hero's "this month" income/spent figures. */
  expenses: Expense[];
  wallets: { id: number; name: string; color: string; balance: number }[];
  currency: string;
  typeFilter: TypeFilter;
  onTypeFilterChange: (type: TypeFilter) => void;
  walletFilter: string;
  onWalletFilterChange: (wallet: string) => void;
}) {
  const t = useT();
  const modern = useDesign() === "modern";
  const FILTER_BUTTONS: { type: Exclude<TypeFilter, "all">; label: string; icon: () => React.ReactNode }[] = [
    { type: "expense", label: t("common.expense"), icon: ExpenseIcon },
    { type: "income", label: t("common.income"), icon: IncomeIcon },
    { type: "transfer", label: t("common.transfer"), icon: TransferIcon },
  ];
  const [scopeOpen, setScopeOpen] = useState(false);
  const scopeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (!scopeRef.current?.contains(e.target as Node)) setScopeOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setScopeOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const selectedWallet = walletFilter === "all" ? null : wallets.find((w) => String(w.id) === walletFilter);
  const balance = walletFilter === "all" ? wallets.reduce((sum, w) => sum + w.balance, 0) : (selectedWallet?.balance ?? 0);

  function toggleType(type: Exclude<TypeFilter, "all">) {
    onTypeFilterChange(typeFilter === type ? "all" : type);
  }

  function selectWallet(id: string) {
    onWalletFilterChange(id);
    setScopeOpen(false);
  }

  // Income and spending so far this calendar month, in the chosen wallet
  // scope (transfers just move money between wallets, so they're left out).
  const month = useMemo(() => {
    const now = new Date();
    const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    let income = 0;
    let spent = 0;
    for (const e of expenses) {
      if (!e.date.startsWith(prefix)) continue;
      if (walletFilter !== "all" && String(e.walletId) !== walletFilter) continue;
      if (e.type === "income") income += e.amount;
      else if (e.type === "expense") spent += e.amount;
    }
    return { income, spent };
  }, [expenses, walletFilter]);

  const walletMenu = scopeOpen && (
    <div
      role="listbox"
      className="absolute left-1/2 top-[calc(100%+6px)] z-20 w-52 -translate-x-1/2 overflow-hidden rounded-2xl border border-surface-line bg-surface p-1.5 text-left shadow-soft"
    >
      {[{ id: "all", name: t("activities.allWallets"), color: null as string | null }, ...wallets.map((w) => ({ id: String(w.id), name: w.name, color: w.color }))].map((w) => (
        <button
          key={w.id}
          type="button"
          role="option"
          aria-selected={walletFilter === w.id}
          onClick={() => selectWallet(w.id)}
          className={`flex w-full items-center gap-2 truncate rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
            walletFilter === w.id
              ? "bg-[var(--surface-nav-hover)] text-surface-foreground"
              : "text-surface-foreground-soft hover:bg-[var(--surface-nav-hover)] hover:text-surface-foreground"
          }`}
        >
          {w.color && <span className={`h-2 w-2 shrink-0 rounded-full ${dotClasses(w.color)}`} />}
          <span className="truncate">{w.name}</span>
        </button>
      ))}
    </div>
  );

  if (modern) {
    const segments: { type: TypeFilter; label: string }[] = [
      { type: "all", label: t("activities.typeAll") },
      ...FILTER_BUTTONS.map(({ type, label }) => ({ type, label })),
    ];
    return (
      <section className="mb-5 rounded-card border border-surface-line bg-surface px-4 pb-4 pt-5 text-center text-surface-foreground sm:px-6 sm:pt-6">
        {wallets.length > 1 ? (
          <div className="relative inline-block" ref={scopeRef}>
            <button
              type="button"
              onClick={() => setScopeOpen((o) => !o)}
              aria-label={t("activities.chooseWallet")}
              aria-expanded={scopeOpen}
              aria-haspopup="listbox"
              className="inline-flex max-w-[16rem] items-center gap-1.5 rounded-full border border-surface-line px-3 py-1 text-xs font-semibold text-surface-foreground-soft transition hover:text-surface-foreground"
            >
              {selectedWallet && <span className={`h-2 w-2 shrink-0 rounded-full ${dotClasses(selectedWallet.color)}`} />}
              <span className="truncate">{selectedWallet ? selectedWallet.name : t("activities.allWallets")}</span>
              <CaretDownIcon weight="fill" aria-hidden="true" className="h-3 w-3 shrink-0" />
            </button>
            {walletMenu}
          </div>
        ) : (
          <p className="text-xs font-semibold text-surface-foreground-soft">{t("activities.yourBalance")}</p>
        )}

        <p className="mt-2 truncate text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">{formatCurrency(balance, currency)}</p>

        <div className="mx-auto mt-4 grid max-w-sm grid-cols-2 divide-x divide-surface-line rounded-xl bg-surface-soft py-2.5">
          <div className="px-3">
            <p className="flex items-center justify-center gap-1 text-[11px] font-medium text-surface-foreground-soft">
              <IncomeIcon />
              {t("common.income")}
            </p>
            <p className="mt-0.5 truncate text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
              +{formatCurrency(month.income, currency)}
            </p>
          </div>
          <div className="px-3">
            <p className="flex items-center justify-center gap-1 text-[11px] font-medium text-surface-foreground-soft">
              <ExpenseIcon />
              {t("common.expense")}
            </p>
            <p className="mt-0.5 truncate text-sm font-semibold tabular-nums text-red-600 dark:text-red-400">
              −{formatCurrency(month.spent, currency)}
            </p>
          </div>
        </div>
        <p className="mt-1.5 text-[11px] text-surface-foreground-soft">{t("activities.dateRangeThisMonth")}</p>

        <div role="group" className="mt-4 flex rounded-full bg-surface-soft p-1">
          {segments.map(({ type, label }) => {
            const active = typeFilter === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => onTypeFilterChange(type)}
                aria-pressed={active}
                className={`flex-1 truncate rounded-full px-2 py-1.5 text-xs font-semibold transition sm:text-sm ${
                  active ? "bg-surface text-surface-foreground shadow-soft" : "text-surface-foreground-soft hover:text-surface-foreground"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <div className="relative mb-4 rounded-card border border-surface-line bg-surface p-5 text-surface-foreground">
      {wallets.length > 1 && (
        <div className="absolute right-3 top-3 z-10" ref={scopeRef}>
          <button
            type="button"
            onClick={() => setScopeOpen((o) => !o)}
            aria-label={t("activities.chooseWallet")}
            aria-expanded={scopeOpen}
            aria-haspopup="listbox"
            className="flex h-8 w-8 items-center justify-center rounded-full text-surface-foreground-soft transition hover:bg-[var(--surface-nav-hover)] hover:text-surface-foreground"
          >
            <GearIcon />
          </button>
          {scopeOpen && (
            <div
              role="listbox"
              className="absolute right-0 top-[calc(100%+6px)] w-44 overflow-hidden rounded-2xl border border-surface-line bg-surface p-1.5 shadow-soft"
            >
              <button
                type="button"
                role="option"
                aria-selected={walletFilter === "all"}
                onClick={() => selectWallet("all")}
                className={`w-full rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
                  walletFilter === "all"
                    ? "bg-[var(--surface-nav-hover)] text-surface-foreground"
                    : "text-surface-foreground-soft hover:bg-[var(--surface-nav-hover)] hover:text-surface-foreground"
                }`}
              >
                {t("activities.allWallets")}
              </button>
              {wallets.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  role="option"
                  aria-selected={walletFilter === String(w.id)}
                  onClick={() => selectWallet(String(w.id))}
                  className={`flex w-full items-center gap-2 truncate rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
                    walletFilter === String(w.id)
                      ? "bg-[var(--surface-nav-hover)] text-surface-foreground"
                      : "text-surface-foreground-soft hover:bg-[var(--surface-nav-hover)] hover:text-surface-foreground"
                  }`}
                >
                  <span className={`h-2 w-2 shrink-0 rounded-full ${dotClasses(w.color)}`} />
                  <span className="truncate">{w.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-surface-foreground-soft">
          {walletFilter === "all" ? t("activities.yourBalance") : (selectedWallet?.name ?? t("activities.yourBalance"))}
        </p>
        <p className="mt-1.5 truncate font-display text-3xl sm:text-4xl">{formatCurrency(balance, currency)}</p>

        <div className="mt-4 flex items-center justify-between gap-2 rounded-2xl bg-surface-soft p-2.5">
          {FILTER_BUTTONS.map(({ type, label, icon: Icon }) => {
            const active = typeFilter === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => toggleType(type)}
                aria-pressed={active}
                className="flex flex-1 flex-col items-center gap-1.5 py-1"
              >
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-full transition ${
                    active
                      ? "bg-surface-accent text-white"
                      : "bg-surface text-surface-foreground-soft"
                  }`}
                >
                  <Icon />
                </span>
                <span
                  className={`text-xs font-semibold ${active ? "text-surface-foreground" : "text-surface-foreground-soft"}`}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
