"use client";

import { useState, useEffect } from "react";
import { useCurrency } from "@/lib/currency-context";
import { formatCurrency } from "@/lib/format";
import { useT } from "@/lib/language-context";

export default function WelcomeWidget({
  username,
  remaining,
  balanceLabel,
  onAddExpense,
  onAddIncome,
  onAddTransfer,
}: {
  username: string;
  remaining: number;
  /** Describes what `remaining` is scoped to — the combined total, or a single chosen wallet. */
  balanceLabel?: string;
  /** Omit (or leave undefined) to hide the quick-action row entirely. */
  onAddExpense?: () => void;
  onAddIncome?: () => void;
  onAddTransfer?: () => void;
}) {
  const currency = useCurrency();
  const t = useT();
  const resolvedBalanceLabel = balanceLabel ?? t("welcome.allAccountsBalance");
  const [pictureUrl, setPictureUrl] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/account/profile-picture", { cache: "no-store" });
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
    <div className="relative overflow-hidden rounded-card border border-surface-line bg-gradient-to-br from-surface via-surface to-bg-soft p-5 sm:p-6">
      <div className="pointer-events-none absolute -right-10 -top-14 h-40 w-40 rounded-full bg-surface-accent/10 blur-3xl" />

      <div className="relative mb-5 flex items-start justify-between gap-3">
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
            <p className="truncate font-display text-lg text-foreground">
              {t("welcome.greeting")}
              {username}
            </p>
            <p className="text-xs text-surface-foreground-soft">{t("welcome.welcomeBack")}</p>
          </div>
        </div>
      </div>

      <div className={`relative ${onAddExpense || onAddIncome || onAddTransfer ? "mb-5 space-y-1" : "space-y-1"}`}>
        <p className="text-xs font-semibold uppercase tracking-wide text-surface-foreground-soft">{resolvedBalanceLabel}</p>
        <p className="font-display text-3xl text-foreground">{formatCurrency(remaining, currency)}</p>
      </div>

      {(onAddExpense || onAddIncome || onAddTransfer) && (
        <div className="relative flex gap-2">
          {onAddExpense && (
            <button
              onClick={onAddExpense}
              className="flex-1 rounded-2xl bg-gradient-to-br from-rose-400 to-rose-600 px-3 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
            >
              {t("common.expense")}
            </button>
          )}
          {onAddIncome && (
            <button
              onClick={onAddIncome}
              className="flex-1 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 px-3 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
            >
              {t("common.income")}
            </button>
          )}
          {onAddTransfer && (
            <button
              onClick={onAddTransfer}
              className="flex-1 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 px-3 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
            >
              {t("common.transfer")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
