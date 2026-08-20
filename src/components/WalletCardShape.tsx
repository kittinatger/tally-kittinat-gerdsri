"use client";

import { heroGradientClasses, colorHeroStyle } from "@/lib/category-styles";
import { cardBackgroundStyle, type CardBackground } from "@/lib/card-backgrounds";
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

// A generic 2-letter monogram per network, not the real initials/shapes any
// brand uses — see NetworkBadge below for why.
const NETWORK_MONOGRAMS: Record<CardNetwork, string> = {
  visa: "VI",
  mastercard: "MC",
  amex: "AX",
  discover: "DI",
  other: "••",
};

// A generic rounded-badge monogram, rendered as inline SVG (crisp at any
// size, no raster asset) — deliberately NOT a recreation of any network's
// actual logo mark, wordmark typography, or brand colors: this is a
// decorative pass-style visual, not a licensed payment-brand integration,
// so it stays a plain, original badge regardless of which network is
// selected. Text color inherits from the parent (`currentColor`) so it
// always matches the surrounding white card text.
function NetworkBadge({ network }: { network: CardNetwork }) {
  return (
    <svg viewBox="0 0 40 24" className="h-4 w-7 shrink-0" aria-hidden="true">
      <rect x="0.75" y="0.75" width="38.5" height="22.5" rx="5" fill="none" stroke="currentColor" strokeWidth="1.3" opacity="0.85" />
      <text x="20" y="16.5" textAnchor="middle" fontSize="10" fontWeight="700" fill="currentColor">
        {NETWORK_MONOGRAMS[network]}
      </text>
    </svg>
  );
}

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
  background = null,
  showNetworkBadge = true,
}: {
  label: string;
  holderName: string | null;
  last4: string | null;
  expiryMonth: number | null;
  expiryYear: number | null;
  network: CardNetwork;
  color: string;
  background?: CardBackground | null;
  showNetworkBadge?: boolean;
}) {
  const t = useT();
  const expiry = expiryMonth && expiryYear ? `${String(expiryMonth).padStart(2, "0")}/${String(expiryYear).slice(-2)}` : null;

  return (
    <div
      className={`flex min-h-[190px] w-full flex-col justify-between rounded-2xl p-4 text-white shadow-soft ${background ? "" : heroGradientClasses(color)}`}
      style={background ? cardBackgroundStyle(background) : colorHeroStyle(color)}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 truncate text-sm font-semibold">{label}</p>
        {showNetworkBadge && (
          <div className="flex shrink-0 items-center gap-1.5 text-white/85">
            <NetworkBadge network={network} />
            <p className="text-xs font-bold uppercase tracking-wide">{t(NETWORK_LABEL_KEYS[network])}</p>
          </div>
        )}
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
