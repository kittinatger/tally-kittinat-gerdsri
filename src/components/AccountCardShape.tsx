"use client";

import { heroGradientClasses, colorHeroStyle } from "@/lib/category-styles";
import { cardBackgroundStyle, cardForegroundFor } from "@/lib/card-backgrounds";
import { formatCurrency } from "@/lib/format";
import { CARD_ASPECT_CLASSES, CARD_MIN_SIZE_CLASSES, CARD_WIDTH_CLASSES } from "@/lib/card-orientation";
import { useT } from "@/lib/language-context";
import type { WalletOption } from "@/types/wallet";

// The money-account equivalent of WalletCardShape/PassShape — same card
// gradient treatment so accounts and payment cards read as one visual
// family when stacked together on the Wallet page. The aspect ratio (real
// ID-1 card ratio, oriented per wallet.orientation — see
// card-orientation.ts) keeps the shape consistent across the very
// different container widths it renders at, with a min-size floor on
// narrow screens — see WalletCardShape for the full reasoning. Neither
// clips: with no overflow-hidden and height left auto, a long wallet name
// or a large balance ("$1,336.00", once found cut off mid-digit under the
// old aspect-ratio + overflow-hidden approach) still pushes the box
// taller than the ratio implies instead of getting cut off — this 2-child
// justify-between already reflows correctly in a taller (portrait) box
// with no further changes needed.
export default function AccountCardShape({ wallet, currency }: { wallet: WalletOption; currency: string }) {
  const t = useT();
  const fg = cardForegroundFor(wallet.textColor, wallet.background, wallet.color);
  return (
    <div
      className={`flex ${CARD_ASPECT_CLASSES[wallet.orientation]} ${CARD_MIN_SIZE_CLASSES[wallet.orientation]} ${CARD_WIDTH_CLASSES[wallet.orientation]} flex-col justify-between rounded-2xl p-4 shadow-soft ${wallet.background ? "" : heroGradientClasses(wallet.color)}`}
      style={{ color: fg.full, ...(wallet.background ? cardBackgroundStyle(wallet.background) : colorHeroStyle(wallet.color)) }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 truncate text-sm font-semibold">{wallet.name}</p>
        <p className="shrink-0 text-xs font-bold uppercase tracking-wide" style={{ color: fg.a85 }}>
          {wallet.kind === "digital" ? t("wallet.digital") : t("wallet.cash")}
        </p>
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-wide" style={{ color: fg.a70 }}>
          {t("wallet.balanceLabel")}
        </p>
        <p className="truncate text-2xl font-bold">{formatCurrency(wallet.balance, wallet.currency ?? currency)}</p>
      </div>
    </div>
  );
}
