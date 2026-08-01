"use client";

import { useState } from "react";
import Modal from "./Modal";
import { CATEGORY_PALETTE } from "@/lib/categories";
import { dotClasses } from "@/lib/category-styles";
import { useCurrency } from "@/lib/currency-context";
import type { WalletKind } from "@/lib/wallets";
import type { WalletOption } from "@/types/wallet";

export default function WalletModal({
  wallet,
  onClose,
  onSaved,
}: {
  wallet?: WalletOption;
  onClose: () => void;
  onSaved: () => void;
}) {
  const currency = useCurrency();
  const isEdit = Boolean(wallet);
  const [name, setName] = useState(wallet?.name ?? "");
  const [color, setColor] = useState<string>(wallet?.color ?? CATEGORY_PALETTE[0]);
  const [kind, setKind] = useState<WalletKind>(wallet?.kind ?? "cash");
  const [startingBalance, setStartingBalance] = useState(isEdit ? String(wallet!.balance) : "0");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = isEdit
        ? await fetch(`/api/wallets/${wallet!.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, color, kind, startingBalance: Number(startingBalance) }),
          })
        : await fetch("/api/wallets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, color, kind }),
          });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not save.");
        return;
      }
      onSaved();
    } catch {
      setError("Network error while saving.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal onClose={onClose} title={isEdit ? "Edit wallet" : "Add wallet"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="walletName" className="mb-1.5 block text-sm font-semibold text-ink-soft">
            Name
          </label>
          <input
            id="walletName"
            type="text"
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Cash, Bank, E-wallet"
            className="w-full rounded-card border border-line bg-bg-soft px-3.5 py-2.5 text-base text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink-soft">Type</label>
          <div className="flex gap-1 rounded-full bg-bg-soft p-1">
            <button
              type="button"
              onClick={() => setKind("cash")}
              className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${
                kind === "cash" ? "bg-surface text-foreground shadow-sm" : "text-ink-soft"
              }`}
            >
              Cash
            </button>
            <button
              type="button"
              onClick={() => setKind("digital")}
              className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${
                kind === "digital" ? "bg-surface text-foreground shadow-sm" : "text-ink-soft"
              }`}
            >
              Digital
            </button>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink-soft">Color</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-label={c}
                className={`h-8 w-8 rounded-full transition ${dotClasses(c)} ${
                  color === c ? "ring-2 ring-navy ring-offset-2 ring-offset-surface" : ""
                }`}
              />
            ))}
          </div>
        </div>

        {isEdit && (
          <div>
            <label htmlFor="walletBalance" className="mb-1.5 block text-sm font-semibold text-ink-soft">
              Balance ({currency})
            </label>
            <input
              id="walletBalance"
              type="number"
              step="0.01"
              required
              value={startingBalance}
              onChange={(e) => setStartingBalance(e.target.value)}
              className="w-full rounded-card border border-line bg-bg-soft px-3.5 py-2.5 text-base text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
            />
            <p className="mt-1.5 text-xs text-ink-soft">
              Sets this wallet&apos;s current balance directly — only transactions logged after this point will move it.
            </p>
          </div>
        )}

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
            {submitting ? "Saving..." : isEdit ? "Save changes" : "Add wallet"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
