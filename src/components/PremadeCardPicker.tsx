"use client";

import { useEffect, useState } from "react";
import { cardBackgroundStyle } from "@/lib/card-backgrounds";
import { heroGradientClasses, colorHeroStyle } from "@/lib/category-styles";
import { useT } from "@/lib/language-context";
import type { CardTemplateOption } from "@/types/card-template";

function TemplateSwatch({ tpl, onSelect }: { tpl: CardTemplateOption; onSelect: (template: CardTemplateOption) => void }) {
  return (
    <button type="button" onClick={() => onSelect(tpl)} className="flex w-20 shrink-0 flex-col items-center gap-1">
      <span
        className={`h-12 w-20 shrink-0 rounded-lg border border-line shadow-sm ${tpl.background ? "" : heroGradientClasses(tpl.color)}`}
        style={tpl.background ? cardBackgroundStyle(tpl.background) : colorHeroStyle(tpl.color)}
      />
      <span className="w-full truncate text-center text-[11px] text-ink-soft">{tpl.name}</span>
    </button>
  );
}

// A gallery of admin-approved "premade card" designs (see card_templates
// in db.ts) — picking one applies its background/color/textColor onto the
// wallet currently being edited, same idea as CardBackgroundPicker's
// built-in pattern gallery but sourced from user-submitted, reviewed
// designs instead of the app's own CARD_PATTERNS. Renders nothing at all
// once loaded if there's nothing approved yet, rather than an empty-state
// placeholder taking up space in every editor.
//
// Grouped by country (one horizontal scroll row per group) rather than
// one flat list — with enough templates accumulating across enough
// countries, a single long strip stopped being scannable, and country is
// the natural way most of these (transit/ID cards) are already scoped.
// Templates with no country set land in one "Other" group at the end
// instead of being hidden or forced to guess.
export default function PremadeCardPicker({ onSelect }: { onSelect: (template: CardTemplateOption) => void }) {
  const t = useT();
  const [templates, setTemplates] = useState<CardTemplateOption[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/card-templates", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.templates) setTemplates(data.templates);
      })
      .catch(() => {
        // Quietly show nothing — this is a bonus gallery, not core
        // functionality worth surfacing an error for.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!templates || templates.length === 0) return null;

  const otherLabel = t("wallet.templateOtherCountryLabel");
  const groups = new Map<string, CardTemplateOption[]>();
  for (const tpl of templates) {
    const group = tpl.country?.trim() || otherLabel;
    const existing = groups.get(group);
    if (existing) existing.push(tpl);
    else groups.set(group, [tpl]);
  }
  // Alphabetical, but "Other" always last regardless of where that sorts
  // — it's a catch-all, not a real place, so it shouldn't interleave with
  // actual countries just because of where its label happens to sort.
  const sortedGroups = [...groups.entries()].sort(([a], [b]) => {
    if (a === otherLabel) return 1;
    if (b === otherLabel) return -1;
    return a.localeCompare(b);
  });

  return (
    <div className="space-y-3 border-b border-line pb-3">
      <label className="block text-xs font-semibold text-ink-soft">{t("wallet.premadeCardsLabel")}</label>
      {sortedGroups.map(([country, group]) => (
        <div key={country}>
          <p className="mb-1 text-[11px] font-semibold text-ink-soft">{country}</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {group.map((tpl) => (
              <TemplateSwatch key={tpl.id} tpl={tpl} onSelect={onSelect} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
