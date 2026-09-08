"use client";

import { useEffect, useState } from "react";
import { describeFetchError } from "@/lib/fetch-error";
import { useT } from "@/lib/language-context";
import type { MessageKey } from "@/lib/i18n/messages";
import { ICON_STYLE_IDS, DEFAULT_ICON_STYLE, isIconStyleId, type IconStyleId } from "@/lib/icon-style";
import { TrashIcon, EditIcon, PlusIcon, GearIcon, HomeIcon, SearchIcon, CheckIcon } from "@/lib/icons";
import ManagerHeader from "./ManagerHeader";

const STORAGE_KEY = "tally-icon-style";

const PREVIEW_ICONS = [TrashIcon, EditIcon, PlusIcon, GearIcon, HomeIcon, SearchIcon];

function applyLocally(id: IconStyleId) {
  document.documentElement.setAttribute("data-icon-style", id);
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // Storage can be unavailable (private browsing, etc.) — the attribute
    // change still takes effect for this page view either way.
  }
}

export default function IconStyleSettings() {
  const t = useT();
  const [selected, setSelected] = useState<IconStyleId>(DEFAULT_ICON_STYLE);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (typeof data.iconStyle === "string" && isIconStyleId(data.iconStyle)) {
          setSelected(data.iconStyle);
        }
      })
      .catch(() => {
        // Keep the default; the user can still pick and save.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function choose(id: IconStyleId) {
    if (id === selected) return;
    const previous = selected;
    setSelected(id);
    applyLocally(id);
    setError(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ iconStyle: id }),
      });
      if (!res.ok) {
        setSelected(previous);
        applyLocally(previous);
        setError("Could not save.");
      }
    } catch (err) {
      setSelected(previous);
      applyLocally(previous);
      setError(describeFetchError(err));
    }
  }

  return (
    <div>
      <ManagerHeader title={t("settings.iconStyle")} />
      {error && (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400 animate-[fade-in_0.15s_ease-out] motion-reduce:animate-none">{error}</p>
      )}

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {ICON_STYLE_IDS.map((id) => {
          const active = id === selected;
          return (
            <button
              key={id}
              type="button"
              onClick={() => choose(id)}
              className={`overflow-hidden rounded-card border p-4 text-left transition ${
                active ? "border-navy ring-2 ring-navy/30" : "border-line hover:border-navy/50"
              }`}
            >
              <div data-icon-style={id} className="flex h-14 items-center justify-center gap-3 rounded-xl bg-bg-soft text-foreground">
                {PREVIEW_ICONS.map((Icon, i) => (
                  <Icon key={i} className="h-5 w-5 shrink-0" />
                ))}
              </div>
              <p className="mt-2.5 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                {t(`iconStyle.${id}.name` as MessageKey)}
                {active && <CheckIcon className="h-3.5 w-3.5 shrink-0 text-navy dark:text-blue-300" />}
              </p>
              <p className="text-[11px] leading-snug text-ink-soft">{t(`iconStyle.${id}.description` as MessageKey)}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
