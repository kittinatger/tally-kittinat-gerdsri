"use client";

import { formatCurrency } from "@/lib/format";
import { useCurrency } from "@/lib/currency-context";
import type { PeriodOverview } from "@/lib/analytics";

function deltaText(current: number, previous: number): { text: string; positive: boolean } | null {
  if (previous === 0) return null;
  const pct = Math.round(((current - previous) / Math.abs(previous)) * 100);
  if (pct === 0) return null;
  return { text: `${pct > 0 ? "+" : ""}${pct}% vs last period`, positive: pct >= 0 };
}

function EditIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
      <path d="M13.6 3.6a2 2 0 0 1 2.8 2.8l-8.5 8.5a2 2 0 0 1-.85.5l-3 .86.86-3a2 2 0 0 1 .5-.85Z" />
    </svg>
  );
}

function StatCard({
  label,
  value,
  delta,
  deltaGoodWhenUp = true,
  onEdit,
}: {
  label: string;
  value: string;
  delta: { text: string; positive: boolean } | null;
  deltaGoodWhenUp?: boolean;
  onEdit?: () => void;
}) {
  const good = delta ? (deltaGoodWhenUp ? delta.positive : !delta.positive) : null;
  return (
    <div className="rounded-card border border-line bg-surface p-4">
      <div className="flex items-center justify-between gap-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</p>
        {onEdit && (
          <button type="button" onClick={onEdit} aria-label={`Edit ${label}`} className="rounded-full p-1 text-ink-soft transition hover:bg-[var(--nav-hover-bg)] hover:text-foreground">
            <EditIcon />
          </button>
        )}
      </div>
      <p className="mt-1.5 font-display text-xl text-foreground">{value}</p>
      {delta && (
        <p className={`mt-1 text-[11px] font-semibold ${good ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
          {delta.text}
        </p>
      )}
    </div>
  );
}

export default function OverviewStrip({
  netWorth,
  overview,
  onEditBalance,
}: {
  netWorth: number;
  overview: PeriodOverview;
  onEditBalance?: () => void;
}) {
  const currency = useCurrency();
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard label="Net worth" value={formatCurrency(netWorth, currency)} delta={null} onEdit={onEditBalance} />
      <StatCard label="Income" value={formatCurrency(overview.income, currency)} delta={deltaText(overview.income, overview.incomePrev)} />
      <StatCard
        label="Expenses"
        value={formatCurrency(overview.expense, currency)}
        delta={deltaText(overview.expense, overview.expensePrev)}
        deltaGoodWhenUp={false}
      />
      <StatCard label="Net" value={formatCurrency(overview.net, currency)} delta={deltaText(overview.net, overview.netPrev)} />
    </div>
  );
}
