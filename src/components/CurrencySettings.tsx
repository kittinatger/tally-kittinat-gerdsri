"use client";

import { describeFetchError } from "@/lib/fetch-error";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrency } from "@/lib/currency-context";
import CurrencyDropdown from "./CurrencyDropdown";
import { badgeClasses } from "@/lib/category-styles";
import { useT } from "@/lib/language-context";
import { ScanIcon as PhScanIcon, WalletIcon as PhWalletIcon } from "@phosphor-icons/react/dist/ssr";

function ScanIcon() {
  return <PhScanIcon weight="fill" aria-hidden="true" className="h-4.5 w-4.5" />;
}

function WalletIcon() {
  return <PhWalletIcon weight="fill" aria-hidden="true" className="h-4.5 w-4.5" />;
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
      {error && <p className="mt-1.5 pl-12 text-xs text-red-600 dark:text-red-400 animate-[fade-in_0.15s_ease-out] motion-reduce:animate-none">{error}</p>}
    </div>
  );
}

export default function CurrencySettings() {
  const router = useRouter();
  const t = useT();
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
        <h3 className="mb-1 px-1 text-xs font-semibold uppercase tracking-wide text-ink-soft">{t("currency.defaultCurrency")}</h3>
        <p className="mb-3 px-1 text-[11px] leading-snug text-ink-soft">
          {t("currency.defaultCurrencyDesc")}
        </p>
        <div className="rounded-card border border-line bg-surface p-4">
          <CurrencyDropdown value={currency} onChange={handleCurrencyChange} disabled={savingCurrency} />
          {currencyError && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 animate-[fade-in_0.15s_ease-out] motion-reduce:animate-none">{currencyError}</p>}
        </div>
      </div>

      <div>
        <h3 className="mb-1 px-1 text-xs font-semibold uppercase tracking-wide text-ink-soft">{t("currency.conversion")}</h3>
        <p className="mb-3 px-1 text-[11px] leading-snug text-ink-soft">
          {t("currency.conversionDescPrefix")}{" "}
          <a
            href="https://frankfurter.app"
            target="_blank"
            rel="noreferrer"
            className="text-navy underline hover:no-underline dark:text-blue-300"
          >
            Frankfurter
          </a>
          {t("currency.conversionDescSuffix")}
        </p>

        <div className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
          <ToggleRow
            icon={<ScanIcon />}
            label={t("currency.autoConvert")}
            description={`${t("currency.autoConvertDescPrefix")} ${currency} ${t("currency.autoConvertDescSuffix")}`}
            checked={autoConvert}
            disabled={savingAutoConvert}
            onToggle={handleAutoConvertToggle}
            error={autoConvertError}
          />
          <ToggleRow
            icon={<WalletIcon />}
            label={t("currency.convertBalances")}
            description={`${t("currency.convertBalancesDescPrefix")} ${currency} ${t("currency.convertBalancesDescSuffix")}`}
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
