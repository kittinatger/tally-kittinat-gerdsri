"use client";

import { describeFetchError } from "@/lib/fetch-error";
import { useState } from "react";
import Modal from "./Modal";
import WalletCardShape from "./WalletCardShape";
import FormSection from "./FormSection";
import ColorGlowPreview from "./ColorGlowPreview";
import { CATEGORY_PALETTE } from "@/lib/categories";
import CardBackgroundPicker from "./CardBackgroundPicker";
import CardTextColorPicker from "./CardTextColorPicker";
import { CARD_NETWORKS, type CardNetwork } from "@/lib/wallet-cards";
import { parseCardBackground, backgroundGlowColor, cardForegroundFor, type CardBackground } from "@/lib/card-backgrounds";
import { CHIP_COLORS, CHIP_COLOR_LABEL_KEYS, CHIP_COLOR_STOPS, DEFAULT_CHIP_COLOR, isChipColor, type ChipColor } from "@/lib/chip-colors";
import {
  BADGE_POSITIONS,
  BADGE_POSITION_LABEL_KEYS,
  DEFAULT_BADGE_POSITION,
  isBadgePosition,
  type BadgePosition,
} from "@/lib/badge-position";
import {
  CHIP_POSITIONS,
  CHIP_POSITION_LABEL_KEYS,
  DEFAULT_CHIP_POSITION,
  isChipPosition,
  type ChipPosition,
} from "@/lib/chip-position";
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
  background: string | null;
  show_network_badge: boolean;
  text_color: string | null;
  show_chip: boolean;
  chip_color: string;
  badge_position: string;
  chip_position: string;
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
    background: parseCardBackground(row.background),
    showNetworkBadge: row.show_network_badge,
    textColor: row.text_color,
    showChip: row.show_chip,
    chipColor: isChipColor(row.chip_color) ? row.chip_color : DEFAULT_CHIP_COLOR,
    badgePosition: isBadgePosition(row.badge_position) ? row.badge_position : DEFAULT_BADGE_POSITION,
    chipPosition: isChipPosition(row.chip_position) ? row.chip_position : DEFAULT_CHIP_POSITION,
    notes: row.notes,
  };
}

const NETWORK_LABEL_KEYS: Record<CardNetwork, MessageKey> = {
  visa: "wallet.networkVisa",
  mastercard: "wallet.networkMastercard",
  amex: "wallet.networkAmex",
  discover: "wallet.networkDiscover",
  jcb: "wallet.networkJcb",
  unionpay: "wallet.networkUnionPay",
  "apple-pay": "wallet.networkApplePay",
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
  const [background, setBackground] = useState<CardBackground | null>(card?.background ?? null);
  const [showNetworkBadge, setShowNetworkBadge] = useState(card?.showNetworkBadge ?? true);
  const [badgePosition, setBadgePosition] = useState<BadgePosition>(card?.badgePosition ?? DEFAULT_BADGE_POSITION);
  const [textColor, setTextColor] = useState<string | null>(card?.textColor ?? null);
  const [showChip, setShowChip] = useState(card?.showChip ?? true);
  const [chipColor, setChipColor] = useState<ChipColor>(card?.chipColor ?? DEFAULT_CHIP_COLOR);
  const [chipPosition, setChipPosition] = useState<ChipPosition>(card?.chipPosition ?? DEFAULT_CHIP_POSITION);
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
        background,
        showNetworkBadge,
        badgePosition,
        textColor,
        showChip,
        chipColor,
        chipPosition,
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
        <ColorGlowPreview color={backgroundGlowColor(background, color)}>
          <WalletCardShape
            label={label || t("wallet.labelPlaceholder")}
            holderName={holderName || null}
            last4={last4 || null}
            expiryMonth={month}
            expiryYear={year}
            network={network}
            color={color}
            background={background}
            showNetworkBadge={showNetworkBadge}
            badgePosition={badgePosition}
            textColor={textColor}
            showChip={showChip}
            chipColor={chipColor}
            chipPosition={chipPosition}
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

          <button
            type="button"
            onClick={() => setShowNetworkBadge((v) => !v)}
            className="flex w-full items-center justify-between gap-3 rounded-card border border-line bg-bg-soft px-3.5 py-2.5 text-left transition"
          >
            <span>
              <span className="block text-sm font-medium text-foreground">{t("wallet.showNetworkBadgeLabel")}</span>
              <span className="block text-xs text-ink-soft">{t("wallet.showNetworkBadgeDesc")}</span>
            </span>
            <span
              role="switch"
              aria-checked={showNetworkBadge}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
                showNetworkBadge ? "bg-navy" : "bg-line"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                  showNetworkBadge ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </span>
          </button>

          {showNetworkBadge && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-soft">{t("wallet.badgePositionLabel")}</label>
              <div className="grid w-24 grid-cols-2 gap-1.5">
                {BADGE_POSITIONS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setBadgePosition(p)}
                    aria-label={t(BADGE_POSITION_LABEL_KEYS[p])}
                    title={t(BADGE_POSITION_LABEL_KEYS[p])}
                    className={`flex h-10 w-10 items-center rounded-lg border transition ${
                      p === "topLeft" || p === "topRight" ? "items-start" : "items-end"
                    } ${p === "topLeft" || p === "bottomLeft" ? "justify-start" : "justify-end"} ${
                      badgePosition === p
                        ? "border-navy bg-navy/10"
                        : "border-line bg-bg-soft hover:bg-[var(--nav-hover-bg)]"
                    } p-1.5`}
                  >
                    <span className={`h-2 w-2 rounded-full ${badgePosition === p ? "bg-navy" : "bg-ink-soft/50"}`} />
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowChip((v) => !v)}
            className="flex w-full items-center justify-between gap-3 rounded-card border border-line bg-bg-soft px-3.5 py-2.5 text-left transition"
          >
            <span>
              <span className="block text-sm font-medium text-foreground">{t("wallet.showChipLabel")}</span>
              <span className="block text-xs text-ink-soft">{t("wallet.showChipDesc")}</span>
            </span>
            <span
              role="switch"
              aria-checked={showChip}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${showChip ? "bg-navy" : "bg-line"}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                  showChip ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </span>
          </button>

          {showChip && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-soft">{t("wallet.chipColorLabel")}</label>
              <div className="flex flex-wrap gap-2">
                {CHIP_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setChipColor(c)}
                    aria-label={t(CHIP_COLOR_LABEL_KEYS[c])}
                    title={t(CHIP_COLOR_LABEL_KEYS[c])}
                    style={{
                      background: `linear-gradient(135deg, ${CHIP_COLOR_STOPS[c].light}, ${CHIP_COLOR_STOPS[c].base}, ${CHIP_COLOR_STOPS[c].dark})`,
                    }}
                    className={`h-8 w-8 shrink-0 rounded-lg border border-line transition ${
                      chipColor === c ? "ring-2 ring-navy ring-offset-2 ring-offset-surface" : ""
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {showChip && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-soft">{t("wallet.chipPositionLabel")}</label>
              <div className="flex gap-1.5">
                {CHIP_POSITIONS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setChipPosition(p)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      chipPosition === p
                        ? "border-navy bg-navy/10 text-navy dark:text-blue-300"
                        : "border-line text-ink-soft hover:bg-[var(--nav-hover-bg)]"
                    }`}
                  >
                    {t(CHIP_POSITION_LABEL_KEYS[p])}
                  </button>
                ))}
              </div>
            </div>
          )}

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
          <CardBackgroundPicker value={background} onChange={setBackground} plainColor={color} onPlainColorChange={setColor} />
          <div className="border-t border-line pt-3">
            <label className="mb-1.5 block text-xs font-semibold text-ink-soft">{t("background.textColorLabel")}</label>
            <CardTextColorPicker value={textColor} onChange={setTextColor} autoColor={cardForegroundFor(null, background, color).full} />
          </div>
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
