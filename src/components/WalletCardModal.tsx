"use client";

import { describeFetchError } from "@/lib/fetch-error";
import { useState } from "react";
import Modal from "./Modal";
import WalletCardShape from "./WalletCardShape";
import FormSection from "./FormSection";
import ColorGlowPreview from "./ColorGlowPreview";
import { CATEGORY_PALETTE } from "@/lib/categories";
import ColorPicker from "./ColorPicker";
import { CARD_NETWORKS, type CardNetwork } from "@/lib/wallet-cards";
import { CategoryIcon, PaletteIcon, FileIcon } from "@/lib/icons";
import { useT } from "@/lib/language-context";
import type { MessageKey } from "@/lib/i18n/messages";
import type { WalletCard } from "@/types/wallet-card";

type WalletCardApiRow = {
  id: number;
  label: string;
  holder_name: string | null;
  last4: string | null;
  expiry_month: number | null;
  expiry_year: number | null;
  network: string;
  color: string;
  notes: string | null;
};

function toWalletCard(row: WalletCardApiRow): WalletCard {
  const network = (CARD_NETWORKS as readonly string[]).includes(row.network) ? (row.network as CardNetwork) : "other";
  return {
    id: row.id,
    label: row.label,
    holderName: row.holder_name,
    last4: row.last4,
    expiryMonth: row.expiry_month,
    expiryYear: row.expiry_year,
    network,
    color: row.color,
    notes: row.notes,
  };
}

const NETWORK_LABEL_KEYS: Record<CardNetwork, MessageKey> = {
  visa: "wallet.networkVisa",
  mastercard: "wallet.networkMastercard",
  amex: "wallet.networkAmex",
  discover: "wallet.networkDiscover",
  other: "wallet.networkOther",
};

export default function WalletCardModal({
  card,
  onClose,
  onSaved,
}: {
  card?: WalletCard;
  onClose: () => void;
  onSaved: (card: WalletCard) => void;
}) {
  const t = useT();
  const isEdit = Boolean(card);
  const [label, setLabel] = useState(card?.label ?? "");
  const [holderName, setHolderName] = useState(card?.holderName ?? "");
  const [last4, setLast4] = useState(card?.last4 ?? "");
  const [expiryMonth, setExpiryMonth] = useState(card?.expiryMonth ? String(card.expiryMonth) : "");
  const [expiryYear, setExpiryYear] = useState(card?.expiryYear ? String(card.expiryYear) : "");
  const [network, setNetwork] = useState<CardNetwork>(card?.network ?? "other");
  const [color, setColor] = useState<string>(card?.color ?? CATEGORY_PALETTE[0]);
  const [notes, setNotes] = useState(card?.notes ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const month = expiryMonth ? Number(expiryMonth) : null;
  const year = expiryYear ? Number(expiryYear) : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const body = {
        label,
        holderName: holderName.trim() || null,
        last4: last4.trim() || null,
        expiryMonth: month,
        expiryYear: year,
        network,
        color,
        notes: notes.trim() || null,
      };
      const res = isEdit
        ? await fetch(`/api/wallet-cards/${card!.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch("/api/wallet-cards", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not save.");
        return;
      }
      onSaved(toWalletCard(data.card as WalletCardApiRow));
    } catch (err) {
      setError(describeFetchError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal onClose={onClose} title={isEdit ? t("wallet.editCard") : t("wallet.addCard")}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <ColorGlowPreview color={color}>
          <WalletCardShape
            label={label || t("wallet.labelPlaceholder")}
            holderName={holderName || null}
            last4={last4 || null}
            expiryMonth={month}
            expiryYear={year}
            network={network}
            color={color}
          />
        </ColorGlowPreview>

        <FormSection icon={<CategoryIcon iconKey="card" className="h-4 w-4" />} title={t("wallet.labelLabel")}>
          <input
            id="walletCardLabel"
            type="text"
            required
            autoFocus
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={t("wallet.labelPlaceholder")}
            className="w-full rounded-card border border-line bg-bg-soft px-3.5 py-2.5 text-base text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
          />

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink-soft">{t("wallet.networkLabel")}</label>
            <div className="flex flex-wrap gap-1.5">
              {CARD_NETWORKS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setNetwork(n)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    network === n
                      ? "border-navy bg-navy/10 text-navy dark:text-blue-300"
                      : "border-line text-ink-soft hover:bg-[var(--nav-hover-bg)]"
                  }`}
                >
                  {t(NETWORK_LABEL_KEYS[n])}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="walletCardLast4" className="mb-1.5 block text-xs font-semibold text-ink-soft">
              {t("wallet.last4Label")}
            </label>
            <input
              id="walletCardLast4"
              type="text"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              value={last4}
              onChange={(e) => setLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="1234"
              className="w-full rounded-card border border-line bg-bg-soft px-3.5 py-2.5 text-base text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
            />
            <p className="mt-1 text-[11px] text-ink-soft">{t("wallet.last4Hint")}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="walletCardHolder" className="mb-1.5 block text-xs font-semibold text-ink-soft">
                {t("wallet.holderLabel")}
              </label>
              <input
                id="walletCardHolder"
                type="text"
                value={holderName}
                onChange={(e) => setHolderName(e.target.value)}
                placeholder={t("wallet.holderPlaceholder")}
                className="w-full rounded-card border border-line bg-bg-soft px-3.5 py-2.5 text-base text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
              />
            </div>
            <div>
              <label htmlFor="walletCardExpiry" className="mb-1.5 block text-xs font-semibold text-ink-soft">
                {t("wallet.expiryLabel")}
              </label>
              <div id="walletCardExpiry" className="flex items-center gap-1.5">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={2}
                  value={expiryMonth}
                  onChange={(e) => setExpiryMonth(e.target.value.replace(/\D/g, "").slice(0, 2))}
                  placeholder="MM"
                  aria-label={t("wallet.expiryMonthLabel")}
                  className="w-full rounded-card border border-line bg-bg-soft px-3 py-2.5 text-base text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
                />
                <span className="text-ink-soft">/</span>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  value={expiryYear}
                  onChange={(e) => setExpiryYear(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="YYYY"
                  aria-label={t("wallet.expiryYearLabel")}
                  className="w-full rounded-card border border-line bg-bg-soft px-3 py-2.5 text-base text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
                />
              </div>
            </div>
          </div>
        </FormSection>

        <FormSection icon={<PaletteIcon className="h-4 w-4" />} title={t("membership.colorLabel")}>
          <ColorPicker value={color} onChange={setColor} />
        </FormSection>

        <FormSection icon={<FileIcon className="h-4 w-4" />} title={t("membership.notesLabel")}>
          <textarea
            id="walletCardNotes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t("membership.notesPlaceholder")}
            className="w-full resize-none rounded-card border border-line bg-bg-soft px-3.5 py-2.5 text-base text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
          />
        </FormSection>

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
            {submitting ? t("common.saving") : isEdit ? t("form.saveChanges") : t("wallet.addCard")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
