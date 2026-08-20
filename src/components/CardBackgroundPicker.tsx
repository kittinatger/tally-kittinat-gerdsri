"use client";

import { useState } from "react";
import ColorPicker from "./ColorPicker";
import CardPhotoScanModal from "./CardPhotoScanModal";
import { CameraIcon } from "@/lib/icons";
import { useT } from "@/lib/language-context";
import {
  GALLERY_PATTERNS,
  PATTERN_COLOR_COUNT,
  PATTERN_LABEL_KEYS,
  COLOR_SLOT_LABEL_KEYS,
  defaultCardBackground,
  cardBackgroundStyle,
  type CardBackground,
} from "@/lib/card-backgrounds";

// Lets a user pick one of ten pattern/gradient treatments for a card/pass
// background (see card-backgrounds.ts), each with its own independently
// customizable colors — or fall back to "Plain color", the original single-
// ColorPicker flow every card had before this existed. `value: null` means
// plain color is active; the plain color itself lives in the caller's
// existing `color` state (plainColor/onPlainColorChange), same as before.
export default function CardBackgroundPicker({
  value,
  onChange,
  plainColor,
  onPlainColorChange,
  palette,
}: {
  value: CardBackground | null;
  onChange: (background: CardBackground | null) => void;
  plainColor: string;
  onPlainColorChange: (color: string) => void;
  palette?: readonly string[];
}) {
  const t = useT();
  const [scanOpen, setScanOpen] = useState(false);

  function selectPattern(pattern: (typeof GALLERY_PATTERNS)[number]) {
    if (value?.pattern === pattern) return;
    onChange(defaultCardBackground(pattern));
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label={t("background.plain")}
          title={t("background.plain")}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line transition ${
            value === null ? "ring-2 ring-navy ring-offset-2 ring-offset-surface" : ""
          }`}
          style={{ backgroundColor: plainColor.startsWith("#") ? plainColor : undefined }}
        >
          {!plainColor.startsWith("#") && <span className="h-5 w-5 rounded-full bg-[var(--nav-hover-bg)]" />}
        </button>
        {GALLERY_PATTERNS.map((pattern) => (
          <button
            key={pattern}
            type="button"
            onClick={() => selectPattern(pattern)}
            aria-label={t(PATTERN_LABEL_KEYS[pattern]!)}
            title={t(PATTERN_LABEL_KEYS[pattern]!)}
            style={cardBackgroundStyle(defaultCardBackground(pattern))}
            className={`h-11 w-11 shrink-0 rounded-xl border border-line transition ${
              value?.pattern === pattern ? "ring-2 ring-navy ring-offset-2 ring-offset-surface" : ""
            }`}
          />
        ))}
        <button
          type="button"
          onClick={() => setScanOpen(true)}
          aria-label={t("background.scanCard")}
          title={t("background.scanCard")}
          style={value?.pattern === "photo" ? cardBackgroundStyle(value) : undefined}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-ink-soft transition hover:border-navy hover:text-navy dark:hover:text-blue-300 ${
            value?.pattern === "photo" ? "border-line ring-2 ring-navy ring-offset-2 ring-offset-surface" : "border-dashed border-line"
          }`}
        >
          {value?.pattern !== "photo" && <CameraIcon className="h-4.5 w-4.5" />}
        </button>
      </div>

      {scanOpen && (
        <CardPhotoScanModal
          onClose={() => setScanOpen(false)}
          onApply={(background) => {
            onChange(background);
            setScanOpen(false);
          }}
        />
      )}

      {value === null ? (
        <ColorPicker value={plainColor} onChange={onPlainColorChange} palette={palette} />
      ) : value.pattern === "photo" ? (
        <div className="space-y-2.5 rounded-card border border-line bg-bg-soft p-3">
          <p className="text-xs font-semibold text-ink-soft">{t("background.scanCard")}</p>
          <div className="overflow-hidden rounded-xl border border-line">
            {/* eslint-disable-next-line @next/next/no-img-element -- stored/generated data URL, not a build-time asset */}
            <img src={value.photoDataUrl} alt="" className="aspect-[8/5] w-full object-cover" />
          </div>
          <button
            type="button"
            onClick={() => setScanOpen(true)}
            className="w-full rounded-full border border-line px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-[var(--nav-hover-bg)]"
          >
            {t("background.scanCard")}
          </button>
        </div>
      ) : (
        <div className="space-y-2.5 rounded-card border border-line bg-bg-soft p-3">
          <p className="text-xs font-semibold text-ink-soft">{t(PATTERN_LABEL_KEYS[value.pattern]!)}</p>
          {Array.from({ length: PATTERN_COLOR_COUNT[value.pattern] }).map((_, i) => (
            <div key={i}>
              <label className="mb-1.5 block text-xs font-semibold text-ink-soft">{t(COLOR_SLOT_LABEL_KEYS[i])}</label>
              <ColorPicker
                value={value.colors[i]}
                onChange={(c) => {
                  const colors = [...value.colors];
                  colors[i] = c;
                  onChange({ pattern: value.pattern, colors });
                }}
                palette={[]}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
