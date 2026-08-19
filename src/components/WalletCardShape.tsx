"use client";

import { heroGradientClasses, colorHeroStyle } from "@/lib/category-styles";
import { useT } from "@/lib/language-context";
import type { CardNetwork } from "@/lib/wallet-cards";
import type { MessageKey } from "@/lib/i18n/messages";

const NETWORK_LABEL_KEYS: Record<CardNetwork, MessageKey> = {
  visa: "wallet.networkVisa",
  mastercard: "wallet.networkMastercard",
  amex: "wallet.networkAmex",
  discover: "wallet.networkDiscover",
  other: "wallet.networkOther",
};

// Plain text wordmarks rather than the real network logos — this is a
// decorative pass-style visual, not a licensed payment-brand integration,
// so it deliberately avoids reproducing trademarked logo artwork.
//
// Height is min-height + natural content flow (not a fixed aspect-ratio
// box) so a long cardholder name never gets silently clipped — see
// AccountCardShape for the same fix, made after a real balance was found
// cut off mid-digit on a narrow phone screen using the old aspect-ratio +
// overflow-hidden approach.
export default function WalletCardShape({
  label,
  holderName,
  last4,
  expiryMonth,
  expiryYear,
  network,
  color,
}: {
  label: string;
  holderName: string | null;
  last4: string | null;
  expiryMonth: number | null;
  expiryYear: number | null;
  network: CardNetwork;
  color: string;
}) {
  const t = useT();
  const expiry = expiryMonth && expiryYear ? `${String(expiryMonth).padStart(2, "0")}/${String(expiryYear).slice(-2)}` : null;

  return (
    <div
      className={`flex min-h-[190px] w-full flex-col justify-between rounded-2xl p-4 text-white shadow-soft ${heroGradientClasses(color)}`}
      style={colorHeroStyle(color)}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 truncate text-sm font-semibold">{label}</p>
        <p className="shrink-0 text-xs font-bold uppercase tracking-wide text-white/85">{t(NETWORK_LABEL_KEYS[network])}</p>
      </div>

      <div className="flex items-center gap-2">
        <span className="h-6 w-8 shrink-0 rounded-[5px] bg-gradient-to-br from-yellow-200/90 to-yellow-400/80" />
        <p className="truncate text-base font-semibold tracking-[0.15em]">
          •••• •••• •••• {last4 ?? "••••"}
        </p>
      </div>

      <div className="flex items-end justify-between gap-2">
        <p className="min-w-0 truncate text-xs uppercase tracking-wide text-white/85">{holderName || " "}</p>
        {expiry && <p className="shrink-0 text-xs font-semibold text-white/85">{expiry}</p>}
      </div>
    </div>
  );
}
