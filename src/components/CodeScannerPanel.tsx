"use client";

import { useState } from "react";
import ScanCardModal from "./ScanCardModal";
import { useT } from "@/lib/language-context";
import type { MembershipCodeFormat } from "@/lib/memberships";
import type { MessageKey } from "@/lib/i18n/messages";

// Same labels the pass editor and code generator use for the six
// symbologies — no third copy of these translated strings.
const FORMAT_LABEL_KEYS: Record<MembershipCodeFormat, MessageKey> = {
  qr: "membership.formatQr",
  code128: "membership.formatCode128",
  ean13: "membership.formatEan13",
  upc: "membership.formatUpc",
  pdf417: "membership.formatPdf417",
  aztec: "membership.formatAztec",
};

// The natural pair to Code generator: read a QR/barcode back out instead
// of making one. Reuses ScanCardModal as-is (camera + zxing, plus its own
// "choose a photo" fallback) — it was already generic (onScanned gives a
// plain {value, format}), never pass-specific, so nothing there needed to
// change for a non-pass use.
export default function CodeScannerPanel() {
  const t = useT();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<{ value: string; format: MembershipCodeFormat } | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be denied/unavailable — the value is still
      // right there on screen to copy by hand.
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <h3 className="font-display text-2xl text-foreground">{t("codeScanner.title")}</h3>

      <section className="rounded-card border border-line bg-surface p-4">
        {result ? (
          <div className="flex flex-col gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-soft">{t(FORMAT_LABEL_KEYS[result.format])}</label>
              <p className="w-full break-all rounded-input border border-line bg-background px-3 py-2 text-sm text-foreground">
                {result.value}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="rounded-full border border-line px-3.5 py-2 text-xs font-semibold text-foreground transition hover:bg-[var(--nav-hover-bg)]"
              >
                {copied ? t("codeScanner.copied") : t("codeScanner.copy")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setResult(null);
                  setScanning(true);
                }}
                className="rounded-full border border-line px-3.5 py-2 text-xs font-semibold text-foreground transition hover:bg-[var(--nav-hover-bg)]"
              >
                {t("codeScanner.scanAnother")}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-start gap-3">
            <p className="text-xs leading-snug text-ink-soft">{t("codeScanner.description")}</p>
            <button
              type="button"
              onClick={() => setScanning(true)}
              className="rounded-full border border-line px-3.5 py-2 text-xs font-semibold text-foreground transition hover:bg-[var(--nav-hover-bg)]"
            >
              {t("codeScanner.scanButton")}
            </button>
          </div>
        )}
      </section>

      {scanning && (
        <ScanCardModal
          onClose={() => setScanning(false)}
          onScanned={(scanned) => {
            setScanning(false);
            setResult(scanned);
          }}
        />
      )}
    </div>
  );
}
