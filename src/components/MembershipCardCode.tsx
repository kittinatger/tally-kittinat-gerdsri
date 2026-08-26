"use client";

import { useEffect, useRef, useState } from "react";
import bwipjs from "bwip-js/browser";
import { useT } from "@/lib/language-context";
import type { MembershipCodeFormat } from "@/lib/memberships";

// bwip-js's symbology id for each format we support — one renderer covers
// every format (1D barcodes and 2D matrix codes alike), unlike juggling a
// separate QR-only and barcode-only library.
const BCID: Record<MembershipCodeFormat, string> = {
  qr: "qrcode",
  code128: "code128",
  ean13: "ean13",
  upc: "upca",
  pdf417: "pdf417",
  aztec: "azteccode",
};

// Renders on a plain white background regardless of app theme — a real
// functional requirement, not a style choice: a barcode/QR on a dark
// background won't scan at a checkout counter.
export default function MembershipCardCode({
  value,
  format,
  size = "large",
}: {
  value: string;
  format: MembershipCodeFormat;
  /** "thumb" is a fixed-size square thumbnail for list rows — no
   * human-readable text, no error message (just renders blank on failure,
   * since a full error explanation doesn't fit and the full code is always
   * one tap away in the detail view). */
  size?: "large" | "small" | "thumb";
}) {
  const t = useT();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  const isEmpty = value.trim() === "";

  useEffect(() => {
    let cancelled = false;
    // Deferred by a microtask so the initial setError(null) below doesn't
    // run synchronously in the effect body (same pattern used elsewhere in
    // this app to avoid the cascading-render lint rule).
    Promise.resolve().then(() => {
      if (cancelled) return;
      setError(null);
      // bwip-js throws on an empty string — skip the render attempt (and
      // the error box below it) entirely until there's something to encode,
      // rather than surfacing "couldn't render" for a code the user simply
      // hasn't typed or scanned yet.
      if (isEmpty) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const is2d = format === "qr" || format === "aztec";
      // bwip-js validates every key it sees on the options object and
      // throws "invalidOptionType" if a key is present but set to
      // undefined (e.g. {height: undefined}) — it wants the key left out
      // entirely for symbologies that don't use it, not present-but-empty.
      // So this builds the object conditionally instead of always setting
      // every key and letting some end up undefined.
      const opts = {
        bcid: BCID[format],
        text: value,
        scale: size === "large" ? (is2d ? 6 : 3) : size === "small" ? (is2d ? 3 : 2) : is2d ? 2 : 1.4,
        includetext: size !== "thumb" && !is2d,
        textxalign: "center" as const,
        ...(!is2d && { height: size === "large" ? 16 : size === "small" ? 9 : 5 }),
        ...(size === "thumb" && { paddingwidth: 0, paddingheight: 0 }),
      };
      try {
        bwipjs.toCanvas(canvas, opts);
      } catch (err) {
        console.error("bwip-js render failed:", err);
        if (size !== "thumb") setError(t("membership.codeRenderError"));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [value, format, size, t, isEmpty]);

  if (size === "thumb") {
    if (isEmpty) return null;
    return (
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white p-1">
        <canvas ref={canvasRef} className="block max-h-full max-w-full" />
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="flex w-full items-center justify-center rounded-2xl border border-dashed border-line py-8">
        <p className="text-sm text-ink-soft">{t("membership.codePlaceholder")}</p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl bg-white p-4">
      {error ? (
        <p className="py-6 text-center text-sm text-red-600">{error}</p>
      ) : (
        <canvas ref={canvasRef} className="mx-auto block max-w-full" />
      )}
    </div>
  );
}
