"use client";

import { heroGradientClasses, colorHeroStyle } from "@/lib/category-styles";
import { cardBackgroundStyle, cardForegroundFor, type CardBackground } from "@/lib/card-backgrounds";
import { CHIP_COLOR_STOPS, DEFAULT_CHIP_COLOR, type ChipColor } from "@/lib/chip-colors";
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

// A generic ISO/EMV-style contact chip — the six-pad house-shaped notch
// pattern is the industry-standard chip look used across every issuer's
// cards, not any one manufacturer's proprietary design, so it's safe to
// render literally rather than needing a "generic" reinterpretation the
// way NetworkBadge does. Colorable via CHIP_COLOR_STOPS (see
// chip-colors.ts) so it can match gold, silver, rose gold, graphite, or
// copper chip finishes.
function EMVChip({ color }: { color: ChipColor }) {
  const { light, base, dark } = CHIP_COLOR_STOPS[color];
  const gradientId = `chip-${color}`;
  return (
    <svg viewBox="0 0 100 74" className="h-6 w-8 shrink-0" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="100" y2="74">
          <stop offset="0%" stopColor={light} />
          <stop offset="55%" stopColor={base} />
          <stop offset="100%" stopColor={dark} />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="98" height="72" rx="9" fill={`url(#${gradientId})`} stroke={dark} strokeWidth="1" />
      <g fill="none" stroke={dark} strokeWidth="1.4" opacity="0.65" strokeLinejoin="round">
        <path d="M40,27 H60 V47 H40 Z" />
        <path d="M40,27 L26,9" />
        <path d="M60,27 L74,9" />
        <path d="M40,47 L26,65" />
        <path d="M60,47 L74,65" />
        <path d="M40,37 H8" />
        <path d="M60,37 H92" />
      </g>
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
  textColor = null,
  showNetworkBadge = true,
  showChip = true,
  chipColor = DEFAULT_CHIP_COLOR,
}: {
  label: string;
  holderName: string | null;
  last4: string | null;
  expiryMonth: number | null;
  expiryYear: number | null;
  network: CardNetwork;
  color: string;
  background?: CardBackground | null;
  /** Manual text-color override — null means auto-contrast against the background. */
  textColor?: string | null;
  showNetworkBadge?: boolean;
  showChip?: boolean;
  chipColor?: ChipColor;
}) {
  const t = useT();
  const expiry = expiryMonth && expiryYear ? `${String(expiryMonth).padStart(2, "0")}/${String(expiryYear).slice(-2)}` : null;
  const fg = cardForegroundFor(textColor, background, color);

  return (
    <div
      className={`flex min-h-[190px] w-full flex-col justify-between rounded-2xl p-4 shadow-soft ${background ? "" : heroGradientClasses(color)}`}
      style={{ color: fg.full, ...(background ? cardBackgroundStyle(background) : colorHeroStyle(color)) }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 truncate text-sm font-semibold">{label}</p>
        {showNetworkBadge && (
          <div className="flex shrink-0 items-center gap-1.5" style={{ color: fg.a85 }}>
            {network === "visa" || network === "discover" ? (
              <div
                aria-label={network}
                className={`h-5 ${network === "visa" ? "aspect-[3840/1247]" : "aspect-[3660/835]"}`}
                style={{
                  backgroundColor: "currentColor",
                  maskImage: `url(/badges/${network}.svg)`,
                  maskSize: "contain",
                  maskRepeat: "no-repeat",
                  maskPosition: "center",
                  WebkitMaskImage: `url(/badges/${network}.svg)`,
                  WebkitMaskSize: "contain",
                  WebkitMaskRepeat: "no-repeat",
                  WebkitMaskPosition: "center",
                }}
              />
            ) : network !== "other" ? (
              <img src={`/badges/${network}.svg`} alt={network} className="h-6 w-auto object-contain" />
            ) : (
              <>
                <NetworkBadge network={network} />
                <p className="text-xs font-bold uppercase tracking-wide">{t(NETWORK_LABEL_KEYS[network])}</p>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {showChip && <EMVChip color={chipColor} />}
        <p className="truncate text-base font-semibold tracking-[0.15em]">
          •••• •••• •••• {last4 ?? "••••"}
        </p>
      </div>

      <div className="flex items-end justify-between gap-2">
        <p className="min-w-0 truncate text-xs uppercase tracking-wide" style={{ color: fg.a85 }}>
          {holderName || " "}
        </p>
        {expiry && (
          <p className="shrink-0 text-xs font-semibold" style={{ color: fg.a85 }}>
            {expiry}
          </p>
        )}
      </div>
    </div>
  );
}
