"use client";

import type { Expense } from "@/types/expense";
import type { CategoryOption } from "@/types/category";
import { formatCurrency, formatDateShort } from "@/lib/format";
import { useCurrency } from "@/lib/currency-context";
import { useT } from "@/lib/language-context";
import { badgeClasses } from "@/lib/category-styles";
import SectionHeader from "./SectionHeader";

function TargetIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="10" cy="10" r="7.25" />
      <circle cx="10" cy="10" r="4" />
      <circle cx="10" cy="10" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

// The single biggest expenses within the period — a quick "what actually
// moved the needle" list, separate from the by-category/by-merchant
// aggregates elsewhere on the page (see biggestTransactions in
// lib/analytics.ts).
export default function BiggestTransactionsSection({
  transactions,
  categories,
}: {
  transactions: Expense[];
  categories: CategoryOption[];
}) {
  const currency = useCurrency();
  const t = useT();

  function colorFor(name: string): string | undefined {
    return categories.find((c) => c.name === name && c.type === "expense")?.color;
  }

  return (
    <div className="animate-[fade-in-up_0.4s_ease-out] motion-reduce:animate-none">
      <SectionHeader icon={<TargetIcon className="h-4 w-4" />} title={t("analytics.sectionBiggest")} description={t("analytics.biggestDesc")} />

      {transactions.length === 0 ? (
        <div className="rounded-card border border-dashed border-line px-4 py-8 text-center">
          <p className="text-sm text-ink-soft">{t("analytics.noMerchantsYet")}</p>
        </div>
      ) : (
        <div className="rounded-card border border-line bg-surface p-2">
          {transactions.map((e, i) => (
            <div
              key={e.id}
              className="flex items-center gap-3 rounded-xl px-2 py-2.5 animate-[fade-in-up_0.35s_ease-out_backwards] motion-reduce:animate-none"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <span className="w-4 shrink-0 text-center text-xs font-bold text-ink-soft">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{e.merchant}</p>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${badgeClasses(colorFor(e.category))}`}>{e.category}</span>
                  <span className="text-[11px] text-ink-soft">{formatDateShort(e.date)}</span>
                </div>
              </div>
              <span className="shrink-0 text-sm font-semibold text-foreground">{formatCurrency(e.amount, currency)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
