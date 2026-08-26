"use client";

import { useId, type CSSProperties } from "react";
import { heroGradientClasses, colorHeroStyle } from "@/lib/category-styles";
import { cardBackgroundStyle, cardForegroundFor, type CardBackground } from "@/lib/card-backgrounds";
import { CHIP_COLOR_STOPS, DEFAULT_CHIP_COLOR, type ChipColor } from "@/lib/chip-colors";
import { BADGE_POSITION_CLASSES, DEFAULT_BADGE_POSITION, type BadgePosition } from "@/lib/badge-position";
import { CHIP_POSITION_CLASSES, DEFAULT_CHIP_POSITION, type ChipPosition } from "@/lib/chip-position";
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
  // Unique per rendered instance, not just per color — reusing a plain
  // `chip-${color}` id meant every same-colored chip on the page (e.g. the
  // desktop grid, which shows several cards at once) shared one gradient
  // id. Duplicate SVG ids in one document break `fill="url(#id)"`
  // resolution in Safari specifically, which drops the fill and leaves
  // only the stroke outline visible.
  const gradientId = `chip-${color}-${useId()}`;
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

// aspect-[1.586/1] targets the real ID-1 card ratio so the shape looks
// consistent across the very different container widths it renders at
// (a phone-width bottom-sheet modal, a capped sm:max-w-md dialog, the
// /wallet stack) — without it, height was min-height-only, so the same
// card read square on a narrow phone and badly stretched/flat on a wider
// one. min-h-[190px] stays as a floor for very narrow widths, and neither
// this nor the aspect-ratio clips: with no overflow-hidden and height
// left auto, a long cardholder name or a large balance still pushes the
// box taller than the ratio implies instead of getting cut off — the
// failure mode aspect-ratio + overflow-hidden caused before (see
// AccountCardShape for the matching fix).
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
  badgePosition = DEFAULT_BADGE_POSITION,
  showChip = true,
  chipColor = DEFAULT_CHIP_COLOR,
  chipPosition = DEFAULT_CHIP_POSITION,
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
  /** Which corner the network badge sits in — see badge-position.ts. */
  badgePosition?: BadgePosition;
  showChip?: boolean;
  chipColor?: ChipColor;
  /** Where the chip sits — "middleLeft" (default) keeps it inline next to
   * the card number, exactly as it always rendered; "topLeft"/"bottomLeft"
   * pull it out into its own corner — see chip-position.ts. */
  chipPosition?: ChipPosition;
}) {
  const t = useT();
  const expiry = expiryMonth && expiryYear ? `${String(expiryMonth).padStart(2, "0")}/${String(expiryYear).slice(-2)}` : null;
  const fg = cardForegroundFor(textColor, background, color);
  // The badge floats free of the label/holder/expiry text rows (absolute,
  // anchored to whichever corner is picked) rather than sharing a flex row
  // with them, since any of the 4 corners can coincide with text that's
  // already anchored there (e.g. the label sits top-left, same as a
  // topLeft badge) — reserving space in that row for both would fight the
  // row's own layout logic four different ways. The label and holder-name
  // rows instead reserve horizontal space on whichever side the badge
  // shares their row with, so long text truncates before running under it.
  const badgeOnTop = badgePosition === "topLeft" || badgePosition === "topRight";
  const badgeOnRight = badgePosition === "topRight" || badgePosition === "bottomRight";
  // The chip follows the same free-floating-corner idea as the badge (see
  // above) when pulled out of its default spot inline with the card
  // number — "topLeft"/"bottomLeft" instead share whichever text row sits
  // in that corner, so that row reserves space too. Both reservations are
  // computed as plain pixel widths (not stacked Tailwind classes) since a
  // row can need space from the badge and the chip on the same side at
  // once, and two conflicting padding-left utility classes in one
  // className don't reliably combine — the larger of the two wins here,
  // which is correct since they overlap the same horizontal band rather
  // than sitting side by side.
  const chipInCorner = showChip && chipPosition !== "middleLeft";
  const chipOnTop = chipPosition === "topLeft";
  function rowReserveStyle(isTopRow: boolean): CSSProperties {
    let left = 0;
    let right = 0;
    if (showNetworkBadge && badgeOnTop === isTopRow) {
      if (badgeOnRight) right = 64;
      else left = 64;
    }
    if (chipInCorner && chipOnTop === isTopRow) {
      left = Math.max(left, 40);
    }
    const style: CSSProperties = {};
    if (left) style.paddingLeft = left;
    if (right) style.paddingRight = right;
    return style;
  }
  // When both the badge and the chip land in the same top/bottom-left
  // corner, stack the chip below (or above) the badge instead of drawing
  // them on top of each other.
  const chipSharesCornerWithBadge = chipInCorner && showNetworkBadge && !badgeOnRight && badgeOnTop === chipOnTop;
  const chipCornerClass = chipInCorner
    ? chipOnTop
      ? chipSharesCornerWithBadge
        ? "top-14 left-4"
        : CHIP_POSITION_CLASSES.topLeft
      : chipSharesCornerWithBadge
        ? "bottom-14 left-4"
        : CHIP_POSITION_CLASSES.bottomLeft
    : "";

  return (
    <div
      className={`relative flex aspect-[1.586/1] min-h-[190px] w-full flex-col justify-between rounded-2xl p-4 shadow-soft ${background ? "" : heroGradientClasses(color)}`}
      style={{ color: fg.full, ...(background ? cardBackgroundStyle(background) : colorHeroStyle(color)) }}
    >
      {showNetworkBadge && (
        <div className={`absolute flex items-center gap-1.5 ${BADGE_POSITION_CLASSES[badgePosition]}`} style={{ color: fg.a85 }}>
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

      {chipInCorner && (
        <div className={`absolute ${chipCornerClass}`}>
          <EMVChip color={chipColor} />
        </div>
      )}

      <div className="flex items-start" style={rowReserveStyle(true)}>
        <p className="min-w-0 truncate text-sm font-semibold">{label}</p>
      </div>

      <div className="flex items-center gap-2">
        {showChip && !chipInCorner && <EMVChip color={chipColor} />}
        <p className="truncate text-base font-semibold tracking-[0.15em]">
          •••• •••• •••• {last4 ?? "••••"}
        </p>
      </div>

      <div className="flex items-end justify-between gap-2" style={rowReserveStyle(false)}>
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
