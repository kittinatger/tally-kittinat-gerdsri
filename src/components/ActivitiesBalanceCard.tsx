"use client";

import { useEffect, useRef, useState } from "react";
import { formatCurrency } from "@/lib/format";
import { dotClasses } from "@/lib/category-styles";
import type { TypeFilter } from "./ExpenseList";

function IncomeIcon() {
  return (
    <svg viewBox="0 0 23.3203 22.959" fill="currentColor" className="h-4.5 w-4.5">
      <path d="M22.959 3.76953L22.959 19.1992C22.959 21.6797 21.6797 22.959 19.1504 22.959L3.79883 22.959C1.2793 22.959 0 21.6992 0 19.1992L0 3.76953C0 1.26953 1.2793 0 3.79883 0L19.1504 0C21.6797 0 22.959 1.2793 22.959 3.76953ZM10.6055 5.86914L10.6055 13.5742L10.6636 15.4631L9.84375 14.5996L7.71484 12.3828C7.55859 12.1973 7.31445 12.1094 7.09961 12.1094C6.64062 12.1094 6.30859 12.4414 6.30859 12.8906C6.30859 13.125 6.39648 13.3105 6.57227 13.4766L10.8594 17.6367C11.0742 17.8613 11.2695 17.9395 11.4941 17.9395C11.7188 17.9395 11.9141 17.8613 12.1387 17.6367L16.416 13.4766C16.582 13.3105 16.6797 13.125 16.6797 12.8906C16.6797 12.4414 16.3281 12.1094 15.8789 12.1094C15.6543 12.1094 15.4199 12.1973 15.2637 12.3828L13.1445 14.5996L12.3247 15.4631L12.3828 13.5742L12.3828 5.86914C12.3828 5.40039 11.9824 5.00977 11.4941 5.00977C11.0156 5.00977 10.6055 5.40039 10.6055 5.86914Z" />
    </svg>
  );
}

function ExpenseIcon() {
  return (
    <svg viewBox="0 0 23.3203 22.959" fill="currentColor" className="h-4.5 w-4.5">
      <path d="M22.959 3.76953L22.959 19.1992C22.959 21.6797 21.6797 22.959 19.1504 22.959L3.79883 22.959C1.2793 22.959 0 21.6992 0 19.1992L0 3.76953C0 1.26953 1.2793 0 3.79883 0L19.1504 0C21.6797 0 22.959 1.2793 22.959 3.76953ZM10.8594 5.30273L6.57227 9.46289C6.39648 9.62891 6.30859 9.81445 6.30859 10.0488C6.30859 10.498 6.64062 10.8301 7.09961 10.8301C7.31445 10.8301 7.55859 10.7422 7.71484 10.5566L9.84375 8.33984L10.6639 7.47602L10.6055 9.375L10.6055 17.0703C10.6055 17.5391 11.0156 17.9395 11.4941 17.9395C11.9824 17.9395 12.3828 17.5391 12.3828 17.0703L12.3828 9.375L12.3244 7.47602L13.1445 8.33984L15.2637 10.5566C15.4199 10.7422 15.6543 10.8301 15.8789 10.8301C16.3281 10.8301 16.6797 10.498 16.6797 10.0488C16.6797 9.81445 16.582 9.62891 16.416 9.46289L12.1387 5.30273C11.9141 5.07812 11.7188 5.00977 11.4941 5.00977C11.2695 5.00977 11.0742 5.07812 10.8594 5.30273Z" />
    </svg>
  );
}

function TransferIcon() {
  return (
    <svg viewBox="0 0 23.3203 22.959" fill="currentColor" className="h-4.5 w-4.5">
      <path d="M22.959 3.76953L22.959 19.1992C22.959 21.6797 21.6797 22.959 19.1504 22.959L3.79883 22.959C1.2793 22.959 0 21.6992 0 19.1992L0 3.76953C0 1.26953 1.2793 0 3.79883 0L19.1504 0C21.6797 0 22.959 1.2793 22.959 3.76953ZM12.9688 12.0215C12.9688 12.2168 13.0469 12.4121 13.1934 12.5488L14.668 13.9941L15.3963 14.625L14.6289 14.6094L5.83984 14.6094C5.41992 14.6094 5.11719 14.9316 5.11719 15.3418C5.11719 15.7617 5.42969 16.084 5.83984 16.084L14.6387 16.084L15.3815 16.0636L14.668 16.709L13.1934 18.1641C13.0469 18.3105 12.9688 18.4961 12.9688 18.6914C12.9688 19.1113 13.2715 19.4043 13.6914 19.4043C13.877 19.4043 14.082 19.3359 14.2285 19.1895L17.5684 15.8984C17.8613 15.6152 17.8613 15.0977 17.5684 14.8145L14.2285 11.5332C14.082 11.3867 13.877 11.2988 13.6914 11.2988C13.2715 11.2988 12.9688 11.6016 12.9688 12.0215ZM8.70117 3.79883L5.37109 7.08008C5.06836 7.36328 5.07812 7.87109 5.37109 8.16406L8.70117 11.4648C8.85742 11.6016 9.05273 11.6699 9.24805 11.6699C9.66797 11.6699 9.9707 11.377 9.9707 10.957C9.9707 10.7617 9.89258 10.5762 9.74609 10.4297L8.27148 8.98438L7.54089 8.32359L8.30078 8.34961L17.0996 8.34961C17.5098 8.34961 17.8223 8.02734 17.8223 7.61719C17.8223 7.1875 17.5195 6.875 17.0996 6.875L8.31055 6.875L7.54862 6.89055L8.27148 6.25977L9.74609 4.81445C9.89258 4.66797 9.9707 4.48242 9.9707 4.27734C9.9707 3.86719 9.66797 3.56445 9.24805 3.56445C9.05273 3.56445 8.85742 3.65234 8.70117 3.79883Z" />
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
