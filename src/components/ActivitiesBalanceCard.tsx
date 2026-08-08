"use client";

import { useEffect, useRef, useState } from "react";
import { formatCurrency } from "@/lib/format";
import { dotClasses } from "@/lib/category-styles";
import type { TypeFilter } from "./ExpenseList";

function IncomeIcon() {
  return (
    <svg viewBox="0 0 20.2832 27.1875" fill="currentColor" className="h-4 w-4">
      <path d="M19.9219 25.6201C19.9219 24.7412 19.2578 24.0527 18.3789 24.0527L1.5625 24.0527C0.673828 24.0527 0 24.7412 0 25.6201C0 26.499 0.673828 27.1875 1.5625 27.1875L18.3789 27.1875C19.2578 27.1875 19.9219 26.499 19.9219 25.6201ZM1.53809 12.5684C0.65918 12.5684 0 13.2178 0 14.1309C0 14.5605 0.166016 14.9561 0.50293 15.293L8.76953 23.5645C9.07227 23.877 9.52637 24.0576 9.96582 24.0576C10.4053 24.0576 10.8545 23.877 11.1621 23.5645L19.4238 15.293C19.7559 14.9561 19.9219 14.5605 19.9219 14.1309C19.9219 13.2178 19.2627 12.5684 18.3887 12.5684C17.9102 12.5684 17.5195 12.7734 17.2314 13.0713L14.1748 16.1084L9.96582 20.9131L5.75195 16.1084L2.69043 13.0713C2.40723 12.7734 2.0166 12.5684 1.53809 12.5684ZM11.3916 21.1328L11.582 16.4453L11.582 1.7041C11.582 0.708008 10.9277 0.0341797 9.96582 0.0341797C8.99902 0.0341797 8.34961 0.708008 8.34961 1.7041L8.34961 16.4453L8.53516 21.1328C8.57422 21.9189 9.17969 22.5586 9.96582 22.5586C10.752 22.5586 11.3574 21.9189 11.3916 21.1328Z" />
    </svg>
  );
}

function ExpenseIcon() {
  return (
    <svg viewBox="0 0 20.2832 27.1875" fill="currentColor" className="h-4 w-4">
      <path d="M19.9219 1.60156C19.9219 0.722656 19.2578 0.0341797 18.3789 0.0341797L1.5625 0.0341797C0.673828 0.0341797 0 0.722656 0 1.60156C0 2.48047 0.673828 3.16895 1.5625 3.16895L18.3789 3.16895C19.2578 3.16895 19.9219 2.48047 19.9219 1.60156ZM1.53809 14.6533C2.0166 14.6533 2.40723 14.4482 2.69043 14.1553L5.75195 11.1084L9.96582 6.31348L14.1748 11.1084L17.2314 14.1553C17.5195 14.4482 17.9102 14.6533 18.3887 14.6533C19.2627 14.6533 19.9219 14.0039 19.9219 13.0859C19.9219 12.6611 19.7559 12.2705 19.4238 11.9287L11.1621 3.65723C10.8545 3.34473 10.4053 3.16406 9.96582 3.16406C9.52637 3.16406 9.07227 3.34473 8.76953 3.65723L0.50293 11.9287C0.166016 12.2705 0 12.6611 0 13.0859C0 14.0039 0.65918 14.6533 1.53809 14.6533ZM11.3916 6.08887C11.3574 5.30273 10.752 4.66309 9.96582 4.66309C9.17969 4.66309 8.57422 5.30273 8.53516 6.08887L8.34961 10.7812L8.34961 25.5176C8.34961 26.5137 8.99902 27.1875 9.96582 27.1875C10.9277 27.1875 11.582 26.5137 11.582 25.5176L11.582 10.7812Z" />
    </svg>
  );
}

function TransferIcon() {
  return (
    <svg viewBox="0 0 25.1953 30.5469" fill="currentColor" className="h-4.5 w-4.5">
      <path d="M21.6943 21.25L17.5146 21.1133L1.50391 21.1133C0.644531 21.1133 0 21.748 0 22.6172C0 23.4814 0.644531 24.1162 1.50391 24.1162L17.5146 24.1162L21.6943 23.9648C22.6562 23.9355 23.1543 23.2715 23.1543 22.6074C23.1543 21.9336 22.6562 21.2744 21.6943 21.25ZM15.6934 28.0029C15.4004 28.2861 15.2637 28.6426 15.2637 29.0527C15.2637 29.9219 15.8789 30.5469 16.748 30.5469C17.1387 30.5469 17.5635 30.3662 17.8467 30.0781L24.3408 23.7305C24.9902 23.1104 25 22.1289 24.3408 21.499L17.8467 15.1465C17.5635 14.8633 17.1387 14.6826 16.748 14.6826C15.8789 14.6826 15.2637 15.3027 15.2637 16.1768C15.2637 16.5869 15.4004 16.9385 15.6934 17.2266L18.8184 20.2393L21.5186 22.6172L18.7891 25.0195Z" />
      <path d="M3.12988 6.58203C2.17285 6.60645 1.6748 7.26074 1.6748 7.93457C1.6748 8.59863 2.17285 9.2627 3.12988 9.28711L7.31934 9.44336L23.3301 9.44336C24.1895 9.44336 24.834 8.80859 24.834 7.94434C24.834 7.08008 24.1895 6.44043 23.3301 6.44043L7.31934 6.44043ZM9.14062 13.335L6.04492 10.3467L3.31055 7.94434L6.01562 5.56152L9.14062 2.55371C9.43359 2.26562 9.57031 1.91406 9.57031 1.50391C9.57031 0.634766 8.95508 0.00976562 8.08105 0.00976562C7.69531 0.00976562 7.27051 0.195312 6.9873 0.478516L0.493164 6.83105C-0.166016 7.45605-0.15625 8.44238 0.493164 9.05762L6.9873 15.4053C7.27051 15.6885 7.69531 15.8691 8.08105 15.8691C8.95508 15.8691 9.57031 15.249 9.57031 14.3799C9.57031 13.9697 9.43359 13.6084 9.14062 13.335Z" />
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
