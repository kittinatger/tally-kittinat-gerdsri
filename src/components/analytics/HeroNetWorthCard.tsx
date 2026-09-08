"use client";

import { formatCurrency } from "@/lib/format";
import { useCurrency } from "@/lib/currency-context";
import { useT } from "@/lib/language-context";
import { useCountUp } from "@/lib/use-count-up";
import type { TrendPoint } from "../SpendingTrendChart";

function EditIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M13.6 3.6a2 2 0 0 1 2.8 2.8l-8.5 8.5a2 2 0 0 1-.85.5l-3 .86.86-3a2 2 0 0 1 .5-.85Z" />
    </svg>
  );
}

// A tiny decorative sparkline — no axes/labels, just a felt sense of
// direction. Values are normalized to the card's own min/max so a flat
// history still reads as a (flat) line rather than collapsing to nothing.
function Sparkline({ points }: { points: TrendPoint[] }) {
  if (points.length < 2) return null;
  const values = points.map((p) => p.amount);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const w = 200;
  const h = 48;
  const step = w / (points.length - 1);
  const coords = values.map((v, i) => `${i * step},${h - ((v - min) / span) * h}`);
  const linePath = `M ${coords.join(" L ")}`;
  const areaPath = `${linePath} L ${w},${h} L 0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-12 w-full text-white/70">
      <path d={areaPath} fill="currentColor" opacity={0.18} stroke="none" />
      <path d={linePath} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function HeroNetWorthCard({
  netWorth,
  income,
  expense,
  netWorthHistory,
  onEdit,
  compact = false,
}: {
  netWorth: number;
  income: number;
  expense: number;
  netWorthHistory: TrendPoint[];
  onEdit?: () => void;
  compact?: boolean;
}) {
  const currency = useCurrency();
  const t = useT();
  const value = useCountUp(netWorth);

  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-card bg-gradient-to-br from-emerald-700 to-emerald-950 text-white shadow-soft animate-[fade-in-up_0.4s_ease-out_backwards] motion-reduce:animate-none ${
        compact ? "p-4" : "p-5"
      }`}
    >
      <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      <div className="relative flex items-start justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/70">{t("analytics.netWorth")}</p>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            aria-label={t("analytics.editNetWorth")}
            className="rounded-full p-1 text-white/70 transition hover:bg-white/15 hover:text-white active:scale-[0.9]"
          >
            <EditIcon className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <p className={`relative mt-1.5 font-display text-white ${compact ? "text-2xl" : "text-3xl"}`}>
        {formatCurrency(value, currency)}
      </p>
      {compact ? (
        <p className="relative mt-1.5 text-xs text-white/70">
          {t("common.income")} {formatCurrency(income, currency)} · {t("common.expense")} {formatCurrency(expense, currency)}
        </p>
      ) : (
        <div className="relative mt-3">
          <Sparkline points={netWorthHistory} />
        </div>
      )}
    </div>
  );
}
