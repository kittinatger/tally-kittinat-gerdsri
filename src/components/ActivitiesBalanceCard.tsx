"use client";

import { useEffect, useRef, useState } from "react";
import { formatCurrency } from "@/lib/format";
import { dotClasses } from "@/lib/category-styles";
import { GearIcon } from "@/lib/icons";
import type { TypeFilter } from "./ExpenseList";

function IncomeIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M5 15L15 5M15 5H7M15 5V13" />
    </svg>
  );
}

function ExpenseIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M15 5L5 15M5 15H13M5 15V7" />
    </svg>
  );
}

function TransferIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
      <path d="M3 6.5h12l-3-3M17 13.5H5l3 3" />
    </svg>
  );
}

const FILTER_BUTTONS: { type: Exclude<TypeFilter, "all">; label: string; icon: () => React.ReactNode }[] = [
  { type: "expense", label: "Expense", icon: ExpenseIcon },
  { type: "income", label: "Income", icon: IncomeIcon },
  { type: "transfer", label: "Transfer", icon: TransferIcon },
];

export default function ActivitiesBalanceCard({
  wallets,
  currency,
  typeFilter,
  onTypeFilterChange,
  walletFilter,
  onWalletFilterChange,
}: {
  wallets: { id: number; name: string; color: string; balance: number }[];
  currency: string;
  typeFilter: TypeFilter;
  onTypeFilterChange: (type: TypeFilter) => void;
  walletFilter: string;
  onWalletFilterChange: (wallet: string) => void;
}) {
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

  const balance =
    walletFilter === "all"
      ? wallets.reduce((sum, w) => sum + w.balance, 0)
      : (wallets.find((w) => w.name === walletFilter)?.balance ?? 0);

  function toggleType(type: Exclude<TypeFilter, "all">) {
    onTypeFilterChange(typeFilter === type ? "all" : type);
  }

  function selectWallet(name: string) {
    onWalletFilterChange(name);
    setScopeOpen(false);
  }

  return (
    <div className="relative mb-4 rounded-card border border-surface-line bg-surface p-5 text-surface-foreground">
      {wallets.length > 1 && (
        <div className="absolute right-3 top-3 z-10" ref={scopeRef}>
          <button
            type="button"
            onClick={() => setScopeOpen((o) => !o)}
            aria-label="Choose wallet"
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
                All wallets
              </button>
              {wallets.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  role="option"
                  aria-selected={walletFilter === w.name}
                  onClick={() => selectWallet(w.name)}
                  className={`flex w-full items-center gap-2 truncate rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
                    walletFilter === w.name
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
          {walletFilter === "all" ? "Your balance" : walletFilter}
        </p>
        <p className="mt-1.5 truncate font-display text-3xl">{formatCurrency(balance, currency)}</p>

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
