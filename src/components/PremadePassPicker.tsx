"use client";

import { useEffect, useMemo, useState } from "react";
import { cardBackgroundStyle } from "@/lib/card-backgrounds";
import { heroGradientClasses, colorHeroStyle } from "@/lib/category-styles";
import { PASS_KINDS, KIND_LABEL_KEYS, type PassKind } from "@/lib/membership-templates";
import { useT } from "@/lib/language-context";
import type { PassTemplateOption } from "@/types/pass-template";

function TemplateSwatch({ tpl, onSelect }: { tpl: PassTemplateOption; onSelect: (template: PassTemplateOption) => void }) {
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

// The pass equivalent of PremadeCardPicker — a gallery of admin-approved
// "premade pass" designs (see pass_templates in db.ts) grouped by country,
// filtered by which PassKind they're built for (reusing the pass editor's
// own kind enum as the filter, rather than a separate category enum the
// way card templates have — a pass's fields already depend on its kind,
// so that's the natural grouping here). Renders nothing once loaded if
// there's nothing approved yet.
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

  const otherLabel = t("wallet.templateOtherCountryLabel");
  const groups = new Map<string, PassTemplateOption[]>();
  for (const tpl of filtered) {
    const group = tpl.country?.trim() || otherLabel;
    const existing = groups.get(group);
    if (existing) existing.push(tpl);
    else groups.set(group, [tpl]);
  }
  const sortedGroups = [...groups.entries()].sort(([a], [b]) => {
    if (a === otherLabel) return 1;
    if (b === otherLabel) return -1;
    return a.localeCompare(b);
  });

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
