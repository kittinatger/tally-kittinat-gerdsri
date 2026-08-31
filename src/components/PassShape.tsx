"use client";

import { heroGradientClasses, colorHeroStyle } from "@/lib/category-styles";
import { cardBackgroundStyle, cardForegroundFor, type CardBackground } from "@/lib/card-backgrounds";
import { isCategoryIconKey } from "@/lib/category-icons";
import { CategoryIcon } from "@/lib/icons";
import { useT } from "@/lib/language-context";
import MembershipCardCode from "./MembershipCardCode";
import {
  STUB_TEMPLATES,
  TEMPLATE_FIELDS,
  defaultLayoutFor,
  type PassTemplate,
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
  template,
  fields,
  layout,
  codeValue,
  codeFormat,
  codeSize = "large",
  logoUrl,
  bannerUrl,
  notes,
}: {
  name: string;
  color: string;
  background?: CardBackground | null;
  /** Manual text-color override — null means auto-contrast against the background. */
  textColor?: string | null;
  icon: string | null;
  template: PassTemplate;
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
}) {
  const t = useT();
  const effectiveLayout = layout ?? defaultLayoutFor(template);
  const fieldByKey = Object.fromEntries(TEMPLATE_FIELDS[template].map((f) => [f.key, f]));
  // The "tear-off stub" notch-divider treatment — see membership-templates.ts
  // for why exactly these three templates get it and not the others.
  const hasStub = STUB_TEMPLATES.includes(template);

  function zoneEntries(zone: PassZone) {
    return (effectiveLayout[zone] ?? [])
      .filter((k): k is string => Boolean(k))
      .map((key) => ({ key, def: fieldByKey[key], value: fields[key] }))
      .filter((f) => f.def && f.value);
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
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- user-uploaded, not a build-time asset
          <img src={logoUrl} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover ring-1" style={{ boxShadow: `0 0 0 1px ${fg.a30}` }} />
        ) : (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: fg.a20 }}>
            {icon && isCategoryIconKey(icon) ? (
              <CategoryIcon iconKey={icon} className="h-4.5 w-4.5" />
            ) : (
              <span className="text-sm font-semibold">{(name || "?").charAt(0).toUpperCase()}</span>
            )}
          </span>
        )}
        <p className="min-w-0 flex-1 truncate font-semibold">{name}</p>
        {headerFields.length > 0 && (
          <div className="flex shrink-0 items-center gap-2 text-right">
            {headerFields.map(({ key, def, value }, i) => (
              <div key={key} className="flex items-center gap-2">
                {i > 0 && <span style={{ color: fg.a60 }}>→</span>}
                <div>
                  <p className="text-[9px] uppercase tracking-wide" style={{ color: fg.a70 }}>
                    {t(def!.labelKey)}
                  </p>
                  <p className="text-sm font-semibold">{value}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {bannerUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- user-uploaded, not a build-time asset
        <img src={bannerUrl} alt="" className="mt-3 aspect-[5/3] w-full rounded-xl object-cover" />
      )}

      {primaryFields.length > 0 && (
        <div className="mt-3">
          {primaryFields.map(({ key, def, value }) => (
            <div key={key}>
              <p className="text-[10px] uppercase tracking-wide" style={{ color: fg.a70 }}>
                {t(def!.labelKey)}
              </p>
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
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {stubFields.map(({ key, def, value }) => (
                <div key={key}>
                  <p className="text-[9px] uppercase tracking-wide" style={{ color: fg.a70 }}>
                    {t(def!.labelKey)}
                  </p>
                  <p className="text-sm font-semibold">{value}</p>
                </div>
              ))}
            </div>
          </div>
        )
      ) : (
        stubFields.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
            {stubFields.map(({ key, def, value }) => (
              <div key={key}>
                <p className="text-[9px] uppercase tracking-wide" style={{ color: fg.a70 }}>
                  {t(def!.labelKey)}
                </p>
                <p className="text-sm font-semibold">{value}</p>
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
        <MembershipCardCode value={codeValue} format={codeFormat} size={codeSize} />
      </div>
    </div>
  );
}
