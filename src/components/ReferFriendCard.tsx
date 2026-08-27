"use client";

import { useEffect, useRef, useState } from "react";
import bwipjs from "bwip-js/browser";
import { useT } from "@/lib/language-context";

function CopyIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <rect x="7" y="7" width="10" height="10" rx="2" />
      <path d="M13 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M4 10.5l3.5 3.5L16 5.5" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <circle cx="15.5" cy="4.5" r="2" />
      <circle cx="15.5" cy="15.5" r="2" />
      <circle cx="4.5" cy="10" r="2" />
      <path d="M6.3 9 13.7 5.5M6.3 11l7.4 3.5" />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M7 6 3 10l4 4M13 6l4 4-4 4" />
    </svg>
  );
}

const EMBED_WIDTH = 320;
const EMBED_HEIGHT = 210;

export default function ReferFriendCard({ shareUrl, embedUrl }: { shareUrl: string; embedUrl: string }) {
  const t = useT();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);
  const [canShare] = useState(() => typeof navigator !== "undefined" && typeof navigator.share === "function");

  const embedCode = `<iframe src="${embedUrl}" width="${EMBED_WIDTH}" height="${EMBED_HEIGHT}" style="border:0;border-radius:16px;" title="Refer a friend to Tally" loading="lazy"></iframe>`;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      bwipjs.toCanvas(canvas, {
        bcid: "qrcode",
        text: shareUrl,
        scale: 6,
      });
    } catch (err) {
      console.error("Referral QR render failed:", err);
    }
  }, [shareUrl]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can be unavailable (older browsers, insecure
      // context) — the link text is still visible and selectable below.
    }
  }

  async function handleCopyEmbed() {
    try {
      await navigator.clipboard.writeText(embedCode);
      setEmbedCopied(true);
      setTimeout(() => setEmbedCopied(false), 2000);
    } catch {
      // Same fallback reasoning as handleCopy above — the snippet is still
      // visible and selectable in the <pre> below.
    }
  }

  async function handleShare() {
    try {
      await navigator.share({ title: "Tally", text: t("refer.shareText"), url: shareUrl });
    } catch {
      // AbortError (user cancelled the share sheet) or any other failure —
      // nothing to surface, the copy button is right there as a fallback.
    }
  }

  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface">
      <div className="flex flex-col items-center gap-4 bg-gradient-to-b from-[var(--surface-accent)]/10 to-transparent px-6 pb-8 pt-10 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-accent text-2xl font-bold text-white">T</span>
        <div>
          <h3 className="font-display text-2xl text-foreground">{t("refer.title")}</h3>
          <p className="mx-auto mt-1 max-w-xs text-sm text-ink-soft">{t("refer.subtitle")}</p>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <canvas ref={canvasRef} className="block" />
        </div>
        <p className="text-[11px] text-ink-soft">{t("refer.qrCaption")}</p>
      </div>

      <div className="flex flex-col gap-3 border-t border-line p-4">
        <div className="flex items-center gap-2 rounded-input border border-line bg-background px-3 py-2.5">
          <span className="min-w-0 flex-1 truncate text-left text-sm text-foreground">{shareUrl}</span>
          <button
            type="button"
            onClick={handleCopy}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-[var(--nav-hover-bg)]"
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
            {copied ? t("refer.copied") : t("refer.copy")}
          </button>
        </div>

        {canShare && (
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center justify-center gap-2 rounded-full bg-surface-accent px-5 py-2.5 text-sm font-semibold text-white transition"
          >
            <ShareIcon />
            {t("refer.share")}
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2 border-t border-line p-4">
        <p className="text-sm font-medium text-foreground">{t("refer.embedTitle")}</p>
        <p className="text-[11px] leading-snug text-ink-soft">{t("refer.embedHint")}</p>
        <pre className="overflow-x-auto rounded-input border border-line bg-background p-3 text-left text-[11px] leading-snug text-ink-soft">
          <code>{embedCode}</code>
        </pre>
        <button
          type="button"
          onClick={handleCopyEmbed}
          className="flex w-fit items-center gap-1.5 self-start rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-[var(--nav-hover-bg)]"
        >
          {embedCopied ? <CheckIcon /> : <CodeIcon />}
          {embedCopied ? t("refer.copied") : t("refer.embedCopy")}
        </button>
      </div>
    </div>
  );
}
