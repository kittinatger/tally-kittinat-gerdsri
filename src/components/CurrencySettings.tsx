"use client";

import { describeFetchError } from "@/lib/fetch-error";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrency } from "@/lib/currency-context";
import CurrencyDropdown from "./CurrencyDropdown";

export default function CurrencySettings() {
  const router = useRouter();
  const currency = useCurrency();
  const [savingCurrency, setSavingCurrency] = useState(false);
  const [currencyError, setCurrencyError] = useState<string | null>(null);
  const [autoConvert, setAutoConvert] = useState(false);
  const [savingAutoConvert, setSavingAutoConvert] = useState(false);
  const [autoConvertError, setAutoConvertError] = useState<string | null>(null);

  const [convertBalances, setConvertBalances] = useState(false);
  const [savingConvertBalances, setSavingConvertBalances] = useState(false);
  const [convertBalancesError, setConvertBalancesError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setAutoConvert(Boolean(data.autoConvertCurrency));
        setConvertBalances(Boolean(data.convertWalletBalances));
      })
      .catch(() => {
        // Leave the toggles at their defaults; the user can still flip them.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCurrencyChange(code: string) {
    if (code === currency) return;
    setSavingCurrency(true);
    setCurrencyError(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currency: code }),
      });
      if (!res.ok) {
        setCurrencyError("Could not save currency.");
        return;
      }
      router.refresh();
    } catch (err) {
      setCurrencyError(describeFetchError(err));
    } finally {
      setSavingCurrency(false);
    }
  }

  async function handleAutoConvertToggle() {
    const next = !autoConvert;
    setAutoConvert(next);
    setSavingAutoConvert(true);
    setAutoConvertError(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoConvertCurrency: next }),
      });
      if (!res.ok) {
        setAutoConvert(!next);
        setAutoConvertError("Could not save.");
      }
    } catch (err) {
      setAutoConvert(!next);
      setAutoConvertError(describeFetchError(err));
    } finally {
      setSavingAutoConvert(false);
    }
  }

  async function handleConvertBalancesToggle() {
    const next = !convertBalances;
    setConvertBalances(next);
    setSavingConvertBalances(true);
    setConvertBalancesError(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ convertWalletBalances: next }),
      });
      if (!res.ok) {
        setConvertBalances(!next);
        setConvertBalancesError("Could not save.");
        return;
      }
      router.refresh();
    } catch (err) {
      setConvertBalances(!next);
      setConvertBalancesError(describeFetchError(err));
    } finally {
      setSavingConvertBalances(false);
    }
  }

  return (
    <div className="rounded-card border border-line bg-surface p-5">
      <div>
        <p className="mb-1.5 text-sm font-medium text-foreground">Default currency</p>
        <CurrencyDropdown value={currency} onChange={handleCurrencyChange} disabled={savingCurrency} />
        {currencyError && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{currencyError}</p>}
      </div>

      <div className="mt-3.5 border-t border-[var(--glass-border)] pt-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">Auto-convert</p>
            <p className="mt-0.5 text-[11px] leading-snug text-ink-soft">
              Convert detected foreign currencies to {currency} when scanning or recording.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAutoConvertToggle}
            disabled={savingAutoConvert}
            role="switch"
            aria-checked={autoConvert}
            aria-label="Toggle automatic currency conversion"
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition disabled:opacity-60 ${
              autoConvert ? "bg-navy" : "bg-bg-soft"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                autoConvert ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
        {autoConvertError && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{autoConvertError}</p>}
      </div>

      <div className="mt-3.5 border-t border-[var(--glass-border)] pt-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">Convert wallet balances</p>
            <p className="mt-0.5 text-[11px] leading-snug text-ink-soft">
              Convert wallets in a different currency to {currency} for the Dashboard&apos;s Net worth total.
            </p>
          </div>
          <button
            type="button"
            onClick={handleConvertBalancesToggle}
            disabled={savingConvertBalances}
            role="switch"
            aria-checked={convertBalances}
            aria-label="Toggle wallet balance conversion"
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition disabled:opacity-60 ${
              convertBalances ? "bg-navy" : "bg-bg-soft"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                convertBalances ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
        {convertBalancesError && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{convertBalancesError}</p>}
      </div>
    </div>
  );
}
