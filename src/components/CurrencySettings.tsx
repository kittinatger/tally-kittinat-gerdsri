"use client";

import { describeFetchError } from "@/lib/fetch-error";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrency } from "@/lib/currency-context";
import CurrencyDropdown from "./CurrencyDropdown";
import { badgeClasses } from "@/lib/category-styles";

function ScanIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
      <path d="M3 7V4.5A1.5 1.5 0 0 1 4.5 3H7M13 3h2.5A1.5 1.5 0 0 1 17 4.5V7M17 13v2.5a1.5 1.5 0 0 1-1.5 1.5H13M7 17H4.5A1.5 1.5 0 0 1 3 15.5V13" />
      <path d="M6.5 10h7" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
      <path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h9A1.5 1.5 0 0 1 15 6.5v8A1.5 1.5 0 0 1 13.5 16h-9A1.5 1.5 0 0 1 3 14.5Z" />
      <path d="M3 8.5h13.5A1.5 1.5 0 0 1 18 10v4a1.5 1.5 0 0 1-1.5 1.5" />
      <circle cx="13.5" cy="11.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ToggleRow({
  icon,
  label,
  description,
  checked,
  disabled,
  onToggle,
  error,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onToggle: () => void;
  error?: string | null;
}) {
  return (
    <div className="p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
              checked ? badgeClasses("green") : badgeClasses("slate")
            }`}
          >
            {icon}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">{label}</p>
            <p className="text-[11px] leading-snug text-ink-soft">{description}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          role="switch"
          aria-checked={checked}
          aria-label={`Toggle ${label}`}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition disabled:opacity-60 ${
            checked ? "bg-navy" : "bg-bg-soft"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
              checked ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>
      {error && <p className="mt-1.5 pl-12 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

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
    <div className="space-y-6">
      <div>
        <h3 className="mb-1 px-1 text-xs font-semibold uppercase tracking-wide text-ink-soft">Default currency</h3>
        <p className="mb-3 px-1 text-[11px] leading-snug text-ink-soft">
          Used for new transactions and everywhere amounts are shown, unless a wallet has its own currency label.
        </p>
        <div className="rounded-card border border-line bg-surface p-4">
          <CurrencyDropdown value={currency} onChange={handleCurrencyChange} disabled={savingCurrency} />
          {currencyError && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{currencyError}</p>}
        </div>
      </div>

      <div>
        <h3 className="mb-1 px-1 text-xs font-semibold uppercase tracking-wide text-ink-soft">Conversion</h3>
        <p className="mb-3 px-1 text-[11px] leading-snug text-ink-soft">
          Uses live exchange rates from{" "}
          <a
            href="https://frankfurter.app"
            target="_blank"
            rel="noreferrer"
            className="text-navy underline hover:no-underline dark:text-blue-300"
          >
            Frankfurter
          </a>
          , a free ECB-rate API.
        </p>

        <div className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
          <ToggleRow
            icon={<ScanIcon />}
            label="Auto-convert"
            description={`Convert detected foreign currencies to ${currency} when scanning or recording.`}
            checked={autoConvert}
            disabled={savingAutoConvert}
            onToggle={handleAutoConvertToggle}
            error={autoConvertError}
          />
          <ToggleRow
            icon={<WalletIcon />}
            label="Convert wallet balances"
            description={`Convert wallets in a different currency to ${currency} for the Dashboard's Net worth total.`}
            checked={convertBalances}
            disabled={savingConvertBalances}
            onToggle={handleConvertBalancesToggle}
            error={convertBalancesError}
          />
        </div>
      </div>
    </div>
  );
}
