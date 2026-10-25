"use client";

import { useState } from "react";
import Modal from "./Modal";
import SignaturePad from "./SignaturePad";

// Draw-and-save for a signature — the default one (Settings > Wallets) or a
// single card's. `secondary` adds an extra action beside Save, e.g. "Use my
// default signature" when signing one card.
export default function SignatureModal({
  title,
  description,
  onSave,
  onClose,
  secondary,
}: {
  title: string;
  description: string;
  onSave: (path: string) => Promise<void>;
  onClose: () => void;
  secondary?: { label: string; onClick: () => Promise<void> };
}) {
  const [path, setPath] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      onClose();
    } catch {
      setError("Couldn't save the signature. Please try again.");
      setBusy(false);
    }
  }

  return (
    <Modal onClose={onClose} title={title}>
      <p className="mb-4 text-sm text-surface-foreground-soft">{description}</p>
      <SignaturePad onChange={setPath} />
      {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
        {secondary && (
          <button
            type="button"
            onClick={() => run(secondary.onClick)}
            disabled={busy}
            className="mr-auto rounded-full px-3 py-2 text-sm font-semibold text-surface-foreground-soft transition hover:text-surface-foreground disabled:opacity-50"
          >
            {secondary.label}
          </button>
        )}
        <button type="button" onClick={onClose} className="rounded-full px-4 py-2 text-sm font-semibold text-surface-foreground-soft transition hover:bg-[var(--surface-nav-hover)]">
          Cancel
        </button>
        <button
          type="button"
          onClick={() => path && run(() => onSave(path))}
          disabled={!path || busy}
          className="rounded-full bg-navy px-5 py-2 text-sm font-semibold text-white transition hover:bg-navy-dark disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save signature"}
        </button>
      </div>
    </Modal>
  );
}
