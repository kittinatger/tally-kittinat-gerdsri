"use client";

import { describeFetchError } from "@/lib/fetch-error";
import { useEffect, useRef, useState } from "react";
import Modal from "./Modal";
import SelectDropdown from "./SelectDropdown";
import DatePicker from "./DatePicker";
import { todayInputValue } from "@/lib/format";
import { useCurrency } from "@/lib/currency-context";
import { useT } from "@/lib/language-context";
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
  const t = useT();
  const appCurrency = useCurrency();
  const [fromWalletId, setFromWalletId] = useState(wallets[0].id);
  const [toWalletId, setToWalletId] = useState(wallets.find((w) => w.id !== wallets[0].id)?.id ?? wallets[0].id);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayInputValue());
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fromWallet = wallets.find((w) => w.id === fromWalletId);
  const toWallet = wallets.find((w) => w.id === toWalletId);
  const fromName = fromWallet?.name ?? "";
  const toName = toWallet?.name ?? "";
  const fromCurrency = fromWallet?.currency ?? appCurrency;
  const toCurrency = toWallet?.currency ?? appCurrency;
  const differentCurrencies = fromCurrency !== toCurrency;

  // The destination amount, in the destination wallet's own currency —
  // only meaningful (and only shown) when the two wallets' currencies
  // differ; otherwise the same number just moves to both legs, as before.
  // Auto-filled from convertAmount (via /api/exchange-rate) whenever the
  // source amount/either wallet changes, but stays user-editable so a
  // real rate the user actually got can override the estimate — same
  // "auto-suggest, never enforced" pattern used elsewhere in this app
  // (e.g. a template's country auto-suggested from its locked currency).
  const [toAmount, setToAmount] = useState("");
  const [toAmountTouched, setToAmountTouched] = useState(false);
  const [converting, setConverting] = useState(false);

  // Untouch (go back to auto-filling) whenever which currencies are even
  // involved changes — a manual correction for one currency pair isn't a
  // meaningful starting point for a different pair. Adjusted during
  // render (comparing against the last-seen pair) rather than in an
  // effect, since this is deriving state from a prop/state change, not
  // synchronizing with anything external — the pattern React itself
  // recommends over a setState-on-mount-of-dependency-change effect.
  const currencyPairKey = `${fromCurrency}:${toCurrency}`;
  const [lastCurrencyPairKey, setLastCurrencyPairKey] = useState(currencyPairKey);
  if (currencyPairKey !== lastCurrencyPairKey) {
    setLastCurrencyPairKey(currencyPairKey);
    setToAmountTouched(false);
  }

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    // Every branch schedules its state update inside a timeout callback
    // (even the "nothing to do" ones, at 0ms) rather than calling setState
    // directly in the effect body, to steer clear of the cascading-render
    // footgun that pattern invites.
    if (!differentCurrencies || toAmountTouched) {
      debounceRef.current = setTimeout(() => setConverting(false), 0);
      return () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
      };
    }

    const amountNum = Number(amount);
    if (!amount || !Number.isFinite(amountNum) || amountNum <= 0) {
      debounceRef.current = setTimeout(() => setToAmount(""), 0);
      return () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
      };
    }

    debounceRef.current = setTimeout(() => {
      setConverting(true);
      fetch(`/api/exchange-rate?from=${fromCurrency}&to=${toCurrency}&amount=${amountNum}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (typeof data?.converted === "number") {
            setToAmount(data.converted.toFixed(2));
          }
        })
        .catch(() => {
          // Silent — the field just stays whatever it already was, and
          // the user can always type an amount in manually.
        })
        .finally(() => setConverting(false));
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [amount, fromCurrency, toCurrency, differentCurrencies, toAmountTouched]);

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
      const toAmountNum = Number(toAmount);
      const res = await fetch("/api/wallets/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromWalletId,
          toWalletId,
          amount: Number(amount),
          ...(differentCurrencies && toAmount && Number.isFinite(toAmountNum) && toAmountNum > 0
            ? { toAmount: toAmountNum }
            : {}),
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
    <Modal onClose={onClose} title={t("walletTransfer.title")}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink-soft">
              {t("walletTransfer.from")} <span className="font-normal text-ink-soft">({fromCurrency})</span>
            </label>
            <SelectDropdown value={fromName} options={wallets.map((w) => w.name)} onChange={handleFromChange} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink-soft">
              {t("walletTransfer.to")} <span className="font-normal text-ink-soft">({toCurrency})</span>
            </label>
            <SelectDropdown value={toName} options={wallets.map((w) => w.name)} onChange={handleToChange} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="transferDate" className="mb-1.5 block text-sm font-semibold text-ink-soft">
              {t("common.date")}
            </label>
            <DatePicker id="transferDate" value={date} onChange={setDate} required />
          </div>
          <div>
            <label htmlFor="transferAmount" className="mb-1.5 block text-sm font-semibold text-ink-soft">
              {t("walletTransfer.amountLabel")}
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

        {/* Only shown when the two wallets' currencies actually differ —
         * a same-currency transfer still just moves one identical number,
         * same as before this feature existed. */}
        {differentCurrencies && (
          <div>
            <label htmlFor="transferToAmount" className="mb-1.5 block text-sm font-semibold text-ink-soft">
              {t("walletTransfer.toAmountLabel").replace("{currency}", toCurrency)}
            </label>
            <input
              id="transferToAmount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={toAmount}
              onChange={(e) => {
                setToAmount(e.target.value);
                setToAmountTouched(true);
              }}
              placeholder={converting ? t("walletTransfer.converting") : "0.00"}
              className="w-full rounded-card border border-line bg-bg-soft px-3.5 py-2.5 text-base text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
            />
            <p className="mt-1 text-[11px] text-ink-soft">{t("walletTransfer.toAmountHint")}</p>
          </div>
        )}

        <div>
          <label htmlFor="transferNotes" className="mb-1.5 block text-sm font-semibold text-ink-soft">
            {t("walletTransfer.notesLabel")}
          </label>
          <textarea
            id="transferNotes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t("walletTransfer.notesPlaceholder")}
            className="w-full resize-none rounded-card border border-line bg-bg-soft px-3.5 py-2.5 text-base text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
          />
        </div>

        <p className="text-xs text-ink-soft">
          {t("walletTransfer.movesPrefix")} {fromName || "—"} → {toName || "—"} {t("walletTransfer.movesSuffix")}
        </p>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2.5 text-sm font-semibold text-ink-soft transition hover:bg-[var(--nav-hover-bg)] hover:text-foreground"
          >
            {t("common.cancel")}
          </button>
          <button
            type="submit"
            disabled={submitting || fromWalletId === toWalletId}
            className="rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-navy-dark disabled:opacity-60"
          >
            {submitting ? t("walletTransfer.transferring") : t("common.transfer")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
