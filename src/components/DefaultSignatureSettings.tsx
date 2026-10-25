"use client";

import { useEffect, useState } from "react";
import { PenNibIcon } from "@phosphor-icons/react/dist/ssr";
import SignatureModal from "./SignatureModal";
import { SignatureSvg } from "./SignaturePad";

// Settings > Wallets: the default signature on the back of every card. Any
// card can still be signed on its own from its detail view (Wallet page),
// which then overrides this one.
export default function DefaultSignatureSettings() {
  const [signature, setSignature] = useState<string | null | undefined>(undefined);
  const [drawing, setDrawing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/signature")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) setSignature(data?.signature ?? null);
      })
      .catch(() => {
        if (!cancelled) setSignature(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function save(next: string | null) {
    const res = await fetch("/api/signature", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signature: next }),
    });
    if (!res.ok) throw new Error();
    setSignature(next);
  }

  return (
    <div className="mt-4 rounded-card border border-line bg-surface p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy/10 text-navy dark:text-blue-300">
          <PenNibIcon weight="fill" aria-hidden="true" className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">Card signature</p>
          <p className="mt-0.5 text-xs text-ink-soft">
            Shown on the back of every card. You can still sign any card on its own from the Wallet page.
          </p>
        </div>
      </div>

      {signature && (
        <div className="mt-3 rounded-xl border border-line bg-white px-4 py-2 text-neutral-900">
          <SignatureSvg path={signature} className="h-16 w-full" />
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setDrawing(true)}
          disabled={signature === undefined}
          className="rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-navy-dark disabled:opacity-50"
        >
          {signature ? "Change signature" : "Draw signature"}
        </button>
        {signature && (
          <button
            type="button"
            onClick={() => save(null).catch(() => {})}
            className="rounded-full px-4 py-2 text-sm font-semibold text-ink-soft transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
          >
            Remove
          </button>
        )}
      </div>

      {drawing && (
        <SignatureModal
          title="Your card signature"
          description="This appears on the back of all your cards, unless a card has its own."
          onSave={(path) => save(path)}
          onClose={() => setDrawing(false)}
        />
      )}
    </div>
  );
}
