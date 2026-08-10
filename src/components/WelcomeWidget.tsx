"use client";

import { useState, useEffect } from "react";
import { useCurrency } from "@/lib/currency-context";
import { formatCurrency } from "@/lib/format";

export default function WelcomeWidget({
  username,
  remaining,
  onAddExpense,
  onAddIncome,
  onAddTransfer,
}: {
  username: string;
  remaining: number;
  onAddExpense: () => void;
  onAddIncome: () => void;
  onAddTransfer: () => void;
}) {
  const currency = useCurrency();
  const [pictureUrl, setPictureUrl] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/account/profile-picture");
        if (res.ok) {
          const blob = await res.blob();
          setPictureUrl(URL.createObjectURL(blob));
        }
      } catch {
        // Silently fail — welcome widget still shows without picture
      }
    })();
  }, []);

  return (
    <div className="overflow-hidden rounded-card border border-surface-line bg-gradient-to-br from-surface via-surface to-bg-soft p-5 sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {pictureUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={pictureUrl}
              alt={username}
              className="h-16 w-16 rounded-full object-cover ring-2 ring-surface-accent"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-accent/10">
              <span className="text-2xl font-bold text-surface-accent">{username.charAt(0).toUpperCase()}</span>
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate font-display text-lg text-foreground">Hey, {username}</p>
            <p className="text-xs text-surface-foreground-soft">Welcome back</p>
          </div>
        </div>
      </div>

      <div className="mb-5 space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-surface-foreground-soft">All Accounts • Total Balance</p>
        <p className="font-display text-3xl text-foreground">{formatCurrency(remaining, currency)}</p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onAddExpense}
          className="flex-1 rounded-2xl border border-rose-200/70 bg-gradient-to-br from-rose-50 via-surface to-surface px-3 py-2.5 text-center text-sm font-semibold text-rose-700 shadow-sm transition hover:border-rose-400 dark:border-rose-900/50 dark:from-rose-950/40 dark:via-surface dark:to-surface dark:text-rose-400 dark:hover:border-rose-600"
        >
          Expense
        </button>
        <button
          onClick={onAddIncome}
          className="flex-1 rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-surface to-surface px-3 py-2.5 text-center text-sm font-semibold text-emerald-700 shadow-sm transition hover:border-emerald-400 dark:border-emerald-900/50 dark:from-emerald-950/40 dark:via-surface dark:to-surface dark:text-emerald-400 dark:hover:border-emerald-600"
        >
          Income
        </button>
        <button
          onClick={onAddTransfer}
          className="flex-1 rounded-2xl border border-sky-200/70 bg-gradient-to-br from-sky-50 via-surface to-surface px-3 py-2.5 text-center text-sm font-semibold text-sky-700 shadow-sm transition hover:border-sky-400 dark:border-sky-900/50 dark:from-sky-950/40 dark:via-surface dark:to-surface dark:text-sky-400 dark:hover:border-sky-600"
        >
          Transfer
        </button>
      </div>
    </div>
  );
}
