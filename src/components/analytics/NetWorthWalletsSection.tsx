"use client";

import { useState } from "react";
import { useCurrency } from "@/lib/currency-context";
import { useT } from "@/lib/language-context";
import { formatCurrency } from "@/lib/format";
import { CATEGORY_PALETTE } from "@/lib/categories";
import { accentBgClasses, accentStrokeClasses } from "@/lib/category-styles";
import { rankWalletsByBalance } from "@/lib/analytics";
import type { TrendPoint } from "../SpendingTrendChart";
import type { WalletOption } from "@/types/wallet";
import SpendingTrendChart, { ChartTypeDropdown, type ChartType } from "../SpendingTrendChart";
import WidgetCard from "../WidgetCard";
import DonutRing from "./DonutRing";
import SectionHeader from "./SectionHeader";

type WalletRankedItem = { label: string; value: number; displayValue: string; colorClassName: string };

function WalletIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h11A1.5 1.5 0 0 1 17 6.5V14a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 3 14Z" />
      <path d="M13 10.5h2" />
    </svg>
  );
}

// Mobile-only: a compact horizontally-scrollable "chip" row instead of the
// desktop ranked list + donut — cheaper to scan on a narrow screen, and
// feels more like a native swipeable card rail than a vertical list.
function WalletChipRow({ items }: { items: WalletRankedItem[] }) {
  if (items.length === 0) return null;
  return (
    <div className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1">
      {items.map((item, i) => (
        <div
          key={item.label}
          className="flex min-w-[132px] shrink-0 flex-col gap-1.5 rounded-card border border-line bg-surface p-3 animate-[fade-in-up_0.4s_ease-out_backwards] motion-reduce:animate-none"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-sm ${item.colorClassName}`}>
            {item.label.charAt(0).toUpperCase()}
          </span>
          <span className="truncate text-xs font-medium text-foreground">{item.label}</span>
          <span className="text-sm font-semibold text-foreground">{item.displayValue}</span>
        </div>
      ))}
    </div>
  );
}

export default function NetWorthWalletsSection({
  netWorthHistory,
  wallets,
}: {
  netWorthHistory: TrendPoint[];
  wallets: WalletOption[];
}) {
  const currency = useCurrency();
  const t = useT();
  const [chartType, setChartType] = useState<ChartType>("area");

  const rankedWallets = rankWalletsByBalance(wallets);
  const walletItems: WalletRankedItem[] = rankedWallets.map((w, i) => ({
    label: w.name,
    value: Math.max(w.balance, 0),
    displayValue: formatCurrency(w.balance, w.currency ?? currency),
    colorClassName: accentBgClasses(CATEGORY_PALETTE[i % CATEGORY_PALETTE.length]),
  }));
  const donutSegments = rankedWallets
    .filter((w) => w.balance > 0)
    .map((w, i) => ({
      label: w.name,
      value: w.balance,
      colorClass: accentStrokeClasses(CATEGORY_PALETTE[i % CATEGORY_PALETTE.length]),
    }));
  const totalBalance = donutSegments.reduce((sum, s) => sum + s.value, 0);

  const chart = (
    <SpendingTrendChart
      chartType={chartType}
      points={netWorthHistory}
      stackedPoints={[]}
      currency={currency}
      seriesTextClass="text-navy dark:text-blue-300"
      seriesBgClass="bg-navy"
    />
  );

  return (
    <div className="animate-[fade-in-up_0.4s_ease-out] motion-reduce:animate-none">
      <SectionHeader
        icon={<WalletIcon className="h-4 w-4" />}
        title={t("analytics.sectionNetWorth")}
        description={t("analytics.netWorthWalletsDesc")}
        action={<ChartTypeDropdown value={chartType} onChange={setChartType} />}
      />

      <div className="space-y-3 sm:hidden">
        <div className="rounded-card border border-line bg-gradient-to-br from-bg-soft to-surface p-4">{chart}</div>
        <WalletChipRow items={walletItems} />
      </div>
      <div className="hidden sm:grid sm:grid-cols-5 sm:gap-3">
        <div className="col-span-3 rounded-card border border-line bg-gradient-to-br from-bg-soft to-surface p-4">{chart}</div>
        <div className="col-span-2">
          <WidgetCard color="sky" blob="top-right" blobSize="h-28 w-28">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-sky-700/80 dark:text-sky-300/80">
              {t("analytics.walletsByBalance")}
            </p>
            {walletItems.length > 0 && (
              <DonutRing segments={donutSegments} centerValue={formatCurrency(totalBalance, currency)} />
            )}
            <div className="mt-3">
              <WalletListInline items={walletItems} />
            </div>
          </WidgetCard>
        </div>
      </div>
    </div>
  );
}

// The same ranked-list markup WalletRankedWidget renders, minus its own
// WidgetCard shell — reused bare here since the donut above already lives
// inside one shared WidgetCard for this desktop layout.
function WalletListInline({ items }: { items: WalletRankedItem[] }) {
  const max = Math.max(...items.map((i) => i.value), 1);
  if (items.length === 0) return null;
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2.5">
          <span className="relative shrink-0">
            <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-sm ${item.colorClassName}`}>
              {item.label.charAt(0).toUpperCase()}
            </span>
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-surface-foreground">{item.label}</p>
            <p className="mt-0.5 text-sm font-semibold text-sky-700 dark:text-sky-300">{item.displayValue}</p>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-sky-900/10 dark:bg-sky-100/10">
              <div
                className={`h-full rounded-full transition-all duration-500 ease-out ${item.colorClassName}`}
                style={{ width: `${Math.max(4, (item.value / max) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
