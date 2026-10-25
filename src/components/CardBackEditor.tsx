"use client";

import { useState } from "react";
import Modal from "./Modal";
import { WalletBack } from "./CardBack";
import CardBackgroundPicker from "./CardBackgroundPicker";
import CardTextColorPicker from "./CardTextColorPicker";
import { DEFAULT_BACK_DESIGN, type CardBackDesign } from "@/lib/card-back";
import { cardForegroundFor } from "@/lib/card-backgrounds";
import type { WalletOption } from "@/types/wallet";

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (next: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${checked ? "bg-navy" : "bg-bg-soft"}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${checked ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}

const PARTS: { key: keyof CardBackDesign & `show${string}`; label: string; hint: string }[] = [
  { key: "showStripe", label: "Magnetic stripe", hint: "The black band across the top." },
  { key: "showSignature", label: "Signature strip", hint: "Your signature and the last 4 digits." },
  { key: "showBalance", label: "Balance", hint: "Current balance of the account." },
  { key: "showCurrency", label: "Currency", hint: "The account's currency." },
  { key: "showHolder", label: "Card holder", hint: "Name on the card (or the account type)." },
  { key: "showExpiry", label: "Expiry date", hint: "When the card expires, if set." },
];

// "Customise back" for a card: a live preview of the back, whether it
// follows the front or has its own colour / pattern / photo, text colour,
// and which parts of the back to show. Reuses the front's own pickers
// (CardBackgroundPicker, CardTextColorPicker).
export default function CardBackEditor({
  wallet,
  currency,
  signature,
  onSave,
  onClose,
}: {
  wallet: WalletOption;
  currency: string;
  signature: string | null;
  onSave: (design: CardBackDesign | null) => Promise<void>;
  onClose: () => void;
}) {
  const [design, setDesign] = useState<CardBackDesign>(wallet.backDesign);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const patch = (next: Partial<CardBackDesign>) => setDesign((d) => ({ ...d, ...next }));

  async function run(value: CardBackDesign | null) {
    setBusy(true);
    setError(null);
    try {
      await onSave(value);
      onClose();
    } catch {
      setError("Couldn't save the back design. Please try again.");
      setBusy(false);
    }
  }

  // Starting a custom back from the current look rather than a blank one.
  function setCustom(custom: boolean) {
    patch({
      custom,
      ...(custom && !design.custom && !design.background && design.color === DEFAULT_BACK_DESIGN.color ? { color: wallet.color } : {}),
    });
  }

  return (
    <Modal onClose={onClose} title={`Customise back of ${wallet.name}`} wide>
      <div className="aspect-[1.586/1] min-h-[190px] w-full max-w-sm mx-auto sm:max-w-md">
        <WalletBack wallet={wallet} currency={currency} signature={signature} design={design} />
      </div>

      <div className="mt-5 space-y-4">
        <div className="rounded-card border border-line bg-surface p-3.5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">Match the front</p>
              <p className="text-xs text-ink-soft">The back follows the front&apos;s colour automatically.</p>
            </div>
            <Toggle checked={!design.custom} onChange={(auto) => setCustom(!auto)} label="Match the front" />
          </div>

          {design.custom && (
            <div className="mt-3 space-y-3 border-t border-line pt-3">
              <CardBackgroundPicker
                value={design.background}
                onChange={(background) => patch({ background })}
                plainColor={design.color}
                onPlainColorChange={(color) => patch({ color })}
              />
              <div className="border-t border-line pt-3">
                <label className="mb-1.5 block text-xs font-semibold text-ink-soft">Text colour</label>
                <CardTextColorPicker
                  value={design.textColor}
                  onChange={(textColor) => patch({ textColor })}
                  autoColor={cardForegroundFor(null, design.background, design.color).full}
                />
              </div>
            </div>
          )}
        </div>

        <div className="divide-y divide-line rounded-card border border-line bg-surface">
          {PARTS.map((part) => (
            <div key={part.key} className="flex items-center justify-between gap-3 px-3.5 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{part.label}</p>
                <p className="text-xs text-ink-soft">{part.hint}</p>
              </div>
              <Toggle checked={design[part.key] as boolean} onChange={(v) => patch({ [part.key]: v } as Partial<CardBackDesign>)} label={part.label} />
            </div>
          ))}
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
      <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => run(null)}
          disabled={busy}
          className="mr-auto rounded-full px-3 py-2 text-sm font-semibold text-ink-soft transition hover:text-foreground disabled:opacity-50"
        >
          Reset to default
        </button>
        <button type="button" onClick={onClose} className="rounded-full px-4 py-2 text-sm font-semibold text-ink-soft transition hover:bg-[var(--nav-hover-bg)]">
          Cancel
        </button>
        <button
          type="button"
          onClick={() => run(design)}
          disabled={busy}
          className="rounded-full bg-navy px-5 py-2 text-sm font-semibold text-white transition hover:bg-navy-dark disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save back"}
        </button>
      </div>
    </Modal>
  );
}
