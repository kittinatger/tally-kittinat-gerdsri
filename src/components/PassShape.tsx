"use client";

import { heroGradientClasses, colorHeroStyle } from "@/lib/category-styles";
import { cardBackgroundStyle, cardForegroundFor, type CardBackground } from "@/lib/card-backgrounds";
import { isCategoryIconKey } from "@/lib/category-icons";
import { CategoryIcon } from "@/lib/icons";
import { useT } from "@/lib/language-context";
import MembershipCardCode from "./MembershipCardCode";
import {
  STUB_KINDS,
  KIND_FIELDS,
  defaultLayoutFor,
  type PassKind,
  type PassLayout,
  type PassZone,
} from "@/lib/membership-templates";
import type { MembershipCodeFormat } from "@/lib/memberships";

// The shared "what does this pass actually look like" renderer — used by
// both MembershipCardDetail (the big view) and MembershipCardModal's live
// preview, so the two can never drift out of sync with each other.
export default function PassShape({
  name,
  color,
  background = null,
  textColor = null,
  icon,
  kind,
  fields,
  layout,
  codeValue,
  codeFormat,
  codeSize = "large",
  logoUrl,
  bannerUrl,
  notes,
  customFieldLabels = {},
  showLogo = true,
  showName = true,
  hiddenFieldLabels = [],
  showCodeText = true,
}: {
  name: string;
  color: string;
  background?: CardBackground | null;
  /** Manual text-color override — null means auto-contrast against the background. */
  textColor?: string | null;
  icon: string | null;
  kind: PassKind;
  fields: Record<string, string>;
  layout: PassLayout | null;
  codeValue: string;
  codeFormat: MembershipCodeFormat;
  codeSize?: "large" | "small";
  /** A small square mark shown top-left, in place of the icon/initial circle. */
  logoUrl?: string | null;
  /** A large full-width hero image shown under the header, like the "photo"
   * strip on a real Wallet pass. */
  bannerUrl?: string | null;
  /** Shown as a short clamped line on the card face itself (a real Wallet
   * pass surfaces "back field" text the same way) — the full text still
   * gets its own unclamped block in the detail view below the card. */
  notes?: string | null;
  /** User-named fields beyond the kind's own fixed set — key -> plain text
   * label (not an i18n key, since the user typed it themselves). */
  customFieldLabels?: Record<string, string>;
  /** Whether the logo/icon avatar shows in the header — when false, the
   * whole slot disappears (not just the image; the icon/initial fallback
   * too), not merely "no image attached". */
  showLogo?: boolean;
  /** Whether the name shows in the header. */
  showName?: boolean;
  /** Field keys (kind-defined or custom) whose small uppercase label is
   * suppressed on the card face — only the value shows for that field.
   * Doesn't affect the field's value or its layout placement. */
  hiddenFieldLabels?: string[];
  /** Whether the human-readable code value shows alongside the code itself
   * — see MembershipCardCode's own showText prop. */
  showCodeText?: boolean;
}) {
  const t = useT();
  const effectiveLayout = layout ?? defaultLayoutFor(kind);
  const fieldByKey = Object.fromEntries(KIND_FIELDS[kind].map((f) => [f.key, f]));
  // The "tear-off stub" notch-divider treatment — see membership-templates.ts
  // for why exactly these kinds get it and not the others.
  const hasStub = STUB_KINDS.includes(kind);

  // A field's label either comes from the kind's field def i18n key, or —
  // for a user-named custom field — is already plain text stored on the
  // card itself. Resolved once here so every render site below just uses
  // `label` instead of juggling "is this a kind's own field or a custom
  // one" at each call site.
  function zoneEntries(zone: PassZone) {
    return (effectiveLayout[zone] ?? [])
      .filter((k): k is string => Boolean(k))
      .map((key) => {
        const def = fieldByKey[key];
        const label = def ? t(def.labelKey) : customFieldLabels[key];
        return { key, label, value: fields[key], labelHidden: hiddenFieldLabels.includes(key) };
      })
      .filter((f) => f.label && f.value);
  }

  const headerFields = zoneEntries("header");
  const primaryFields = zoneEntries("primary");
  const secondaryFields = zoneEntries("secondary");
  const auxiliaryFields = zoneEntries("auxiliary");
  const stubFields = [...secondaryFields, ...auxiliaryFields];
  const fg = cardForegroundFor(textColor, background, color);

  return (
    // A single card, not two disconnected pieces — the colored header used
    // to be its own rounded box with the (white) code box floating below it
    // as a separate sibling, leaving a visible seam and a lot of dead space
    // around a small code. Now the code area is nested inside the same
    // card, right after whatever fields/notes the template has.
    <div
      className={`w-full overflow-hidden rounded-2xl p-4 ${background ? "" : heroGradientClasses(color)}`}
      style={{ color: fg.full, ...(background ? cardBackgroundStyle(background) : colorHeroStyle(color)) }}
    >
      <div className="flex items-center gap-2.5">
        {showLogo &&
          (logoUrl ? (
            // Sized to the logo's own aspect ratio (fixed height, auto
            // width, capped) rather than forced into the same square
            // every logo used to get squashed into — the crop tool this
            // comes from already lets the user pick whatever shape they
            // want. No border/ring of its own — a logo asset that already
            // has a background/outline (most do) doubled up with one.
            // eslint-disable-next-line @next/next/no-img-element -- user-uploaded, not a build-time asset
            <img src={logoUrl} alt="" className="h-9 w-auto max-w-[7rem] shrink-0 rounded-lg object-contain" />
          ) : (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: fg.a20 }}>
              {icon && isCategoryIconKey(icon) ? (
                <CategoryIcon iconKey={icon} className="h-4.5 w-4.5" />
              ) : (
                <span className="text-sm font-semibold">{(name || "?").charAt(0).toUpperCase()}</span>
              )}
            </span>
          ))}
        {/* Always takes up the flexible space (even with nothing in it)
         * so headerFields still gets pushed to the far right — without
         * this, hiding the name would also collapse the gap that keeps
         * e.g. a boarding pass's FROM/TO fields right-aligned. */}
        <div className="min-w-0 flex-1">{showName && <p className="truncate font-semibold">{name}</p>}</div>
        {headerFields.length > 0 && (
          <div className="flex shrink-0 items-center gap-2 text-right">
            {headerFields.map(({ key, label, value, labelHidden }, i) => (
              <div key={key} className="flex items-center gap-2">
                {i > 0 && <span style={{ color: fg.a60 }}>→</span>}
                <div>
                  {!labelHidden && (
                    <p className="text-[9px] uppercase tracking-wide" style={{ color: fg.a70 }}>
                      {label}
                    </p>
                  )}
                  <p className="text-sm font-semibold">{value}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {bannerUrl && (
        // Full-bleed, edge to edge — real Wallet passes (airline loyalty
        // cards especially) run the hero photo flush to both sides with no
        // inset or corner rounding of its own, unlike the rounded/padded
        // thumbnail this used to be. -mx-4 cancels the card's own p-4 so
        // the image reaches the same edges the card outline does. Sized to
        // the banner's own aspect ratio (fixed width, auto height) rather
        // than forced into a fixed 16:9 box — the crop tool this comes from
        // already lets the user pick whatever shape they want, same as the
        // logo; a max-height keeps a very tall freeform crop from taking
        // over the whole card.
        // eslint-disable-next-line @next/next/no-img-element -- user-uploaded, not a build-time asset
        <img src={bannerUrl} alt="" className="-mx-4 mt-3 h-auto max-h-56 w-[calc(100%+2rem)] max-w-none object-contain" />
      )}

      {primaryFields.length > 0 && (
        <div className="mt-3">
          {primaryFields.map(({ key, label, value, labelHidden }) => (
            <div key={key}>
              {!labelHidden && (
                <p className="text-[10px] uppercase tracking-wide" style={{ color: fg.a70 }}>
                  {label}
                </p>
              )}
              <p className="text-2xl font-bold">{value}</p>
            </div>
          ))}
        </div>
      )}

      {hasStub ? (
        stubFields.length > 0 && (
          <div className="relative mt-3 border-t border-dashed pt-3" style={{ borderColor: fg.a40 }}>
            <span className="absolute -left-2 -top-2 h-3 w-3 rounded-full bg-black/15" />
            <span className="absolute -right-2 -top-2 h-3 w-3 rounded-full bg-black/15" />
            {/* Two-up grid, not a wrapped row of chips — matches the paired
             * label/value rows (MEMBER SINCE / MEMBER NAME, MEMBER STATUS /
             * MEMBER SINCE, ...) every real loyalty/boarding pass uses. */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              {stubFields.map(({ key, label, value, labelHidden }) => (
                <div key={key} className="min-w-0">
                  {!labelHidden && (
                    <p className="text-[9px] uppercase tracking-wide" style={{ color: fg.a70 }}>
                      {label}
                    </p>
                  )}
                  <p className="truncate text-sm font-semibold">{value}</p>
                </div>
              ))}
            </div>
          </div>
        )
      ) : (
        stubFields.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
            {stubFields.map(({ key, label, value, labelHidden }) => (
              <div key={key} className="min-w-0">
                {!labelHidden && (
                  <p className="text-[9px] uppercase tracking-wide" style={{ color: fg.a70 }}>
                    {label}
                  </p>
                )}
                <p className="truncate text-sm font-semibold">{value}</p>
              </div>
            ))}
          </div>
        )
      )}

      {notes && notes.trim() && (
        <p className="mt-3 line-clamp-2 text-xs" style={{ color: fg.a70 }}>
          {notes.trim()}
        </p>
      )}

      <div className="mt-3">
        <MembershipCardCode value={codeValue} format={codeFormat} size={codeSize} showText={showCodeText} />
      </div>
    </div>
  );
}
