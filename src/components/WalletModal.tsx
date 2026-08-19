"use client";

import { describeFetchError } from "@/lib/fetch-error";
import { useState } from "react";
import Modal from "./Modal";
import SelectDropdown from "./SelectDropdown";
import { CATEGORY_PALETTE } from "@/lib/categories";
import ColorPicker from "./ColorPicker";
import { useCurrency } from "@/lib/currency-context";
import { CURRENCIES } from "@/lib/currencies";
import { useT } from "@/lib/language-context";
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
  const t = useT();
  const appCurrency = useCurrency();
  const isEdit = Boolean(wallet);
  const [name, setName] = useState(wallet?.name ?? "");
  const [color, setColor] = useState<string>(wallet?.color ?? CATEGORY_PALETTE[0]);
  const [kind, setKind] = useState<WalletKind>(wallet?.kind ?? "cash");
  const [currency, setCurrency] = useState<string | null>(wallet?.currency ?? null);
  const [isDefault, setIsDefault] = useState(wallet?.isDefault ?? false);
  const [startingBalance, setStartingBalance] = useState(isEdit ? String(wallet!.balance) : "0");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const appDefaultLabel = t("wallet.appDefault");
  const currencyOptions = [`${appDefaultLabel} (${appCurrency})`, ...CURRENCIES.map((c) => `${c.code} — ${c.name}`)];
  const currencyValue = currency
    ? (CURRENCIES.find((c) => c.code === currency) ? `${currency} — ${CURRENCIES.find((c) => c.code === currency)!.name}` : currency)
    : `${appDefaultLabel} (${appCurrency})`;

  function handleCurrencyChange(label: string) {
    if (label.startsWith(appDefaultLabel)) {
      setCurrency(null);
      return;
    }
    setCurrency(label.split(" — ")[0]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = isEdit
        ? await fetch(`/api/wallets/${wallet!.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name,
              color,
              kind,
              currency,
              startingBalance: Number(startingBalance),
              ...(isDefault && !wallet!.isDefault ? { isDefault: true } : {}),
            }),
          })
        : await fetch("/api/wallets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, color, kind, currency }),
          });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not save.");
        return;
      }
      if (!isEdit && isDefault && data.wallet?.id) {
        await fetch(`/api/wallets/${data.wallet.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isDefault: true }),
        });
      }
      onSaved();
    } catch (err) {
      setError(describeFetchError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal onClose={onClose} title={isEdit ? t("wallet.editTitle") : t("wallet.addWallet")}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="walletName" className="mb-1.5 block text-sm font-semibold text-ink-soft">
            {t("wallet.nameLabel")}
          </label>
          <input
            id="walletName"
            type="text"
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("wallet.namePlaceholder")}
            className="w-full rounded-card border border-line bg-bg-soft px-3.5 py-2.5 text-base text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink-soft">{t("wallet.typeLabel")}</label>
          <div className="flex gap-1 rounded-full bg-bg-soft p-1">
            <button
              type="button"
              onClick={() => setKind("cash")}
              className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${
                kind === "cash" ? "bg-surface text-foreground shadow-sm" : "text-ink-soft"
              }`}
            >
              {t("wallet.cash")}
            </button>
            <button
              type="button"
              onClick={() => setKind("digital")}
              className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${
                kind === "digital" ? "bg-surface text-foreground shadow-sm" : "text-ink-soft"
              }`}
            >
              {t("wallet.digital")}
            </button>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink-soft">{t("wallet.colorLabel")}</label>
          <ColorPicker value={color} onChange={setColor} />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink-soft">{t("wallet.currencyLabel")}</label>
          <SelectDropdown value={currencyValue} options={currencyOptions} onChange={handleCurrencyChange} />
          <p className="mt-1.5 text-xs text-ink-soft">
            {t("wallet.currencyNote")}
          </p>
        </div>

        {isEdit && (
          <div>
            <label htmlFor="walletBalance" className="mb-1.5 block text-sm font-semibold text-ink-soft">
              {t("wallet.balanceLabel")} ({currency ?? appCurrency})
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
              {t("wallet.balanceNote")}
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsDefault((v) => !v)}
          disabled={isEdit && wallet!.isDefault}
          className="flex w-full items-center justify-between gap-3 rounded-card border border-line bg-bg-soft px-3.5 py-2.5 text-left transition disabled:opacity-60"
        >
          <span>
            <span className="block text-sm font-medium text-foreground">{t("wallet.defaultWalletLabel")}</span>
            <span className="block text-xs text-ink-soft">{t("wallet.defaultWalletDesc")}</span>
          </span>
          <span
            role="switch"
            aria-checked={isDefault}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
              isDefault ? "bg-navy" : "bg-line"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                isDefault ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </span>
        </button>

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
            disabled={submitting}
            className="rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-navy-dark disabled:opacity-60"
          >
            {submitting ? t("common.saving") : isEdit ? t("form.saveChanges") : t("wallet.addWallet")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
