"use client";

import { useId, type CSSProperties } from "react";
import { heroGradientClasses, colorHeroStyle } from "@/lib/category-styles";
import { cardBackgroundStyle, cardForegroundFor, type CardBackground } from "@/lib/card-backgrounds";
import { formatCurrency } from "@/lib/format";
import { CHIP_COLOR_STOPS, DEFAULT_CHIP_COLOR, type ChipColor } from "@/lib/chip-colors";
import { BADGE_POSITION_CLASSES, DEFAULT_BADGE_POSITION, DEFAULT_NFC_POSITION, type BadgePosition } from "@/lib/badge-position";
import { CHIP_POSITION_CLASSES, DEFAULT_CHIP_POSITION, chipRow, chipColumn, type ChipPosition } from "@/lib/chip-position";
import { NFC_SIZE_CLASSES, DEFAULT_NFC_SIZE, type NfcSize } from "@/lib/nfc-size";
import { NAME_POSITION_CLASSES, DEFAULT_NAME_POSITION, type NamePosition } from "@/lib/name-position";
import {
  CARD_NUMBER_POSITION_CLASSES,
  DEFAULT_CARD_NUMBER_POSITION,
  type CardNumberPosition,
} from "@/lib/card-number-position";
import { useT } from "@/lib/language-context";
import type { CardNetwork } from "@/lib/wallet-cards";
import type { MessageKey } from "@/lib/i18n/messages";

const NETWORK_LABEL_KEYS: Record<CardNetwork, MessageKey> = {
  visa: "wallet.networkVisa",
  mastercard: "wallet.networkMastercard",
  amex: "wallet.networkAmex",
  discover: "wallet.networkDiscover",
  jcb: "wallet.networkJcb",
  unionpay: "wallet.networkUnionPay",
  "apple-pay": "wallet.networkApplePay",
  other: "wallet.networkOther",
};

// Networks whose badge is recolorable (via CSS mask-image, so it always
// matches iconColor/text color) rather than rendered as a fixed-color brand
// logo image — each entry's aspect ratio is its source SVG's own
// width/height, so the masked shape doesn't stretch. Adding a network here
// only makes sense for a single-color-silhouette-friendly mark: mask-image
// uses the source's alpha channel only, discarding any of its own colors
// (fine for JCB's tricolor logo — it reads clearly as a plain silhouette
// too — but would lose real detail on a mark that depends on distinct
// colored regions to read at all).
export const RECOLORABLE_BADGE_ASPECT: Partial<Record<CardNetwork, string>> = {
  visa: "3840/1247",
  discover: "3660/835",
  jcb: "3000/2315",
  "apple-pay": "513/211.2",
};

// The sentinel iconColor value meaning "don't recolor this badge at all —
// render its real brand-color artwork" — see cardIconColorSchema in
// validation.ts. Only meaningful for a network in RECOLORABLE_BADGE_ASPECT;
// a fixed-logo network (mastercard, amex, unionpay) already always renders
// its original colors, recolorable or not.
export const ICON_COLOR_ORIGINAL = "original";

// A generic 2-letter monogram per network, not the real initials/shapes any
// brand uses — see NetworkBadge below for why.
const NETWORK_MONOGRAMS: Record<CardNetwork, string> = {
  visa: "VI",
  mastercard: "MC",
  amex: "AX",
  discover: "DI",
  jcb: "JC",
  unionpay: "UP",
  "apple-pay": "AP",
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

// The standard contactless-payment "sound wave" glyph — three concentric
// quarter-arcs, same mark every real contactless-enabled card carries
// regardless of issuer or network, so (like EMVChip) this renders the
// literal industry symbol rather than a per-network reinterpretation.
function NfcIcon({ size = DEFAULT_NFC_SIZE }: { size?: NfcSize }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className={`shrink-0 ${NFC_SIZE_CLASSES[size]}`}
      aria-hidden="true"
    >
      <path d="M8.5 4.5a11 11 0 0 1 0 15" />
      <path d="M5.5 7.5a7 7 0 0 1 0 9" />
      <path d="M2.5 10.5a3 3 0 0 1 0 3" />
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
  iconColor = null,
  showNetworkBadge = true,
  badgePosition = DEFAULT_BADGE_POSITION,
  showChip = true,
  chipColor = DEFAULT_CHIP_COLOR,
  chipPosition = DEFAULT_CHIP_POSITION,
  showNfc = false,
  nfcPosition = DEFAULT_NFC_POSITION,
  nfcSize = DEFAULT_NFC_SIZE,
  balance = null,
  currency = "",
  showBalance = false,
  showCurrency = true,
  showCardNumber = true,
  cardNumberLast4Only = false,
  cardNumberPosition = DEFAULT_CARD_NUMBER_POSITION,
  showName = true,
  showHolderName = true,
  showExpiry = true,
  namePosition = DEFAULT_NAME_POSITION,
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
  /** Manual network-badge/icon color override — null means it follows
   * textColor's resolved color; ICON_COLOR_ORIGINAL ("original") means
   * render the network's real brand-color artwork instead of recoloring it
   * at all. Only visible on visa/discover/jcb/apple-pay (mask-recolored)
   * and the generic monogram badge; other networks render a fixed-color
   * brand logo that isn't tintable at all. */
  iconColor?: string | null;
  showNetworkBadge?: boolean;
  /** Which corner the network badge sits in — see badge-position.ts. */
  badgePosition?: BadgePosition;
  showChip?: boolean;
  chipColor?: ChipColor;
  /** Where the chip sits — a full 3x3 grid (see chip-position.ts);
   * "middleLeft" (default) centers it vertically against the card's left
   * edge, same as before that grid existed. */
  chipPosition?: ChipPosition;
  /** Whether the contactless/NFC symbol renders. Defaults false so an
   * existing wallet is unaffected until its owner turns this on. */
  showNfc?: boolean;
  /** Which corner the NFC symbol sits in — independent of badgePosition
   * (its own selector, not tied to the network badge), though the two
   * stack neatly when pointed at the same corner — see badge-position.ts,
   * reused here rather than a near-identical position enum of its own. */
  nfcPosition?: BadgePosition;
  /** How big the NFC symbol renders — see nfc-size.ts. */
  nfcSize?: NfcSize;
  /** Balance to preview on the card face — only rendered when showBalance
   * is true AND a number is actually passed (so a purely decorative card
   * with no real account behind it, the default, shows nothing extra). */
  balance?: number | null;
  /** Currency code for the balance preview — the caller resolves
   * `wallet.currency ?? appCurrency` before passing this in, same as
   * AccountCardShape's `currency` prop; only read when balance is shown. */
  currency?: string;
  /** Whether the balance preview row shows at all. */
  showBalance?: boolean;
  /** Whether that row's amount is currency-formatted (localized, symbol)
   * or shown as a bare number — both only apply when showBalance is true. */
  showCurrency?: boolean;
  /** Whether the masked "•••• •••• •••• 1234" row shows at all — no full
   * PAN is ever stored, so at best this is the last4 digits and at worst
   * (no last4 set) it's an all-dots placeholder some users would rather
   * not show. */
  showCardNumber?: boolean;
  /** When true, shows just the bare last4 digits ("1234") instead of the
   * full masked "•••• •••• •••• 1234" row — only meaningful when
   * showCardNumber is true. */
  cardNumberLast4Only?: boolean;
  /** Where the card-number row sits — "top" (default) stays in its
   * original inline row; "middle"/"bottom" pull it out into a free-
   * floating full-width row instead, same idea as chipPosition — see
   * card-number-position.ts. */
  cardNumberPosition?: CardNumberPosition;
  /** Whether the wallet's name renders on the card face at all. */
  showName?: boolean;
  /** Whether the holder-name text renders at all — previously always shown
   * regardless of every other toggle, so "hide everything" still left
   * real holder-name text visible with no way to turn it off. */
  showHolderName?: boolean;
  /** Whether the expiry date renders at all (only matters when both
   * expiryMonth and expiryYear are set — same gap as showHolderName). */
  showExpiry?: boolean;
  /** Which corner the holder-name text sits in — "bottomLeft" (default)
   * keeps it inline in the bottom row next to the expiry date, exactly as
   * it always rendered; any other corner pulls it out into a free-
   * floating element instead, same idea as badgePosition/chipPosition —
   * see name-position.ts. */
  namePosition?: NamePosition;
}) {
  const t = useT();
  const expiry = expiryMonth && expiryYear ? `${String(expiryMonth).padStart(2, "0")}/${String(expiryYear).slice(-2)}` : null;
  const fg = cardForegroundFor(textColor, background, color);
  // iconColor defaults to whatever the text is resolving to (auto-contrast
  // or the manual textColor override) rather than its own independent
  // auto-contrast pass — so leaving it unset keeps the badge visually tied
  // to the text the way it always was, and setting it is a deliberate
  // departure from that, not a second unrelated "auto" guess. "original"
  // isn't a real color at all — it skips recoloring entirely (see the
  // badge render below) — so it's excluded here rather than fed into
  // cardForegroundFor, which expects a hex color or null.
  const isOriginalIcon = iconColor === ICON_COLOR_ORIGINAL;
  const iconFg = iconColor && !isOriginalIcon ? cardForegroundFor(iconColor, background, color) : fg;
  // The badge floats free of the label/holder/expiry text rows (absolute,
  // anchored to whichever corner is picked) rather than sharing a flex row
  // with them, since any of the 4 corners can coincide with text that's
  // already anchored there (e.g. the label sits top-left, same as a
  // topLeft badge) — reserving space in that row for both would fight the
  // row's own layout logic four different ways. The label and holder-name
  // rows instead reserve horizontal space on whichever side the badge
  // shares their row with, so long text truncates before running under it.
  // The badge and NFC symbol each pick their own corner independently now
  // (previously NFC always shared the badge's) — cornerOccupants tells the
  // reservation/stacking logic below how many of the two land in a given
  // corner, so two things sharing one corner reserve more room and stack
  // instead of drawing on top of each other.
  const badgeCorner: BadgePosition | null = showNetworkBadge ? badgePosition : null;
  const nfcCorner: BadgePosition | null = showNfc ? nfcPosition : null;
  function cornerOccupants(corner: BadgePosition): number {
    return (badgeCorner === corner ? 1 : 0) + (nfcCorner === corner ? 1 : 0);
  }
  // The chip is always a free-floating absolutely-positioned element now
  // (like the badge) rather than only when pulled into a corner — its
  // default "middleLeft" is a real vertical center against the card's
  // left edge, not just "inline with the card-number row" (which used to
  // read as "near the top", not the middle its label promised). It now
  // moves on a full 3x3 grid (chip-position.ts) rather than only the left
  // edge, so a corner spot ("topLeft", "bottomRight", ...) can coincide
  // with the badge/NFC corner and needs the same reservation/stacking
  // treatment; "Center" columns never correspond to a real corner.
  const chipInCorner = showChip;
  const chipRowValue = chipRow(chipPosition);
  const chipColumnValue = chipColumn(chipPosition);
  const chipCorner: BadgePosition | null =
    chipRowValue === "middle" || chipColumnValue === "center"
      ? null
      : (`${chipRowValue}${chipColumnValue === "left" ? "Left" : "Right"}` as BadgePosition);
  // At the default position, the holder name stays exactly where it always
  // rendered — inline in the bottom row next to the expiry date — so no
  // existing card's layout changes. Any other corner pulls it out into its
  // own free-floating element instead (like the badge/chip), which is what
  // lets a premade-card template put the name wherever its own artwork's
  // placeholder text used to sit.
  const nameInCorner = namePosition !== DEFAULT_NAME_POSITION;
  // Same idea as nameInCorner — "top" (DEFAULT_CARD_NUMBER_POSITION) stays
  // inline in its original row; "middle"/"bottom" pull it out into a
  // free-floating full-width row instead (checked directly at each render
  // site below so TypeScript narrows cardNumberPosition to "middle" |
  // "bottom" for CARD_NUMBER_POSITION_CLASSES' lookup).
  const cardNumberText = cardNumberLast4Only ? (last4 ?? "••••") : `•••• •••• •••• ${last4 ?? "••••"}`;
  // Both reservations are computed as plain pixel widths (not stacked
  // Tailwind classes) since a row can need space from more than one
  // corner element at once, and conflicting padding utility classes in one
  // className don't reliably combine — the larger reservation on each side
  // wins, which is correct since they overlap the same horizontal band
  // rather than sitting side by side.
  function rowReserveStyle(isTopRow: boolean): CSSProperties {
    const leftCorner: BadgePosition = isTopRow ? "topLeft" : "bottomLeft";
    const rightCorner: BadgePosition = isTopRow ? "topRight" : "bottomRight";
    let left = cornerOccupants(leftCorner) > 0 ? (cornerOccupants(leftCorner) === 2 ? 88 : 64) : 0;
    let right = cornerOccupants(rightCorner) > 0 ? (cornerOccupants(rightCorner) === 2 ? 88 : 64) : 0;
    // "Center" chip columns never correspond to a real corner (see
    // chipCorner above), so they never reserve row space either — the
    // designer picking "center" is choosing to let it float over whatever
    // else is centered there.
    if (chipInCorner && chipRowValue === (isTopRow ? "top" : "bottom")) {
      if (chipColumnValue === "left") left = Math.max(left, 40);
      else if (chipColumnValue === "right") right = Math.max(right, 40);
    }
    const style: CSSProperties = {};
    if (left) style.paddingLeft = left;
    if (right) style.paddingRight = right;
    return style;
  }
  // When the chip lands in the same corner as the badge and/or NFC symbol,
  // stack it below (or above) them instead of drawing on top — only
  // possible when the chip is actually in a corner (see chipCorner above).
  const chipCornerOccupants = chipCorner ? cornerOccupants(chipCorner) : 0;
  const chipSharesCorner = chipCornerOccupants > 0;
  // The card-number row needs its own reservation now that the chip is
  // *always* a free-floating absolutely-positioned element — it used to
  // sit inline as a flex child (in the "top" row specifically), which
  // pushed the number text over for free; nothing does that automatically
  // anymore, for any of the three number positions. Both chip and number
  // default to "middle" now, so they land in the exact same spot
  // (top-1/2, left-4) unless reserved for. Compared by row only (a chip's
  // horizontal column doesn't matter here — the card number is always a
  // single centered/left row, never split left vs. right) — rather than
  // only guarding the "top" case, since any matching pair can now collide.
  // "top" keeps the broader guard from before (anything but a
  // bottom-anchored chip is plausibly close enough on a short card) since
  // that's empirically what the original overlap report needed —
  // "middle"/"bottom" use exact row matching.
  // "Center" chip columns never correspond to a real corner (see the
  // rowReserveStyle comment above) — excluded here too, since without it
  // a centered chip fell into the `chipColumnValue === "right" ? ... :
  // left-padding` branch below as if it were left-anchored, shifting the
  // number's padding the wrong way while leaving the actual (centered)
  // collision unprotected.
  const cardNumberReservesForChip =
    showCardNumber &&
    chipInCorner &&
    chipColumnValue !== "center" &&
    (cardNumberPosition === "top" ? chipRowValue !== "bottom" : chipRowValue === cardNumberPosition);
  const chipCornerClass = !chipInCorner
    ? ""
    : !chipCorner
      ? CHIP_POSITION_CLASSES[chipPosition]
      : chipSharesCorner
        ? `${chipRowValue === "top" ? "top-14" : "bottom-14"} ${chipColumnValue === "left" ? "left-4" : "right-4"}`
        : CHIP_POSITION_CLASSES[chipPosition];
  // The holder name can also be pulled into one of the same four corners
  // (see nameInCorner) — previously it just used NAME_POSITION_CLASSES
  // directly, with no awareness that the badge/NFC row and/or the chip
  // might already be sitting in that exact spot (e.g. namePosition and
  // the default badgePosition are both "topRight"), drawing straight on
  // top of them. Name is last in stacking priority (it adapts to
  // whatever's already there, nothing adapts to it) — one slot per
  // occupant already in its corner, same idea as the chip's own
  // top-14/bottom-14 stacking above.
  const nameCorner: BadgePosition | null = nameInCorner ? namePosition : null;
  // cornerOccupants can return 2 for a merged badge+nfc row (see above) —
  // that's still only one visual row to stack past, so it's clamped to a
  // boolean "is anything from badge/nfc there at all" before adding the
  // chip's own (also boolean) presence.
  const nameCornerSlot = nameCorner ? (cornerOccupants(nameCorner) > 0 ? 1 : 0) + (chipCorner === nameCorner ? 1 : 0) : 0;
  const nameCornerClass = !nameCorner
    ? ""
    : nameCornerSlot <= 0
      ? NAME_POSITION_CLASSES[namePosition]
      : `${nameCorner.startsWith("top") ? (nameCornerSlot === 1 ? "top-14" : "top-24") : nameCornerSlot === 1 ? "bottom-14" : "bottom-24"} ${
          nameCorner.endsWith("Left") ? "left-4" : "right-4"
        }`;

  return (
    <div
      className={`relative flex aspect-[1.586/1] min-h-[190px] w-full flex-col rounded-2xl p-4 shadow-soft transition-colors duration-300 ${background ? "" : heroGradientClasses(color)}`}
      style={{ color: fg.full, ...(background ? cardBackgroundStyle(background) : colorHeroStyle(color)) }}
    >
      {showNetworkBadge &&
        (() => {
          const networkBadgeContent =
            RECOLORABLE_BADGE_ASPECT[network] && !isOriginalIcon ? (
              <div
                aria-label={network}
                className="h-5"
                style={{
                  aspectRatio: RECOLORABLE_BADGE_ASPECT[network],
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
            );
          // The badge and NFC symbol render as one flex row (icon-by-icon,
          // like a real card) when pointed at the same corner; otherwise
          // each gets its own independent absolutely-positioned spot.
          if (showNfc && nfcPosition === badgePosition) {
            return (
              <div
                className={`absolute flex items-center gap-1.5 transition-all duration-300 ease-out ${BADGE_POSITION_CLASSES[badgePosition]}`}
                style={{ color: iconFg.a85 }}
              >
                <NfcIcon size={nfcSize} />
                {networkBadgeContent}
              </div>
            );
          }
          return (
            <div
              className={`absolute flex items-center gap-1.5 transition-all duration-300 ease-out ${BADGE_POSITION_CLASSES[badgePosition]}`}
              style={{ color: iconFg.a85 }}
            >
              {networkBadgeContent}
            </div>
          );
        })()}

      {showNfc && !(showNetworkBadge && nfcPosition === badgePosition) && (
        <div className={`absolute transition-all duration-300 ease-out ${BADGE_POSITION_CLASSES[nfcPosition]}`} style={{ color: iconFg.a85 }}>
          <NfcIcon size={nfcSize} />
        </div>
      )}

      {chipInCorner && (
        <div className={`absolute transition-all duration-300 ease-out ${chipCornerClass}`}>
          <EMVChip color={chipColor} />
        </div>
      )}

      {showHolderName && nameInCorner && (
        <p
          className={`absolute max-w-[65%] truncate text-xs uppercase tracking-wide transition-all duration-300 ease-out ${nameCornerClass}`}
          style={{ color: fg.a85 }}
        >
          {holderName || " "}
        </p>
      )}

      {showCardNumber && cardNumberPosition !== "top" && (
        <p
          className={`absolute truncate text-base font-semibold tracking-[0.15em] transition-all duration-300 ease-out ${CARD_NUMBER_POSITION_CLASSES[cardNumberPosition]}`}
          style={
            cardNumberReservesForChip
              ? chipColumnValue === "right"
                ? { paddingRight: 40 }
                : { paddingLeft: 40 }
              : undefined
          }
        >
          {cardNumberText}
        </p>
      )}

      {/* Top content stacks tightly from the top (no justify-between any
       * more — see the outer div) rather than being evenly spaced against
       * the balance/holder block below: with justify-between, every toggle
       * that changes how many rows have real content (showName,
       * showCardNumber/showChip, showBalance) changed how much space was
       * "left over" to distribute, which visibly moved the balance block
       * up or down depending on which toggles were on — most obviously,
       * a payment-card-look wallet's balance never sat as low as a plain
       * account's (AccountCardShape, a simple 2-child justify-between)
       * because this card always has more top-level rows above it. Now
       * the balance/holder block is pushed to the bottom explicitly
       * (mt-auto, below) regardless of how much or how little sits above
       * it, matching AccountCardShape's flush-bottom balance exactly. */}
      <div className="flex min-h-5 items-start" style={rowReserveStyle(true)}>
        {showName && <p className="min-w-0 truncate text-sm font-semibold">{label}</p>}
      </div>

      <div className="mt-2 flex min-h-6 items-center gap-2" style={cardNumberReservesForChip ? { paddingLeft: 40 } : undefined}>
        {showCardNumber && cardNumberPosition === "top" && (
          <p className="truncate text-base font-semibold tracking-[0.15em]">{cardNumberText}</p>
        )}
      </div>

      {/* Grouped into one block (rather than the balance being its own
       * top-level row) so mt-auto below pushes both down together as one
       * unit, flush to the card's bottom edge. The holder/expiry row comes
       * BEFORE the balance here (not after) so the balance is genuinely the
       * last thing in the block — with it last, nothing sits below it and
       * its baseline lands flush against the card's bottom edge exactly
       * like AccountCardShape's balance (which has nothing below it
       * either). Balance-after-holder looked reasonable on its own but put
       * the holder/expiry row below the balance, which meant the balance
       * text itself never reached the bottom edge and sat visibly higher
       * than AccountCardShape's. */}
      {/* Reserves room above the holder/expiry+balance block for a
       * bottom-anchored card number — that row is a free-floating
       * absolutely-positioned element at the same bottom-4 inset this
       * block's own bottom edge naturally lands on (mt-auto pushes it
       * flush to the card's bottom edge), so without this margin the two
       * drew directly on top of each other. */}
      <div className={`mt-auto ${showCardNumber && cardNumberPosition === "bottom" ? "mb-7" : ""}`}>
        <div className="flex items-end justify-between gap-2" style={rowReserveStyle(false)}>
          <p className="min-w-0 truncate text-xs uppercase tracking-wide" style={{ color: fg.a85 }}>
            {showHolderName && !nameInCorner ? holderName || " " : " "}
          </p>
          {expiry && showExpiry && (
            <p className="shrink-0 text-xs font-semibold" style={{ color: fg.a85 }}>
              {expiry}
            </p>
          )}
        </div>
        {showBalance && balance !== null && (
          <div className="mt-2">
            <p className="text-[10px] uppercase tracking-wide" style={{ color: fg.a70 }}>
              {t("wallet.balanceLabel")}
            </p>
            <p className="truncate text-2xl font-bold">{showCurrency ? formatCurrency(balance, currency) : balance.toFixed(2)}</p>
          </div>
        )}
      </div>
    </div>
  );
}
