"use client";

import { useEffect, useMemo, useState } from "react";
import { cardBackgroundStyle } from "@/lib/card-backgrounds";
import { heroGradientClasses, colorHeroStyle } from "@/lib/category-styles";
import { PASS_KINDS, KIND_LABEL_KEYS, type PassKind } from "@/lib/membership-templates";
import { PASS_TEMPLATE_CATEGORIES, PASS_TEMPLATE_CATEGORY_LABEL_KEYS } from "@/lib/pass-template-category";
import { useT } from "@/lib/language-context";
import type { PassTemplateOption } from "@/types/pass-template";

function TemplateSwatch({ tpl, onSelect }: { tpl: PassTemplateOption; onSelect: (template: PassTemplateOption) => void }) {
  return (
    <button type="button" onClick={() => onSelect(tpl)} className="flex w-16 shrink-0 flex-col items-center gap-1">
      {/* Portrait, not credit-card-shaped — a pass isn't a bank card, and
       * the plain light strip standing in for the code area reads as "a
       * pass" at a glance. */}
      <div className="h-24 w-16 shrink-0 overflow-hidden rounded-lg border border-line shadow-sm">
        <div
          className={`h-2/3 w-full ${tpl.background ? "" : heroGradientClasses(tpl.color)}`}
          style={tpl.background ? cardBackgroundStyle(tpl.background) : colorHeroStyle(tpl.color)}
        />
        <div className="h-1/3 w-full bg-white" />
      </div>
      <span className="w-full truncate text-center text-[11px] text-ink-soft">{tpl.name}</span>
    </button>
  );
}

// The pass equivalent of PremadeCardPicker — a gallery of admin-approved
// "premade pass" designs (see pass_templates in db.ts) grouped by category
// (airline, hotel, retail, ... — see pass-template-category.ts), filtered
// by which PassKind they're built for (reusing the pass editor's own kind
// enum, since a pass's fields already depend on its kind). Category and
// kind are deliberately different axes — an airline's boarding pass and
// an airline's loyalty card share a category but not a kind. Renders
// nothing once loaded if there's nothing approved yet.
export default function PremadePassPicker({ onSelect }: { onSelect: (template: PassTemplateOption) => void }) {
  const t = useT();
  const [templates, setTemplates] = useState<PassTemplateOption[] | null>(null);
  const [kindFilter, setKindFilter] = useState<PassKind | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/pass-templates", { cache: "no-store" })
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

  // Which pass kinds actually appear in the loaded gallery, in the enum's
  // own fixed order — drives both whether the filter row shows at all and
  // which tabs it offers.
  const presentKinds = useMemo(() => {
    if (!templates) return [];
    const present = new Set(templates.map((tpl) => tpl.kind));
    return PASS_KINDS.filter((k) => present.has(k));
  }, [templates]);

  if (!templates || templates.length === 0) return null;

  const filtered = kindFilter ? templates.filter((tpl) => tpl.kind === kindFilter) : templates;

  const otherLabel = t("membership.passCategoryOther");
  const groups = new Map<string, PassTemplateOption[]>();
  for (const tpl of filtered) {
    const group = tpl.category ? t(PASS_TEMPLATE_CATEGORY_LABEL_KEYS[tpl.category]) : otherLabel;
    const existing = groups.get(group);
    if (existing) existing.push(tpl);
    else groups.set(group, [tpl]);
  }
  // Fixed enum order (not alphabetical) — "Other" naturally sorts last
  // since it's the last entry in PASS_TEMPLATE_CATEGORIES.
  const categoryOrder = [...PASS_TEMPLATE_CATEGORIES.map((c) => t(PASS_TEMPLATE_CATEGORY_LABEL_KEYS[c]))];
  const sortedGroups = [...groups.entries()].sort(([a], [b]) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b));

  return (
    <div className="space-y-3 border-b border-line pb-3">
      <label className="block text-xs font-semibold text-ink-soft">{t("membership.premadePassesLabel")}</label>
      {presentKinds.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setKindFilter(null)}
            className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold transition ${
              kindFilter === null
                ? "border-navy bg-navy/10 text-navy dark:text-blue-300"
                : "border-line text-ink-soft hover:bg-[var(--nav-hover-bg)]"
            }`}
          >
            {t("wallet.templateCategoryAll")}
          </button>
          {presentKinds.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKindFilter(k)}
              className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold transition ${
                kindFilter === k
                  ? "border-navy bg-navy/10 text-navy dark:text-blue-300"
                  : "border-line text-ink-soft hover:bg-[var(--nav-hover-bg)]"
              }`}
            >
              {t(KIND_LABEL_KEYS[k])}
            </button>
          ))}
        </div>
      )}
      {sortedGroups.map(([category, group]) => (
        <div key={category}>
          <p className="mb-1 text-[11px] font-semibold text-ink-soft">{category}</p>
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
