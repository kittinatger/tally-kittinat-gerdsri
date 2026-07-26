"use client";

import { useState } from "react";
import Modal from "./Modal";

export default function EditBalanceModal({
  currentValue,
  onClose,
  onSaved,
}: {
  currentValue: number;
  onClose: () => void;
  onSaved: (value: number) => void;
}) {
  const [value, setValue] = useState(String(currentValue));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number(value);
    if (!Number.isFinite(amount)) {
      setError("Enter a valid number.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startingBalance: amount }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not save.");
        return;
      }
      onSaved(Number(data.startingBalance));
    } catch {
      setError("Network error while saving.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal onClose={onClose} title="Starting balance">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="startingBalance" className="mb-1.5 block text-sm font-semibold text-ink-soft">
            Balance to start counting from
          </label>
          <input
            id="startingBalance"
            type="number"
            inputMode="decimal"
            step="0.01"
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full rounded-card border border-line bg-bg-soft px-3.5 py-2.5 text-base text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
          />
          <p className="mt-2 text-xs text-ink-soft">
            &quot;Remaining&quot; is calculated as this balance plus all income minus all expenses you&apos;ve
            logged.
          </p>
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2.5 text-sm font-semibold text-ink-soft transition hover:bg-[var(--nav-hover-bg)] hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-navy-dark disabled:opacity-60"
          >
            {submitting ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
