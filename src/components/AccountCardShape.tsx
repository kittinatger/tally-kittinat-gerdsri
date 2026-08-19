"use client";

import { heroGradientClasses, colorHeroStyle } from "@/lib/category-styles";
import { cardBackgroundStyle } from "@/lib/card-backgrounds";
import { formatCurrency } from "@/lib/format";
import { useT } from "@/lib/language-context";
import type { WalletOption } from "@/types/wallet";

// The money-account equivalent of WalletCardShape/PassShape — same card
// gradient treatment so accounts and payment cards read as one visual
// family when stacked together on the Wallet page. Height is min-height +
// natural content flow (not a fixed aspect-ratio box) so a long wallet
// name or a large balance never gets silently clipped — see the sibling
// components for the same fix, made after a real balance ("$1,336.00")
// was found cut off mid-digit on a narrow phone screen.
export default function AccountCardShape({ wallet, currency }: { wallet: WalletOption; currency: string }) {
  const t = useT();
  return (
    <div
      className={`flex min-h-[190px] w-full flex-col justify-between rounded-2xl p-4 text-white shadow-soft ${wallet.background ? "" : heroGradientClasses(wallet.color)}`}
      style={wallet.background ? cardBackgroundStyle(wallet.background) : colorHeroStyle(wallet.color)}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 truncate text-sm font-semibold">{wallet.name}</p>
        <p className="shrink-0 text-xs font-bold uppercase tracking-wide text-white/85">
          {wallet.kind === "digital" ? t("wallet.digital") : t("wallet.cash")}
        </p>
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-wide text-white/70">{t("wallet.balanceLabel")}</p>
        <p className="truncate text-2xl font-bold">{formatCurrency(wallet.balance, wallet.currency ?? currency)}</p>
      </div>
    </div>
  );
}
