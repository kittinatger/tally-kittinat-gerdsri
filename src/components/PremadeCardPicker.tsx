"use client";

import { useEffect, useState } from "react";
import { cardBackgroundStyle } from "@/lib/card-backgrounds";
import { heroGradientClasses, colorHeroStyle } from "@/lib/category-styles";
import { useT } from "@/lib/language-context";
import type { CardTemplateOption } from "@/types/card-template";

// A horizontal gallery of admin-approved "premade card" designs (see
// card_templates in db.ts) — picking one applies its background/color/
// textColor onto the wallet currently being edited, same idea as
// CardBackgroundPicker's built-in pattern gallery but sourced from
// user-submitted, reviewed designs instead of the app's own CARD_PATTERNS.
// Renders nothing at all once loaded if there's nothing approved yet,
// rather than an empty-state placeholder taking up space in every editor.
export default function PremadeCardPicker({ onSelect }: { onSelect: (template: CardTemplateOption) => void }) {
  const t = useT();
  const [templates, setTemplates] = useState<CardTemplateOption[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/card-templates")
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

  return (
    <div className="border-b border-line pb-3">
      <label className="mb-1.5 block text-xs font-semibold text-ink-soft">{t("wallet.premadeCardsLabel")}</label>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {templates.map((tpl) => (
          <button
            key={tpl.id}
            type="button"
            onClick={() => onSelect(tpl)}
            className="flex w-20 shrink-0 flex-col items-center gap-1"
          >
            <span
              className={`h-12 w-20 shrink-0 rounded-lg border border-line shadow-sm ${tpl.background ? "" : heroGradientClasses(tpl.color)}`}
              style={tpl.background ? cardBackgroundStyle(tpl.background) : colorHeroStyle(tpl.color)}
            />
            <span className="w-full truncate text-center text-[11px] text-ink-soft">{tpl.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
