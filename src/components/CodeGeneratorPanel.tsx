"use client";

import { useEffect, useRef, useState } from "react";
import bwipjs from "bwip-js/browser";
import { useT } from "@/lib/language-context";
import { MEMBERSHIP_CODE_FORMATS, type MembershipCodeFormat } from "@/lib/memberships";
import type { MessageKey } from "@/lib/i18n/messages";

// Same labels the pass editor's format picker uses — no need for a second
// set of translated strings for the same six symbologies.
const FORMAT_LABEL_KEYS: Record<MembershipCodeFormat, MessageKey> = {
  qr: "membership.formatQr",
  code128: "membership.formatCode128",
  ean13: "membership.formatEan13",
  upc: "membership.formatUpc",
  pdf417: "membership.formatPdf417",
  aztec: "membership.formatAztec",
};

// A standalone version of what MembershipCardCode.tsx renders inline on a
// pass — same bwip-js call, but kept independent (rather than reused)
// because this one needs its own canvas ref to export a PNG, which
// MembershipCardCode doesn't expose.
export default function CodeGeneratorPanel() {
  const t = useT();
  const [value, setValue] = useState("");
  const [format, setFormat] = useState<MembershipCodeFormat>("qr");
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const trimmed = value.trim();
  const isEmpty = trimmed === "";
  const is2d = format === "qr" || format === "aztec";

  useEffect(() => {
    let cancelled = false;
    // Deferred to a microtask so the setError(null) below doesn't run
    // synchronously inside the effect — same pattern as MembershipCardCode.
    Promise.resolve().then(() => {
      if (cancelled) return;
      setError(null);
      if (isEmpty) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      try {
        bwipjs.toCanvas(canvas, {
          bcid: { qr: "qrcode", code128: "code128", ean13: "ean13", upc: "upca", pdf417: "pdf417", aztec: "azteccode" }[format],
          text: trimmed,
          scale: is2d ? 6 : 3,
          includetext: !is2d,
          textxalign: "center" as const,
          ...(!is2d && { height: 16 }),
        });
      } catch (err) {
        console.error("bwip-js render failed:", err);
        setError(t("membership.codeRenderError"));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [trimmed, format, is2d, isEmpty, t]);

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas || isEmpty || error) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `code-${format}-${Date.now()}.png`;
    a.click();
  }

  return (
    <div className="flex flex-col gap-8">
      <h3 className="font-display text-2xl text-foreground">{t("codeGenerator.title")}</h3>

      <section className="rounded-card border border-line bg-surface p-4">
        <h4 className="text-sm font-semibold text-foreground">{t("codeGenerator.inputLabel")}</h4>
        <p className="mt-1 text-xs leading-snug text-ink-soft">{t("codeGenerator.inputDescription")}</p>
        <div className="mt-4 flex flex-col gap-3">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={t("codeGenerator.inputPlaceholder")}
            className="w-full rounded-input border border-line bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-surface-accent"
          />

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink-soft">{t("membership.formatLabel")}</label>
            <div className="flex flex-wrap gap-1.5">
              {MEMBERSHIP_CODE_FORMATS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFormat(f)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    format === f
                      ? "border-navy bg-navy/10 text-navy dark:text-blue-300"
                      : "border-line text-ink-soft hover:bg-[var(--nav-hover-bg)]"
                  }`}
                >
                  {t(FORMAT_LABEL_KEYS[f])}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-card border border-line bg-surface p-4">
        <h4 className="text-sm font-semibold text-foreground">{t("codeGenerator.previewLabel")}</h4>
        <div className="mt-3 w-full max-w-xs rounded-2xl bg-white p-4">
          {isEmpty ? (
            <p className="py-8 text-center text-sm text-ink-soft">{t("codeGenerator.emptyHint")}</p>
          ) : error ? (
            <p className="py-6 text-center text-sm text-red-600">{error}</p>
          ) : (
            <canvas ref={canvasRef} className="mx-auto block max-w-full" />
          )}
        </div>
        <button
          type="button"
          onClick={handleDownload}
          disabled={isEmpty || Boolean(error)}
          className="mt-4 self-start rounded-full border border-line px-3.5 py-2 text-xs font-semibold text-foreground transition hover:bg-[var(--nav-hover-bg)] disabled:opacity-60"
        >
          {t("codeGenerator.downloadButton")}
        </button>
      </section>
    </div>
  );
}
