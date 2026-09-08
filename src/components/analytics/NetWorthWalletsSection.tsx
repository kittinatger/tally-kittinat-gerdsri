"use client";

import { useState } from "react";
import { useCurrency } from "@/lib/currency-context";
import { useT } from "@/lib/language-context";
import { formatCurrency } from "@/lib/format";
import { CATEGORY_PALETTE } from "@/lib/categories";
import { accentBgClasses } from "@/lib/category-styles";
import { rankWalletsByBalance } from "@/lib/analytics";
import type { TrendPoint } from "../SpendingTrendChart";
import type { WalletOption } from "@/types/wallet";
import SpendingTrendChart, { ChartTypeDropdown, type ChartType } from "../SpendingTrendChart";
import WalletRankedWidget, { type WalletRankedItem } from "../WalletRankedWidget";

export default function NetWorthWalletsSection({ netWorthHistory, wallets }: { netWorthHistory: TrendPoint[]; wallets: WalletOption[] }) {
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

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-lg text-foreground">{t("analytics.sectionNetWorth")}</h2>
          <p className="text-xs text-ink-soft">{t("analytics.netWorthWalletsDesc")}</p>
        </div>
        <ChartTypeDropdown value={chartType} onChange={setChartType} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-card border border-line bg-surface p-4">
          <SpendingTrendChart
            chartType={chartType}
            points={netWorthHistory}
            stackedPoints={[]}
            currency={currency}
            seriesTextClass="text-navy dark:text-blue-300"
            seriesBgClass="bg-navy"
          />
        </div>
        <WalletRankedWidget title={t("analytics.walletsByBalance")} items={walletItems} />
      </div>
    </div>
  );
}
