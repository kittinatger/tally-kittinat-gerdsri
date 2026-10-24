"use client";

import type { CategoryColor } from "@/lib/categories";
import { formatCurrency } from "@/lib/format";
import { useCurrency } from "@/lib/currency-context";
import { useCountUp } from "@/lib/use-count-up";
import WidgetCard, { WIDGET_SOFT_BG, WIDGET_TEXT } from "../WidgetCard";
import DeltaBadge from "./DeltaBadge";
import { ArrowDownLeftIcon as PhArrowDownLeftIcon, ArrowUpRightIcon as PhArrowUpRightIcon, ScalesIcon as PhScalesIcon } from "@phosphor-icons/react/dist/ssr";

function IncomeIcon({ className }: { className?: string }) {
  return <PhArrowUpRightIcon weight="fill" aria-hidden="true" className={className} />;
}
function ExpenseIcon({ className }: { className?: string }) {
  return <PhArrowDownLeftIcon weight="fill" aria-hidden="true" className={className} />;
}
function NetIcon({ className }: { className?: string }) {
  return <PhScalesIcon weight="fill" aria-hidden="true" className={className} />;
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
        <span data-icon-badge className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${WIDGET_SOFT_BG[color]} ${WIDGET_TEXT[color]}`}>
          <Icon className="h-4 w-4" />
        </span>
        {delta && <DeltaBadge pct={delta.pct} positive={positive} label={delta.label} />}
      </div>
      <p className="mt-2.5 text-xs font-semibold uppercase tracking-wide text-surface-foreground-soft">{label}</p>
      <p className="mt-0.5 font-display text-xl text-surface-foreground">{formatCurrency(animated, currency)}</p>
    </WidgetCard>
  );
}
