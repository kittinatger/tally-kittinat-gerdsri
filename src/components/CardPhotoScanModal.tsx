"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Modal from "./Modal";
import { downscaleImage } from "@/lib/image-downscale";
import { CARD_ASPECT, defaultQuad, detectCardCorners, warpPerspective, extractPalette, type Quad } from "@/lib/image-perspective";
import {
  GALLERY_PATTERNS,
  PATTERN_COLOR_COUNT,
  PATTERN_LABEL_KEYS,
  cardBackgroundStyle,
  type CardBackground,
  type CardPattern,
} from "@/lib/card-backgrounds";
import { CameraIcon, ImageIcon, SparkleIcon } from "@/lib/icons";
import { useT } from "@/lib/language-context";

const WORK_WIDTH = 900;
const OUT_WIDTH = 640;
const OUT_HEIGHT = Math.round(OUT_WIDTH / CARD_ASPECT);
const PALETTE_SIZE = 3;

function fitColors(source: string[], need: number): string[] {
  return Array.from({ length: need }, (_, i) => source[i] ?? source[source.length - 1] ?? "#64748b");
}

// Draws a canvas's current pixels into a visible <canvas> whenever the
// source canvas identity changes — avoids toDataURL() (which would re-run
// on every parent re-render, including every corner-drag pointermove).
function CanvasView({ canvas, className }: { canvas: HTMLCanvasElement; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.width = canvas.width;
    el.height = canvas.height;
    el.getContext("2d")?.drawImage(canvas, 0, 0);
  }, [canvas]);
  return <canvas ref={ref} className={className} />;
}

type Step = "capture" | "adjust" | "result";

// "Scan a card" — photograph (or pick a photo of) a real card, drag-correct
// a guessed 4-corner outline, then warp+crop to the card's true rectangle
// and pull a small palette out of it to seed a background pattern. See
// image-perspective.ts for what's real computer vision here and what's a
// deliberately lightweight heuristic.
export default function CardPhotoScanModal({
  onClose,
  onApply,
}: {
  onClose: () => void;
  onApply: (background: CardBackground) => void;
}) {
  const t = useT();
  const [step, setStep] = useState<Step>("capture");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [workCanvas, setWorkCanvas] = useState<HTMLCanvasElement | null>(null);
  const [quad, setQuad] = useState<Quad | null>(null);
  const [resultCanvas, setResultCanvas] = useState<HTMLCanvasElement | null>(null);
  const [palette, setPalette] = useState<string[]>([]);
  const [pattern, setPattern] = useState<CardPattern>("diagonal");
  const [colors, setColors] = useState<string[]>([]);
  const [aiImage, setAiImage] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragIndexRef = useRef<number | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setLoading(true);
    try {
      const downscaled = await downscaleImage(file);
      const bitmap = await createImageBitmap(downscaled);
      const scale = Math.min(1, WORK_WIDTH / bitmap.width);
      const w = Math.round(bitmap.width * scale);
      const h = Math.round(bitmap.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("2D context unavailable");
      ctx.drawImage(bitmap, 0, 0, w, h);
      bitmap.close();
      const guess = detectCardCorners(ctx, w, h) ?? defaultQuad(w, h);
      setWorkCanvas(canvas);
      setQuad(guess);
      setStep("adjust");
    } catch {
      setError(t("background.scanLoadError"));
    } finally {
      setLoading(false);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) handleFile(file);
  }

  function resetGuide() {
    if (workCanvas) setQuad(defaultQuad(workCanvas.width, workCanvas.height));
  }

  function handleHandlePointerDown(index: number, e: React.PointerEvent) {
    dragIndexRef.current = index;
    (e.target as Element).setPointerCapture(e.pointerId);
  }

  function handleSvgPointerMove(e: React.PointerEvent<SVGSVGElement>) {
    const index = dragIndexRef.current;
    if (index === null || !workCanvas) return;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * workCanvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * workCanvas.height;
    setQuad((prev) => {
      if (!prev) return prev;
      const next = [...prev] as Quad;
      next[index] = {
        x: Math.min(workCanvas.width, Math.max(0, x)),
        y: Math.min(workCanvas.height, Math.max(0, y)),
      };
      return next;
    });
  }

  function handleSvgPointerUp() {
    dragIndexRef.current = null;
  }

  function confirmCrop() {
    if (!workCanvas || !quad) return;
    const corrected = warpPerspective(workCanvas, quad, OUT_WIDTH, OUT_HEIGHT);
    const extracted = extractPalette(corrected, PALETTE_SIZE);
    setResultCanvas(corrected);
    setPalette(extracted);
    setPattern("diagonal");
    setColors(fitColors(extracted, PATTERN_COLOR_COUNT.diagonal));
    setStep("result");
  }

  function choosePattern(p: CardPattern) {
    setPattern(p);
    setColors(fitColors(palette, PATTERN_COLOR_COUNT[p]));
  }

  function useDirectPhoto() {
    if (!resultCanvas) return;
    onApply({ pattern: "photo", photoDataUrl: resultCanvas.toDataURL("image/jpeg", 0.85) });
  }

  function usePatternLook() {
    onApply({ pattern, colors });
  }

  function useGeneratedImage() {
    if (!aiImage) return;
    onApply({ pattern: "photo", photoDataUrl: aiImage });
  }

  async function generateAiPattern() {
    if (!resultCanvas) return;
    setAiError(null);
    setAiLoading(true);
    setAiImage(null);
    try {
      const blob = await new Promise<Blob | null>((resolve) => resultCanvas.toBlob(resolve, "image/jpeg", 0.9));
      if (!blob) throw new Error("toBlob failed");
      const form = new FormData();
      form.append("image", blob, "card.jpg");
      const res = await fetch("/api/card-background/generate-pattern", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setAiError(typeof data.error === "string" ? data.error : t("background.aiGenerateError"));
        return;
      }
      setAiImage(data.image as string);
    } catch {
      setAiError(t("background.aiGenerateError"));
    } finally {
      setAiLoading(false);
    }
  }

  // Portaled to document.body — this modal is opened from inside
  // CardBackgroundPicker, which is itself always inside another modal's own
  // glass sheet (WalletModal/MembershipCardModal). That
  // ancestor's backdrop-blur creates a new containing block for `position:
  // fixed` descendants, so without the portal this modal's fixed overlay
  // would be confined to the parent modal's panel instead of the viewport
  // — see SelectDropdown.tsx/DatePicker.tsx for the same fix elsewhere.
  return createPortal(
    <Modal
      onClose={onClose}
      title={
        step === "capture" ? t("background.scanTitle") : step === "adjust" ? t("background.adjustTitle") : t("background.resultTitle")
      }
    >
      {step === "capture" && (
        <div className="space-y-3">
          <p className="text-sm text-ink-soft">{t("background.scanHint")}</p>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleInputChange} className="hidden" />
          <input ref={galleryInputRef} type="file" accept="image/*" onChange={handleInputChange} className="hidden" />
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-navy px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-navy-dark disabled:opacity-60"
          >
            <CameraIcon className="h-4 w-4" />
            {t("background.takePhoto")}
          </button>
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-line px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-[var(--nav-hover-bg)] disabled:opacity-60"
          >
            <ImageIcon className="h-4 w-4" />
            {t("background.choosePhoto")}
          </button>
          {loading && <p className="text-center text-xs text-ink-soft">{t("common.loading")}</p>}
        </div>
      )}

      {step === "adjust" && workCanvas && quad && (
        <div className="space-y-3">
          <p className="text-xs text-ink-soft">{t("background.adjustHint")}</p>
          <div
            className="relative w-full overflow-hidden rounded-card border border-line bg-black/5"
            style={{ aspectRatio: `${workCanvas.width} / ${workCanvas.height}` }}
          >
            <CanvasView canvas={workCanvas} className="absolute inset-0 h-full w-full" />
            <svg
              ref={svgRef}
              viewBox={`0 0 ${workCanvas.width} ${workCanvas.height}`}
              className="absolute inset-0 h-full w-full touch-none"
              onPointerMove={handleSvgPointerMove}
              onPointerUp={handleSvgPointerUp}
            >
              <polygon
                points={quad.map((p) => `${p.x},${p.y}`).join(" ")}
                fill="rgba(37,99,235,0.15)"
                stroke="#2563eb"
                strokeWidth={Math.max(2, workCanvas.width / 200)}
              />
              {quad.map((p, i) => (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r={Math.max(10, workCanvas.width / 40)}
                  fill="#2563eb"
                  stroke="white"
                  strokeWidth={Math.max(2, workCanvas.width / 300)}
                  style={{ cursor: "grab", touchAction: "none" }}
                  onPointerDown={(e) => handleHandlePointerDown(i, e)}
                />
              ))}
            </svg>
          </div>
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={resetGuide}
              className="rounded-full px-4 py-2 text-sm font-semibold text-ink-soft transition hover:bg-[var(--nav-hover-bg)]"
            >
              {t("background.resetGuide")}
            </button>
            <button
              type="button"
              onClick={confirmCrop}
              className="rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-navy-dark"
            >
              {t("background.useThisArea")}
            </button>
          </div>
        </div>
      )}

      {step === "result" && resultCanvas && (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-line">
            <CanvasView canvas={resultCanvas} className="w-full" />
          </div>

          {/* Option 1: the corrected photo itself, used as the background verbatim. */}
          <div className="space-y-2 rounded-card border border-line bg-bg-soft p-3">
            <p className="text-xs font-semibold text-ink-soft">{t("background.useDirectTitle")}</p>
            <p className="text-xs text-ink-soft">{t("background.useDirectHint")}</p>
            <button
              type="button"
              onClick={useDirectPhoto}
              className="w-full rounded-full bg-navy px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-navy-dark"
            >
              {t("background.useThisPhoto")}
            </button>
          </div>

          {/* Option 2: extract a small palette and apply it to one of the CSS patterns. */}
          <div className="space-y-2 rounded-card border border-line bg-bg-soft p-3">
            <p className="text-xs font-semibold text-ink-soft">{t("background.extractedColors")}</p>
            <div className="flex gap-2">
              {palette.map((c, i) => (
                <span key={i} className="h-8 w-8 rounded-full border border-line" style={{ backgroundColor: c }} />
              ))}
            </div>
            <p className="mb-1.5 text-xs font-semibold text-ink-soft">{t("background.chooseLook")}</p>
            <div className="flex flex-wrap gap-2">
              {GALLERY_PATTERNS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => choosePattern(p)}
                  aria-label={t(PATTERN_LABEL_KEYS[p]!)}
                  title={t(PATTERN_LABEL_KEYS[p]!)}
                  style={cardBackgroundStyle({ pattern: p, colors: fitColors(palette, PATTERN_COLOR_COUNT[p]) })}
                  className={`h-11 w-11 shrink-0 rounded-xl border border-line transition ${
                    pattern === p ? "ring-2 ring-navy ring-offset-2 ring-offset-surface" : ""
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={usePatternLook}
              className="w-full rounded-full border border-line px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-[var(--nav-hover-bg)]"
            >
              {t("background.useThisLook")}
            </button>
          </div>

          {/* Option 3: ask an AI model to generate a new abstract pattern inspired by the photo. */}
          <div className="space-y-2 rounded-card border border-line bg-bg-soft p-3">
            <p className="text-xs font-semibold text-ink-soft">{t("background.aiGenerateTitle")}</p>
            <p className="text-xs text-ink-soft">{t("background.aiGenerateHint")}</p>
            {aiError && <p className="text-xs text-red-600 dark:text-red-400">{aiError}</p>}
            {aiImage ? (
              <>
                <div className="overflow-hidden rounded-xl border border-line">
                  {/* eslint-disable-next-line @next/next/no-img-element -- generated data URL, not a build-time asset */}
                  <img src={aiImage} alt="" className="aspect-[8/5] w-full object-cover" />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={generateAiPattern}
                    disabled={aiLoading}
                    className="flex-1 rounded-full border border-line px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-[var(--nav-hover-bg)] disabled:opacity-60"
                  >
                    {t("background.regenerate")}
                  </button>
                  <button
                    type="button"
                    onClick={useGeneratedImage}
                    className="flex-1 rounded-full bg-navy px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-navy-dark"
                  >
                    {t("background.useThisPattern")}
                  </button>
                </div>
              </>
            ) : (
              <button
                type="button"
                onClick={generateAiPattern}
                disabled={aiLoading}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-line px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-[var(--nav-hover-bg)] disabled:opacity-60"
              >
                <SparkleIcon className="h-4 w-4" />
                {aiLoading ? t("background.generating") : t("background.generatePattern")}
              </button>
            )}
          </div>

          <div className="flex items-center justify-start pt-1">
            <button
              type="button"
              onClick={() => setStep("adjust")}
              className="rounded-full px-4 py-2 text-sm font-semibold text-ink-soft transition hover:bg-[var(--nav-hover-bg)]"
            >
              {t("background.back")}
            </button>
          </div>
        </div>
      )}
    </Modal>,
    document.body,
  );
}
