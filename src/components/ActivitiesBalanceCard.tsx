"use client";

import { useEffect, useRef, useState } from "react";
import { formatCurrency } from "@/lib/format";
import { dotClasses } from "@/lib/category-styles";
import type { TypeFilter } from "./ExpenseList";

function IncomeIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
      <rect x="2.5" y="6" width="15" height="10.5" rx="2.5" />
      <path d="M10 8v5m0 0 2-2m-2 2-2-2" />
    </svg>
  );
}

function ExpenseIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
      <rect x="2.5" y="6" width="15" height="10.5" rx="2.5" />
      <path d="M10 13V8m0 0-2 2m2-2 2 2" />
    </svg>
  );
}

function TransferIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
      <rect x="2.5" y="6" width="15" height="10.5" rx="2.5" />
      <path d="M7 11.5h6m0 0-2.2-2.2M13 11.5l-2.2 2.2" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <circle cx="10" cy="10" r="2.5" />
      <path d="M10 2.5v1.7m0 11.6v1.7M17.5 10h-1.7M4.2 10H2.5m12.7-5.2-1.2 1.2M6 14 4.8 15.2M15.2 15.2 14 14M6 6 4.8 4.8" />
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
    <div className="relative mb-4 overflow-hidden rounded-card border border-neutral-800 bg-neutral-900 p-5 text-white">
      <div className="pointer-events-none absolute -right-10 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full border border-white/10" />
      <div className="pointer-events-none absolute -right-2 top-1/2 h-36 w-36 -translate-y-1/2 rounded-full border border-white/10" />

      {wallets.length > 1 && (
        <div className="absolute right-3 top-3 z-10" ref={scopeRef}>
          <button
            type="button"
            onClick={() => setScopeOpen((o) => !o)}
            aria-label="Choose wallet"
            aria-expanded={scopeOpen}
            aria-haspopup="listbox"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          >
            <GearIcon />
          </button>
          {scopeOpen && (
            <div
              role="listbox"
              className="absolute right-0 top-[calc(100%+6px)] w-44 overflow-hidden rounded-2xl border border-white/10 bg-neutral-800 p-1.5 shadow-soft"
            >
              <button
                type="button"
                role="option"
                aria-selected={walletFilter === "all"}
                onClick={() => selectWallet("all")}
                className={`w-full rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
                  walletFilter === "all" ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
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
                    walletFilter === w.name ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
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

      <div className="relative">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/60">
          {walletFilter === "all" ? "Your balance" : walletFilter}
        </p>
        <p className="mt-1.5 truncate font-display text-3xl">{formatCurrency(balance, currency)}</p>

        {wallets.length > 0 && (
          <div className="mt-3 flex -space-x-2">
            {wallets.slice(0, 6).map((w) => (
              <span
                key={w.id}
                title={w.name}
                className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white transition ${dotClasses(w.color)} ${
                  walletFilter === w.name ? "ring-2 ring-emerald-400" : "ring-2 ring-neutral-900"
                }`}
              >
                {w.name.slice(0, 1).toUpperCase()}
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between gap-2 rounded-2xl bg-white/5 p-2.5">
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
                    active ? "bg-emerald-400 text-neutral-900" : "bg-white/10 text-white"
                  }`}
                >
                  <Icon />
                </span>
                <span className={`text-xs font-semibold ${active ? "text-white" : "text-white/80"}`}>{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
