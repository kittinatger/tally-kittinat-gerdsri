"use client";

import { describeFetchError } from "@/lib/fetch-error";
import { useState } from "react";
import Modal from "./Modal";
import SelectDropdown from "./SelectDropdown";
import DatePicker from "./DatePicker";
import { todayInputValue } from "@/lib/format";
import type { WalletOption } from "@/types/wallet";

export default function WalletTransferModal({
  wallets,
  onClose,
  onSaved,
}: {
  wallets: WalletOption[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [fromWalletId, setFromWalletId] = useState(wallets[0].id);
  const [toWalletId, setToWalletId] = useState(wallets.find((w) => w.id !== wallets[0].id)?.id ?? wallets[0].id);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayInputValue());
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fromName = wallets.find((w) => w.id === fromWalletId)?.name ?? "";
  const toName = wallets.find((w) => w.id === toWalletId)?.name ?? "";

  function handleFromChange(name: string) {
    const wallet = wallets.find((w) => w.name === name);
    if (!wallet) return;
    setFromWalletId(wallet.id);
    if (wallet.id === toWalletId) {
      const other = wallets.find((w) => w.id !== wallet.id);
      if (other) setToWalletId(other.id);
    }
  }

  function handleToChange(name: string) {
    const wallet = wallets.find((w) => w.name === name);
    if (!wallet) return;
    setToWalletId(wallet.id);
    if (wallet.id === fromWalletId) {
      const other = wallets.find((w) => w.id !== wallet.id);
      if (other) setFromWalletId(other.id);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/wallets/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromWalletId,
          toWalletId,
          amount: Number(amount),
          date,
          notes: notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not transfer.");
        return;
      }
      onSaved();
    } catch (err) {
      setError(describeFetchError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal onClose={onClose} title="Transfer between wallets">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink-soft">From</label>
            <SelectDropdown value={fromName} options={wallets.map((w) => w.name)} onChange={handleFromChange} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink-soft">To</label>
            <SelectDropdown value={toName} options={wallets.map((w) => w.name)} onChange={handleToChange} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="transferDate" className="mb-1.5 block text-sm font-semibold text-ink-soft">
              Date
            </label>
            <DatePicker id="transferDate" value={date} onChange={setDate} required />
          </div>
          <div>
            <label htmlFor="transferAmount" className="mb-1.5 block text-sm font-semibold text-ink-soft">
              Amount
            </label>
            <input
              id="transferAmount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-card border border-line bg-bg-soft px-3.5 py-2.5 text-base text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
            />
          </div>
        </div>

        <div>
          <label htmlFor="transferNotes" className="mb-1.5 block text-sm font-semibold text-ink-soft">
            Notes (optional)
          </label>
          <textarea
            id="transferNotes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add a note..."
            className="w-full resize-none rounded-card border border-line bg-bg-soft px-3.5 py-2.5 text-base text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
          />
        </div>

        <p className="text-xs text-ink-soft">
          Moves {fromName || "—"} → {toName || "—"} without counting as income or spending — same as any other
          transfer.
        </p>

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
            disabled={submitting || fromWalletId === toWalletId}
            className="rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-navy-dark disabled:opacity-60"
          >
            {submitting ? "Transferring..." : "Transfer"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
