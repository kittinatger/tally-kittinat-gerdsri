"use client";

import { useEffect, useState } from "react";
import { describeFetchError } from "@/lib/fetch-error";
import { useT } from "@/lib/language-context";
import type { MessageKey } from "@/lib/i18n/messages";
import {
  SETTINGS_HOME_STYLE_IDS,
  DEFAULT_SETTINGS_HOME_STYLE,
  isSettingsHomeStyleId,
  type SettingsHomeStyleId,
} from "@/lib/settings-home-styles";
import { CheckIcon } from "@/lib/icons";
import ManagerHeader from "./ManagerHeader";

// Small wireframe-style stand-ins for a preview thumbnail — a full real
// layout (profile fetch, ~40 rows) isn't something 6 small cards can
// (or should) render live, so each preview is a purpose-built miniature
// mockup of that layout's actual header/section/row chrome instead,
// using placeholder bars/dots rather than the real data.
function PreviewRow({ square, compact }: { square?: boolean; compact?: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 ${compact ? "py-0.5" : "py-1"}`}>
      <span className={`shrink-0 bg-ink-soft/25 ${square ? "rounded-[3px]" : "rounded-full"} ${compact ? "h-2.5 w-2.5" : "h-3.5 w-3.5"}`} />
      <span className={`flex-1 rounded-full bg-ink-soft/20 ${compact ? "h-1.5" : "h-2"}`} />
    </div>
  );
}

function PreviewCaption() {
  return <span className="mb-1 block h-1 w-8 rounded-full bg-ink-soft/30" />;
}

const PREVIEWS: Record<SettingsHomeStyleId, React.ReactNode> = {
  groupedCards: (
    <div className="w-full space-y-1.5">
      <div className="flex items-center gap-1.5 rounded-md border border-line bg-surface p-1.5">
        <span className="h-4 w-4 shrink-0 rounded-full bg-surface-accent/30" />
        <span className="h-1.5 flex-1 rounded-full bg-ink-soft/25" />
      </div>
      <div className="rounded-md border border-line bg-surface p-1.5">
        <PreviewRow />
        <PreviewRow />
      </div>
    </div>
  ),
  flatSections: (
    <div className="w-full space-y-1.5">
      <div className="flex items-center gap-1.5 p-0.5">
        <span className="h-4 w-4 shrink-0 rounded-full bg-surface-accent/30" />
        <span className="h-1.5 flex-1 rounded-full bg-ink-soft/25" />
      </div>
      <div>
        <PreviewCaption />
        <div className="rounded-lg bg-bg-soft p-1.5">
          <PreviewRow />
          <PreviewRow />
        </div>
      </div>
    </div>
  ),
  titleHeader: (
    <div className="w-full space-y-1.5">
      <span className="mb-0.5 block h-2 w-14 rounded-full bg-foreground/40" />
      <div className="flex items-center gap-1.5 rounded-md border border-line bg-surface p-1.5">
        <span className="h-4 w-4 shrink-0 rounded-full bg-surface-accent/30" />
        <span className="h-1.5 flex-1 rounded-full bg-ink-soft/25" />
      </div>
    </div>
  ),
  squareIcons: (
    <div className="w-full space-y-1.5">
      <div className="flex items-center gap-1.5 border-b border-line pb-1.5">
        <span className="h-4 w-4 shrink-0 rounded-[4px] bg-surface-accent/30" />
        <span className="h-1.5 flex-1 rounded-full bg-ink-soft/25" />
      </div>
      <div>
        <PreviewCaption />
        <PreviewRow square />
        <PreviewRow square />
      </div>
    </div>
  ),
  compactDense: (
    <div className="w-full space-y-1">
      <div className="flex items-center gap-1 rounded-md border border-line bg-surface p-1">
        <span className="h-3 w-3 shrink-0 rounded-full bg-surface-accent/30" />
        <span className="h-1 flex-1 rounded-full bg-ink-soft/25" />
      </div>
      <div className="rounded-md border border-line bg-surface p-1">
        <PreviewRow compact />
        <PreviewRow compact />
        <PreviewRow compact />
      </div>
    </div>
  ),
  bannerHeader: (
    <div className="w-full space-y-1.5">
      <div className="flex items-center gap-1.5 rounded-md bg-gradient-to-br from-navy to-violet-600 p-1.5">
        <span className="h-4 w-4 shrink-0 rounded-full bg-white/40" />
        <span className="h-1.5 flex-1 rounded-full bg-white/40" />
      </div>
      <div className="rounded-md border border-line bg-surface p-1.5">
        <PreviewRow />
        <PreviewRow />
      </div>
    </div>
  ),
};

export default function SettingsHomeStyleSettings() {
  const t = useT();
  const [selected, setSelected] = useState<SettingsHomeStyleId>(DEFAULT_SETTINGS_HOME_STYLE);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (typeof data.settingsHomeStyle === "string" && isSettingsHomeStyleId(data.settingsHomeStyle)) {
          setSelected(data.settingsHomeStyle);
        }
      })
      .catch(() => {
        // Keep the default; the user can still pick and save.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function choose(id: SettingsHomeStyleId) {
    if (id === selected) return;
    const previous = selected;
    setSelected(id);
    setError(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settingsHomeStyle: id }),
      });
      if (!res.ok) {
        setSelected(previous);
        setError("Could not save.");
      }
    } catch (err) {
      setSelected(previous);
      setError(describeFetchError(err));
    }
  }

  return (
    <div>
      <ManagerHeader title={t("settings.settingsHomeStyle")} />
      {error && (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400 animate-[fade-in_0.15s_ease-out] motion-reduce:animate-none">{error}</p>
      )}

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SETTINGS_HOME_STYLE_IDS.map((id) => {
          const active = id === selected;
          return (
            <button
              key={id}
              type="button"
              onClick={() => choose(id)}
              className={`overflow-hidden rounded-card border p-3 text-left transition ${
                active ? "border-navy ring-2 ring-navy/30" : "border-line hover:border-navy/50"
              }`}
            >
              <div className="flex h-24 items-center rounded-xl bg-bg-soft p-2.5">{PREVIEWS[id]}</div>
              <p className="mt-2.5 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                {t(`settingsHomeStyle.${id}.name` as MessageKey)}
                {active && <CheckIcon className="h-3.5 w-3.5 shrink-0 text-navy dark:text-blue-300" />}
              </p>
              <p className="text-[11px] leading-snug text-ink-soft">{t(`settingsHomeStyle.${id}.description` as MessageKey)}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
