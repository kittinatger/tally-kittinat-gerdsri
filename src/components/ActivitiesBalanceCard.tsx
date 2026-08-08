"use client";

import { formatCurrency } from "@/lib/format";
import { dotClasses } from "@/lib/category-styles";
import type { TypeFilter } from "./ExpenseList";

function DepositIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
      <rect x="2.5" y="6" width="15" height="10.5" rx="2.5" />
      <path d="M10 8v5m0 0 2-2m-2 2-2-2" />
    </svg>
  );
}

function WithdrawIcon() {
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

const FILTER_BUTTONS: { type: Exclude<TypeFilter, "all">; label: string; icon: () => React.ReactNode }[] = [
  { type: "income", label: "Deposit", icon: DepositIcon },
  { type: "expense", label: "Withdraw", icon: WithdrawIcon },
  { type: "transfer", label: "Transfer", icon: TransferIcon },
];

export default function ActivitiesBalanceCard({
  balance,
  currency,
  wallets,
  typeFilter,
  onTypeFilterChange,
}: {
  balance: number;
  currency: string;
  wallets: { id: number; name: string; color: string }[];
  typeFilter: TypeFilter;
  onTypeFilterChange: (type: TypeFilter) => void;
}) {
  function toggle(type: Exclude<TypeFilter, "all">) {
    onTypeFilterChange(typeFilter === type ? "all" : type);
  }

  return (
    <div className="relative mb-4 overflow-hidden rounded-card border border-neutral-800 bg-neutral-900 p-5 text-white">
      <div className="pointer-events-none absolute -right-10 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full border border-white/10" />
      <div className="pointer-events-none absolute -right-2 top-1/2 h-36 w-36 -translate-y-1/2 rounded-full border border-white/10" />

      <div className="relative">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Your balance</p>
        <p className="mt-1.5 truncate font-display text-3xl">{formatCurrency(balance, currency)}</p>

        {wallets.length > 0 && (
          <div className="mt-3 flex -space-x-2">
            {wallets.slice(0, 6).map((w) => (
              <span
                key={w.id}
                title={w.name}
                className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white ring-2 ring-neutral-900 ${dotClasses(w.color)}`}
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
                onClick={() => toggle(type)}
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
