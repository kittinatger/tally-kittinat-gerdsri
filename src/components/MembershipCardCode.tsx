"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import JsBarcode from "jsbarcode";
import { useT } from "@/lib/language-context";
import type { MembershipCodeFormat } from "@/lib/memberships";

const BARCODE_SYMBOLOGY: Record<Exclude<MembershipCodeFormat, "qr">, string> = {
  code128: "CODE128",
  ean13: "EAN13",
  upc: "UPC",
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
  /** "thumb" is a fixed-size square thumbnail for list rows — no barcode
   * display value text, no error message (just renders blank on failure,
   * since a full error explanation doesn't fit and the full code is always
   * one tap away in the detail view). */
  size?: "large" | "small" | "thumb";
}) {
  const t = useT();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Deferred by a microtask so the initial setError(null) below doesn't
    // run synchronously in the effect body (same pattern used elsewhere in
    // this app to avoid the cascading-render lint rule).
    Promise.resolve().then(() => {
      if (cancelled) return;
      setError(null);
      if (format === "qr") {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const width = size === "large" ? 240 : size === "small" ? 96 : 56;
        QRCode.toCanvas(canvas, value, { width, margin: size === "thumb" ? 0 : 1 }).catch(() => {
          if (!cancelled && size !== "thumb") setError(t("membership.codeRenderError"));
        });
        return;
      }
      const svg = svgRef.current;
      if (!svg) return;
      try {
        JsBarcode(svg, value, {
          format: BARCODE_SYMBOLOGY[format],
          width: size === "large" ? 2.2 : size === "small" ? 1.4 : 1,
          height: size === "large" ? 90 : size === "small" ? 40 : 28,
          displayValue: size !== "thumb",
          fontSize: size === "large" ? 14 : 10,
          margin: size === "thumb" ? 2 : 8,
        });
      } catch {
        if (size !== "thumb") setError(t("membership.codeRenderError"));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [value, format, size, t]);

  if (size === "thumb") {
    return (
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white p-1">
        {format === "qr" ? (
          <canvas ref={canvasRef} className="block" />
        ) : (
          <svg ref={svgRef} className="block w-full" />
        )}
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl bg-white p-4">
      {error ? (
        <p className="py-6 text-center text-sm text-red-600">{error}</p>
      ) : format === "qr" ? (
        <canvas ref={canvasRef} className="mx-auto block" />
      ) : (
        <svg ref={svgRef} className="mx-auto block w-full" />
      )}
    </div>
  );
}
