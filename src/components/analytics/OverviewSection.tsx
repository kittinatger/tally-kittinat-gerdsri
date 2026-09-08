"use client";

import { useT } from "@/lib/language-context";
import type { PeriodOverview } from "@/lib/analytics";
import type { TrendPoint } from "../SpendingTrendChart";
import HeroNetWorthCard from "./HeroNetWorthCard";
import StatCard from "./StatCard";

function computeDeltaPct(current: number, previous: number): number | null {
  if (previous === 0) return null;
  const pct = Math.round(((current - previous) / Math.abs(previous)) * 100);
  return pct === 0 ? null : pct;
}

// The page's opening row — a bold Net worth hero plus Income/Expenses/Net
// stat cards. Renders both a mobile and a desktop arrangement in one mount
// (CSS-toggled via sm:hidden / hidden sm:block, same convention as
// WalletManager's renderWalletRow/renderWalletCard) rather than being
// mounted twice from the parent — this component holds no local state
// today, but keeping it self-contained means it never can drift into two
// independent instances if that changes. Mobile shows only the compact
// hero (income/expense folded into its own subtext line, to save vertical
// space at the top of a phone screen); desktop shows the hero beside three
// separate stat cards in one 5-column grid.
export default function OverviewSection({
  netWorth,
  overview,
  netWorthHistory,
  onEditBalance,
}: {
  netWorth: number;
  overview: PeriodOverview;
  netWorthHistory: TrendPoint[];
  onEditBalance?: () => void;
}) {
  const t = useT();
  const vsLastPeriod = t("analytics.vsLastPeriod");

  const incomePct = computeDeltaPct(overview.income, overview.incomePrev);
  const expensePct = computeDeltaPct(overview.expense, overview.expensePrev);
  const netPct = computeDeltaPct(overview.net, overview.netPrev);

  return (
    <>
      <div className="sm:hidden">
        <HeroNetWorthCard
          netWorth={netWorth}
          income={overview.income}
          expense={overview.expense}
          netWorthHistory={netWorthHistory}
          onEdit={onEditBalance}
          compact
        />
      </div>
      <div className="hidden sm:grid sm:grid-cols-5 sm:gap-3">
        <div className="col-span-2">
          <HeroNetWorthCard
            netWorth={netWorth}
            income={overview.income}
            expense={overview.expense}
            netWorthHistory={netWorthHistory}
            onEdit={onEditBalance}
          />
        </div>
        <div className="col-span-1">
          <StatCard
            kind="income"
            label={t("common.income")}
            value={overview.income}
            delta={incomePct !== null ? { pct: incomePct, label: vsLastPeriod } : null}
            delayMs={60}
          />
        </div>
        <div className="col-span-1">
          <StatCard
            kind="expense"
            label={t("common.expense")}
            value={overview.expense}
            delta={expensePct !== null ? { pct: expensePct, label: vsLastPeriod } : null}
            deltaGoodWhenUp={false}
            delayMs={120}
          />
        </div>
        <div className="col-span-1">
          <StatCard
            kind="net"
            label={t("analytics.net")}
            value={overview.net}
            delta={netPct !== null ? { pct: netPct, label: vsLastPeriod } : null}
            delayMs={180}
          />
        </div>
      </div>
    </>
  );
}
