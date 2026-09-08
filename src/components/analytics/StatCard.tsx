"use client";

import type { CategoryColor } from "@/lib/categories";
import { formatCurrency } from "@/lib/format";
import { useCurrency } from "@/lib/currency-context";
import { useCountUp } from "@/lib/use-count-up";
import WidgetCard, { WIDGET_SOFT_BG, WIDGET_TEXT } from "../WidgetCard";
import DeltaBadge from "./DeltaBadge";

function IncomeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M10 15V5M5 10l5-5 5 5" />
    </svg>
  );
}
function ExpenseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M10 5v10M5 10l5 5 5-5" />
    </svg>
  );
}
function NetIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 7h12M4 13h12M8 4 6 7l2 3M12 16l2-3-2-3" />
    </svg>
  );
}
const ICONS = { income: IncomeIcon, expense: ExpenseIcon, net: NetIcon };

export default function StatCard({
  kind,
  label,
  value,
  delta,
  deltaGoodWhenUp = true,
  delayMs,
}: {
  kind: "income" | "expense" | "net";
  label: string;
  value: number;
  delta: { pct: number; label: string } | null;
  deltaGoodWhenUp?: boolean;
  delayMs?: number;
}) {
  const currency = useCurrency();
  const animated = useCountUp(value);
  const color: CategoryColor = kind === "income" ? "emerald" : kind === "expense" ? "rose" : "sky";
  const Icon = ICONS[kind];
  const positive = delta ? (deltaGoodWhenUp ? delta.pct >= 0 : delta.pct < 0) : false;

  return (
    <WidgetCard color={color} blob="top-right" blobSize="h-20 w-20" delayMs={delayMs}>
      <div className="flex items-center justify-between gap-2">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${WIDGET_SOFT_BG[color]} ${WIDGET_TEXT[color]}`}>
          <Icon className="h-4 w-4" />
        </span>
        {delta && <DeltaBadge pct={delta.pct} positive={positive} label={delta.label} />}
      </div>
      <p className="mt-2.5 text-xs font-semibold uppercase tracking-wide text-surface-foreground-soft">{label}</p>
      <p className="mt-0.5 font-display text-xl text-surface-foreground">{formatCurrency(animated, currency)}</p>
    </WidgetCard>
  );
}
