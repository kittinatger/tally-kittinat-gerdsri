"use client";

import Link from "next/link";
import { formatCurrency } from "@/lib/format";
import { useCurrency } from "@/lib/currency-context";
import { useT } from "@/lib/language-context";
import { hashNameToColor } from "@/lib/category-styles";
import { CATEGORY_PALETTE } from "@/lib/categories";
import type { MerchantRank } from "@/lib/analytics";
import SectionHeader from "./SectionHeader";

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 3h8v4a4 4 0 0 1-8 0V3Z" />
      <path d="M6 4H3.5a1 1 0 0 0-1 1.2l.4 1.6A2 2 0 0 0 4.85 8.3H6M14 4h2.5a1 1 0 0 1 1 1.2l-.4 1.6a2 2 0 0 1-1.95 1.5H14" />
      <path d="M8 12v2a2 2 0 0 0 2 2 2 2 0 0 0 2-2v-2M7 17h6" />
    </svg>
  );
}

// Same deterministic per-name accent color VendorManager's avatarColor uses
// (same palette + hash), so a merchant lands on the same color family here
// and in Settings > Vendors.
function avatarColor(name: string) {
  return hashNameToColor(name, CATEGORY_PALETTE);
}

const AVATAR_BG: Record<string, string> = {
  emerald: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  green: "bg-green-500/15 text-green-700 dark:text-green-300",
  teal: "bg-teal-500/15 text-teal-700 dark:text-teal-300",
  cyan: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300",
  sky: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  blue: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  indigo: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
  violet: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  fuchsia: "bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300",
  pink: "bg-pink-500/15 text-pink-700 dark:text-pink-300",
  rose: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  orange: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
  amber: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  lime: "bg-lime-500/15 text-lime-700 dark:text-lime-300",
  slate: "bg-slate-500/15 text-slate-700 dark:text-slate-300",
};

// Ranks the same merchant data the Settings > Vendors panel manages, but
// scoped to the period already selected elsewhere on this page (see
// topMerchants in lib/analytics.ts) — "who did I spend the most with this
// month" is the analytics-relevant question, distinct from the all-time
// list Vendors shows.
export default function MerchantLeaderboardSection({ merchants }: { merchants: MerchantRank[] }) {
  const currency = useCurrency();
  const t = useT();

  return (
    <div className="animate-[fade-in-up_0.4s_ease-out] motion-reduce:animate-none">
      <SectionHeader
        icon={<TrophyIcon className="h-4 w-4" />}
        title={t("analytics.sectionMerchants")}
        description={t("analytics.merchantsDesc")}
        action={
          <Link href="/settings?panel=vendors" className="shrink-0 text-xs font-semibold text-navy hover:underline dark:text-blue-300">
            {t("analytics.manageVendors")}
          </Link>
        }
      />

      {merchants.length === 0 ? (
        <div className="rounded-card border border-dashed border-line px-4 py-8 text-center">
          <p className="text-sm text-ink-soft">{t("analytics.noMerchantsYet")}</p>
        </div>
      ) : (
        <div className="rounded-card border border-line bg-surface p-2">
          {merchants.map((m, i) => {
            const delta = m.totalSpentPrev > 0 ? ((m.totalSpent - m.totalSpentPrev) / m.totalSpentPrev) * 100 : null;
            return (
              <div
                key={m.name}
                className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-bg-soft animate-[fade-in-up_0.35s_ease-out_backwards] motion-reduce:animate-none"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <span className="w-4 shrink-0 text-center text-xs font-bold text-ink-soft">{i + 1}</span>
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${AVATAR_BG[avatarColor(m.name)]}`}>
                  {m.name.charAt(0).toUpperCase()}
                </span>
                <Link href={`/?vendor=${encodeURIComponent(m.name)}`} className="min-w-0 flex-1 hover:underline">
                  <p className="truncate text-sm font-semibold text-foreground">{m.name}</p>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-bg-soft">
                    <div className="h-full rounded-full bg-navy transition-all duration-500 ease-out" style={{ width: `${Math.max(m.pct, 2)}%` }} />
                  </div>
                </Link>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-foreground">{formatCurrency(m.totalSpent, currency)}</p>
                  <p className="text-[11px] text-ink-soft">
                    {t("analytics.merchantVisits").replace("{count}", String(m.count))}
                    {delta !== null && (
                      <span className={delta > 0 ? "text-red-600 dark:text-red-400" : delta < 0 ? "text-emerald-600 dark:text-emerald-400" : ""}>
                        {" "}
                        · {delta > 0 ? "+" : ""}
                        {Math.round(delta)}%
                      </span>
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
