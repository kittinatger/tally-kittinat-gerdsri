"use client";

import { useRef, useState } from "react";
import { dotClasses, colorDotStyle } from "@/lib/category-styles";
import { CATEGORY_PALETTE } from "@/lib/categories";
import {
  isHexColor,
  normalizeHex,
  hexToRgb,
  rgbToHex,
  rgbToCmyk,
  cmykToRgb,
  rgbToHsv,
  hsvToRgb,
  type RGB,
  type CMYK,
} from "@/lib/color-convert";
import { useT } from "@/lib/language-context";

const DEFAULT_CUSTOM = "#64748b";
const HUE_GRADIENT = "linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)";

function clampByte(n: number): number {
  return Math.max(0, Math.min(255, Math.round(Number.isFinite(n) ? n : 0)));
}
function clampPercent(n: number): number {
  return Math.max(0, Math.min(100, Math.round(Number.isFinite(n) ? n : 0)));
}
function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

// A palette-plus-custom color selector, used everywhere the app lets you
// pick a color for something (categories, wallets, cards, passes, savings
// goals). The palette swatches are the app's existing named design-system
// colors — tapping one stores that token, unchanged from before. "Custom"
// opens a panel with a saturation/value square, a hue slider, an eyedropper
// (where the browser supports it), and Hex/RGB/CMYK fields — all kept in
// sync via rgb as the single source of truth (hue/saturation/value are
// derived from it on every render rather than tracked separately, so there
// is nothing that can drift out of sync between the square, the sliders,
// and the text fields). Picking a color stores a plain 6-digit hex string
// in the same color field. See category-styles.ts's colorDotStyle/
// colorHeroStyle for how a hex value renders back out wherever it's shown.
export default function ColorPicker({
  value,
  onChange,
  palette = CATEGORY_PALETTE,
}: {
  value: string;
  onChange: (color: string) => void;
  palette?: readonly string[];
}) {
  const t = useT();
  const customActive = isHexColor(value);
  const [panelOpen, setPanelOpen] = useState(false);
  const seedHex = customActive ? normalizeHex(value) : DEFAULT_CUSTOM;
  const seedRgb = hexToRgb(seedHex);
  const seedCmyk = rgbToCmyk(seedRgb);

  const [hexText, setHexText] = useState(seedHex);
  const [rgb, setRgb] = useState<RGB>(seedRgb);
  const [cmyk, setCmyk] = useState<CMYK>(seedCmyk);

  const squareRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const hsv = rgbToHsv(rgb);

  function applyHex(text: string) {
    setHexText(text);
    if (!isHexColor(text)) return;
    const hex = normalizeHex(text);
    const nextRgb = hexToRgb(hex);
    setRgb(nextRgb);
    setCmyk(rgbToCmyk(nextRgb));
    onChange(hex);
  }

  function applyRgb(next: RGB) {
    const clamped = { r: clampByte(next.r), g: clampByte(next.g), b: clampByte(next.b) };
    setRgb(clamped);
    const hex = rgbToHex(clamped);
    setHexText(hex);
    setCmyk(rgbToCmyk(clamped));
    onChange(hex);
  }

  function applyCmyk(next: CMYK) {
    const clamped = { c: clampPercent(next.c), m: clampPercent(next.m), y: clampPercent(next.y), k: clampPercent(next.k) };
    setCmyk(clamped);
    const nextRgb = cmykToRgb(clamped);
    const roundedRgb = { r: Math.round(nextRgb.r), g: Math.round(nextRgb.g), b: Math.round(nextRgb.b) };
    setRgb(roundedRgb);
    const hex = rgbToHex(roundedRgb);
    setHexText(hex);
    onChange(hex);
  }

  function handleSquarePointer(e: React.PointerEvent<HTMLDivElement>) {
    const el = squareRef.current;
    if (!el) return;
    el.setPointerCapture(e.pointerId);
    const rect = el.getBoundingClientRect();
    const move = (clientX: number, clientY: number) => {
      const s = clamp01((clientX - rect.left) / rect.width) * 100;
      const v = 100 - clamp01((clientY - rect.top) / rect.height) * 100;
      applyRgb(hsvToRgb({ h: hsv.h, s, v }));
    };
    move(e.clientX, e.clientY);
    function onMove(ev: PointerEvent) {
      move(ev.clientX, ev.clientY);
    }
    function onUp() {
      el?.removeEventListener("pointermove", onMove);
      el?.removeEventListener("pointerup", onUp);
    }
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
  }

  function handleHuePointer(e: React.PointerEvent<HTMLDivElement>) {
    const el = hueRef.current;
    if (!el) return;
    el.setPointerCapture(e.pointerId);
    const rect = el.getBoundingClientRect();
    const move = (clientX: number) => {
      const h = clamp01((clientX - rect.left) / rect.width) * 360;
      applyRgb(hsvToRgb({ h, s: hsv.s, v: hsv.v }));
    };
    move(e.clientX);
    function onMove(ev: PointerEvent) {
      move(ev.clientX);
    }
    function onUp() {
      el?.removeEventListener("pointermove", onMove);
      el?.removeEventListener("pointerup", onUp);
    }
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
  }

  async function handleEyedropper() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- EyeDropper isn't in the TS DOM lib yet
    const EyeDropperCtor = (window as any).EyeDropper;
    if (!EyeDropperCtor) return;
    try {
      const result = await new EyeDropperCtor().open();
      if (result?.sRGBHex) applyHex(result.sRGBHex);
    } catch {
      // User cancelled the eyedropper — nothing to do.
    }
  }

  const supportsEyedropper = typeof window !== "undefined" && "EyeDropper" in window;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {palette.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => {
              setPanelOpen(false);
              onChange(c);
            }}
            aria-label={c}
            className={`h-8 w-8 rounded-full transition ${dotClasses(c)} ${
              value === c ? "ring-2 ring-navy ring-offset-2 ring-offset-surface" : ""
            }`}
          />
        ))}
        <button
          type="button"
          onClick={() => {
            setPanelOpen((v) => !v);
            if (!customActive) onChange(hexText);
          }}
          aria-label={t("color.custom")}
          style={{ backgroundImage: "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)" }}
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition ${
            customActive ? "ring-2 ring-navy ring-offset-2 ring-offset-surface" : ""
          }`}
        />
      </div>

      {panelOpen && (
        <div className="mt-3 space-y-3 rounded-card border border-line bg-bg-soft p-3">
          <div
            ref={squareRef}
            onPointerDown={handleSquarePointer}
            className="relative aspect-square w-full touch-none rounded-xl"
            style={{
              backgroundImage: "linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent)",
              backgroundColor: `hsl(${hsv.h}, 100%, 50%)`,
            }}
          >
            <span
              className="pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.3)]"
              style={{ left: `${hsv.s}%`, top: `${100 - hsv.v}%`, backgroundColor: hexText }}
            />
          </div>

          <div className="flex items-center gap-2">
            <div
              ref={hueRef}
              onPointerDown={handleHuePointer}
              className="relative h-3.5 flex-1 touch-none rounded-full"
              style={{ backgroundImage: HUE_GRADIENT }}
            >
              <span
                className="pointer-events-none absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.3)]"
                style={{ left: `${(hsv.h / 360) * 100}%`, backgroundColor: `hsl(${hsv.h}, 100%, 50%)` }}
              />
            </div>
            {supportsEyedropper && (
              <button
                type="button"
                onClick={handleEyedropper}
                aria-label={t("color.eyedropper")}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-ink-soft transition hover:border-navy hover:text-foreground"
              >
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="m14.5 3.5 2 2-9 9-3 1 1-3 9-9Z" />
                  <path d="M12.5 5.5 14.5 7.5" />
                </svg>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span
              className="h-10 w-10 shrink-0 rounded-full border border-line"
              style={colorDotStyle(isHexColor(hexText) ? hexText : undefined) ?? { backgroundColor: seedHex }}
            />
            <div className="flex-1">
              <label htmlFor="colorPickerHex" className="mb-1 block text-xs font-semibold text-ink-soft">
                {t("color.hex")}
              </label>
              <input
                id="colorPickerHex"
                type="text"
                value={hexText}
                onChange={(e) => applyHex(e.target.value)}
                placeholder="#3B82F6"
                maxLength={7}
                className="w-full rounded-card border border-line bg-surface px-3 py-2 text-sm text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
              />
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-semibold text-ink-soft">{t("color.rgb")}</p>
            <div className="grid grid-cols-3 gap-2">
              {(["r", "g", "b"] as const).map((k) => (
                <input
                  key={k}
                  type="number"
                  min={0}
                  max={255}
                  value={rgb[k]}
                  onChange={(e) => applyRgb({ ...rgb, [k]: Number(e.target.value) })}
                  aria-label={k.toUpperCase()}
                  className="w-full rounded-card border border-line bg-surface px-2.5 py-2 text-sm text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
                />
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-semibold text-ink-soft">{t("color.cmyk")}</p>
            <div className="grid grid-cols-4 gap-2">
              {(["c", "m", "y", "k"] as const).map((k) => (
                <input
                  key={k}
                  type="number"
                  min={0}
                  max={100}
                  value={cmyk[k]}
                  onChange={(e) => applyCmyk({ ...cmyk, [k]: Number(e.target.value) })}
                  aria-label={k.toUpperCase()}
                  className="w-full rounded-card border border-line bg-surface px-2.5 py-2 text-sm text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
