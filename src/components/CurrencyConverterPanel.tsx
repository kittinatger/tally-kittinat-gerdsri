"use client";

import { useEffect, useRef, useState } from "react";
import CurrencyDropdown from "./CurrencyDropdown";
import { CURRENCIES } from "@/lib/currencies";
import { formatCurrency } from "@/lib/format";
import { useCurrency } from "@/lib/currency-context";
import { useT } from "@/lib/language-context";

function SwapIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M4 7h11l-3-3M16 13H5l3 3" />
    </svg>
  );
}

// A quick "convert X from A to B" calculator, independent of an actual
// wallet transfer — reuses the same /api/exchange-rate route and
// CurrencyDropdown built for WalletTransferModal's conversion preview.
export default function CurrencyConverterPanel() {
  const t = useT();
  const appCurrency = useCurrency();
  const [amount, setAmount] = useState("1");
  const [from, setFrom] = useState(appCurrency);
  const [to, setTo] = useState(() => CURRENCIES.find((c) => c.code !== appCurrency)?.code ?? appCurrency);
  const [converted, setConverted] = useState<number | null>(null);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const amountNum = Number(amount);
    if (!amount || !Number.isFinite(amountNum) || amountNum <= 0) {
      debounceRef.current = setTimeout(() => {
        setConverted(null);
        setError(null);
        setConverting(false);
      }, 0);
      return () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
      };
    }

    if (from === to) {
      debounceRef.current = setTimeout(() => {
        setConverted(amountNum);
        setError(null);
        setConverting(false);
      }, 0);
      return () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
      };
    }

    debounceRef.current = setTimeout(() => {
      setConverting(true);
      setError(null);
      fetch(`/api/exchange-rate?from=${from}&to=${to}&amount=${amountNum}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (typeof data?.converted === "number") {
            setConverted(data.converted);
          } else {
            setConverted(null);
            setError(t("currencyConverter.error"));
          }
        })
        .catch(() => {
          setConverted(null);
          setError(t("currencyConverter.error"));
        })
        .finally(() => setConverting(false));
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [amount, from, to, t]);

  function handleSwap() {
    setFrom(to);
    setTo(from);
  }

  return (
    <div className="flex flex-col gap-8">
      <h3 className="font-display text-2xl text-foreground">{t("currencyConverter.title")}</h3>

      <section className="rounded-card border border-line bg-surface p-4">
        <div className="flex flex-col gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink-soft">{t("currencyConverter.amountLabel")}</label>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-input border border-line bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-surface-accent"
            />
          </div>

          <div className="flex items-end gap-2">
            <div className="min-w-0 flex-1">
              <label className="mb-1.5 block text-xs font-semibold text-ink-soft">{t("currencyConverter.fromLabel")}</label>
              <CurrencyDropdown value={from} onChange={setFrom} />
            </div>
            <button
              type="button"
              onClick={handleSwap}
              aria-label={t("currencyConverter.swap")}
              className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line text-ink-soft transition hover:bg-[var(--nav-hover-bg)]"
            >
              <SwapIcon />
            </button>
            <div className="min-w-0 flex-1">
              <label className="mb-1.5 block text-xs font-semibold text-ink-soft">{t("currencyConverter.toLabel")}</label>
              <CurrencyDropdown value={to} onChange={setTo} />
            </div>
          </div>

          <div className="mt-1 rounded-card border border-line bg-background p-3.5 text-center">
            {error ? (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            ) : converting ? (
              <p className="text-sm text-ink-soft">{t("currencyConverter.converting")}</p>
            ) : converted !== null ? (
              <p className="text-2xl font-bold text-foreground">{formatCurrency(converted, to)}</p>
            ) : (
              <p className="text-sm text-ink-soft">{t("currencyConverter.enterAmount")}</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
