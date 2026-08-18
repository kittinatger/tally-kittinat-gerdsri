"use client";

import { heroGradientClasses } from "@/lib/category-styles";
import { formatCurrency } from "@/lib/format";
import { useT } from "@/lib/language-context";
import type { WalletOption } from "@/types/wallet";

// The money-account equivalent of WalletCardShape/PassShape — same card
// aspect ratio and gradient treatment so accounts and payment cards read
// as one visual family when stacked together on the Wallet page.
export default function AccountCardShape({ wallet, currency }: { wallet: WalletOption; currency: string }) {
  const t = useT();
  return (
    <div className={`aspect-[1.586] w-full overflow-hidden rounded-2xl p-4 text-white shadow-soft ${heroGradientClasses(wallet.color)}`}>
      <div className="flex h-full flex-col justify-between">
        <div className="flex items-start justify-between">
          <p className="min-w-0 truncate text-sm font-semibold">{wallet.name}</p>
          <p className="shrink-0 text-xs font-bold uppercase tracking-wide text-white/85">
            {wallet.kind === "digital" ? t("wallet.digital") : t("wallet.cash")}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-white/70">{t("wallet.balanceLabel")}</p>
          <p className="text-2xl font-bold">{formatCurrency(wallet.balance, wallet.currency ?? currency)}</p>
        </div>
      </div>
    </div>
  );
}
