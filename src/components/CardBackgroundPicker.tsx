"use client";

import { useEffect, useState, type CSSProperties } from "react";
import ColorPicker from "./ColorPicker";
import CardPhotoScanModal from "./CardPhotoScanModal";
import { CameraIcon, ChevronIcon } from "@/lib/icons";
import { useT } from "@/lib/language-context";
import {
  GALLERY_PATTERNS,
  PATTERN_COLOR_COUNT,
  PATTERN_LABEL_KEYS,
  COLOR_SLOT_LABEL_KEYS,
  defaultCardBackground,
  cardBackgroundStyle,
  isSvgPattern,
  type CardBackground,
} from "@/lib/card-backgrounds";
import { isSvgDataUrl, decodeSvgDataUrl, encodeSvgDataUrl, extractSvgColors, recolorSvg } from "@/lib/svg-recolor";

function LockIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="4.5" y="9" width="11" height="8" rx="2" />
      <path d="M6.5 9V6.5a3.5 3.5 0 0 1 7 0V9" />
    </svg>
  );
}

function UnlockIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="4.5" y="9" width="11" height="8" rx="2" />
      <path d="M6.5 9V6.5a3.5 3.5 0 0 1 6.5-1.8" />
    </svg>
  );
}

// Lets a user pick one of the many pattern/gradient treatments for a
// card/pass background (see card-backgrounds.ts), each with its own
// independently customizable colors — or fall back to "Plain color", the
// original single-ColorPicker flow every card had before this existed.
// `value: null` means plain color is active; the plain color itself lives
// in the caller's existing `color` state (plainColor/onPlainColorChange),
// same as before. The gallery has grown well past what fits comfortably
// on screen at once, so it's collapsed behind a summary toggle by
// default — expanded automatically only while actively picking (i.e. a
// pattern isn't settled yet, which never happens once `value` exists),
// so returning to edit an existing card doesn't dump 50+ swatches in
// front of the user before they've asked to change anything.
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
  const [galleryOpen, setGalleryOpen] = useState(false);
  // Whether an SVG's colors are currently editable — either one of the
  // built-in SVG-illustration patterns, or a custom SVG file the user
  // uploaded themselves via "Scan a card" (see CardPhotoScanModal's SVG
  // upload path — it applies the raw file as-is, `{ pattern: "photo",
  // photoDataUrl }`, unlike every other pattern's structured `colors`
  // array). Starts locked every time (a brand-new card, one applied from a
  // picked premade template, or one that already existed before this lock
  // existed all behave identically: colors read-only until explicitly
  // unlocked here). Not persisted anywhere; this is purely "am I actively
  // editing right now", so it resets to locked again whenever the
  // background itself changes (a different pattern, or a newly
  // scanned/uploaded photo/SVG).
  const [svgColorsUnlocked, setSvgColorsUnlocked] = useState(false);
  const lockResetKey = !value ? null : value.pattern === "photo" ? value.photoDataUrl : value.pattern;
  const isCustomSvg = value?.pattern === "photo" && isSvgDataUrl(value.photoDataUrl);
  const customSvgColors = isCustomSvg ? extractSvgColors(decodeSvgDataUrl((value as { photoDataUrl: string }).photoDataUrl)) : [];

  useEffect(() => {
    setSvgColorsUnlocked(false);
  }, [lockResetKey]);

  function recolorCustomSvg(from: string, to: string) {
    if (!value || value.pattern !== "photo") return;
    const markup = recolorSvg(decodeSvgDataUrl(value.photoDataUrl), from, to);
    onChange({ pattern: "photo", photoDataUrl: encodeSvgDataUrl(markup) });
  }

  function selectPattern(pattern: (typeof GALLERY_PATTERNS)[number]) {
    if (value?.pattern === pattern) return;
    onChange(defaultCardBackground(pattern));
  }

  const summaryLabel =
    value === null ? t("background.plain") : value.pattern === "photo" ? t("background.scanCard") : t(PATTERN_LABEL_KEYS[value.pattern]!);
  const summaryStyle: CSSProperties =
    value === null
      ? { backgroundColor: plainColor.startsWith("#") ? plainColor : undefined }
      : value.pattern === "photo"
        ? { backgroundImage: `url(${value.photoDataUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
        : cardBackgroundStyle(value);

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setGalleryOpen((open) => !open)}
        aria-expanded={galleryOpen}
        className="flex w-full items-center gap-2.5 rounded-xl border border-line bg-bg-soft px-3 py-2.5 text-left transition hover:border-navy"
      >
        <span className="h-8 w-8 shrink-0 rounded-lg border border-line" style={summaryStyle} />
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">{summaryLabel}</span>
        <ChevronIcon className={`h-4 w-4 shrink-0 text-ink-soft transition-transform ${galleryOpen ? "rotate-180" : ""}`} />
      </button>

      {galleryOpen && (
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
      )}

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
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-ink-soft">{t("background.scanCard")}</p>
            {/* Only a custom-uploaded SVG has discrete colors to edit — a
             * real photo is just pixels. */}
            {isCustomSvg && customSvgColors.length > 0 && (
              <button
                type="button"
                onClick={() => setSvgColorsUnlocked((v) => !v)}
                className={`flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                  svgColorsUnlocked
                    ? "border-navy bg-navy/10 text-navy dark:text-blue-300"
                    : "border-line text-ink-soft hover:bg-[var(--nav-hover-bg)]"
                }`}
              >
                {svgColorsUnlocked ? <UnlockIcon /> : <LockIcon />}
                {t("background.editColors")}
              </button>
            )}
          </div>
          <div className="overflow-hidden rounded-xl border border-line">
            {/* eslint-disable-next-line @next/next/no-img-element -- stored/generated data URL, not a build-time asset */}
            <img src={value.photoDataUrl} alt="" className="aspect-[8/5] w-full object-cover" />
          </div>
          {isCustomSvg && customSvgColors.length > 0 && (
            svgColorsUnlocked ? (
              <div className="space-y-2.5 border-t border-line pt-2.5">
                {customSvgColors.map((c) => (
                  <ColorPicker key={c} value={c} onChange={(next) => recolorCustomSvg(c, next)} palette={[]} />
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-ink-soft">{t("background.colorsLockedDesc")}</p>
            )
          )}
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
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-ink-soft">{t(PATTERN_LABEL_KEYS[value.pattern]!)}</p>
            {/* Only SVG-illustration patterns get this lock — a plain CSS
             * gradient/texture pattern's colors stay always-editable below,
             * same as before this existed. */}
            {isSvgPattern(value.pattern) && (
              <button
                type="button"
                onClick={() => setSvgColorsUnlocked((v) => !v)}
                className={`flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                  svgColorsUnlocked
                    ? "border-navy bg-navy/10 text-navy dark:text-blue-300"
                    : "border-line text-ink-soft hover:bg-[var(--nav-hover-bg)]"
                }`}
              >
                {svgColorsUnlocked ? <UnlockIcon /> : <LockIcon />}
                {t("background.editColors")}
              </button>
            )}
          </div>
          {isSvgPattern(value.pattern) && !svgColorsUnlocked ? (
            <p className="text-[11px] text-ink-soft">{t("background.colorsLockedDesc")}</p>
          ) : (
            Array.from({ length: PATTERN_COLOR_COUNT[value.pattern] }).map((_, i) => (
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
            ))
          )}
        </div>
      )}
    </div>
  );
}
