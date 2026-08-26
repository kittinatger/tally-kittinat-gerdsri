"use client";

import { describeFetchError } from "@/lib/fetch-error";
import { useState } from "react";
import Modal from "./Modal";
import SelectDropdown from "./SelectDropdown";
import FormSection from "./FormSection";
import ColorGlowPreview from "./ColorGlowPreview";
import AccountCardShape from "./AccountCardShape";
import WalletCardShape from "./WalletCardShape";
import CardBackgroundPicker from "./CardBackgroundPicker";
import CardTextColorPicker from "./CardTextColorPicker";
import { CATEGORY_PALETTE } from "@/lib/categories";
import { parseCardBackground, backgroundGlowColor, cardForegroundFor, type CardBackground } from "@/lib/card-backgrounds";
import { CategoryIcon, PaletteIcon, FileIcon } from "@/lib/icons";
import { useCurrency } from "@/lib/currency-context";
import { CURRENCIES } from "@/lib/currencies";
import { useT } from "@/lib/language-context";
import type { WalletKind } from "@/lib/wallets";
import type { WalletOption } from "@/types/wallet";
import { CARD_NETWORKS, type CardNetwork } from "@/lib/wallet-cards";
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
  other: "wallet.networkOther",
};

// The "Add wallet" entry now opens straight into this one form instead of
// a separate bank-account-vs-card chooser modal — a segmented toggle up
// top picks which kind, and the rest of the form (and the submit target:
// POST /api/wallets or POST /api/wallet-cards) follows from that. Editing
// an existing account or card still goes through WalletModal/
// WalletCardModal directly (unchanged) — the toggle only matters when you
// don't yet know which one you're creating.
export default function WalletOrCardModal({
  onClose,
  onSavedAccount,
  onSavedCard,
}: {
  onClose: () => void;
  onSavedAccount: () => void;
  onSavedCard: (card: WalletCard) => void;
}) {
  const t = useT();
  const appCurrency = useCurrency();
  const [kind, setKind] = useState<"account" | "card">("account");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Account fields
  const [name, setName] = useState("");
  const [accountColor, setAccountColor] = useState<string>(CATEGORY_PALETTE[0]);
  const [accountBackground, setAccountBackground] = useState<CardBackground | null>(null);
  const [accountTextColor, setAccountTextColor] = useState<string | null>(null);
  const [walletKind, setWalletKind] = useState<WalletKind>("cash");
  const [currency, setCurrency] = useState<string | null>(null);
  const [isDefault, setIsDefault] = useState(false);

  // Card fields
  const [label, setLabel] = useState("");
  const [holderName, setHolderName] = useState("");
  const [last4, setLast4] = useState("");
  const [expiryMonth, setExpiryMonth] = useState("");
  const [expiryYear, setExpiryYear] = useState("");
  const [network, setNetwork] = useState<CardNetwork>("other");
  const [cardColor, setCardColor] = useState<string>(CATEGORY_PALETTE[0]);
  const [cardBackground, setCardBackground] = useState<CardBackground | null>(null);
  const [showNetworkBadge, setShowNetworkBadge] = useState(true);
  const [badgePosition, setBadgePosition] = useState<BadgePosition>(DEFAULT_BADGE_POSITION);
  const [cardTextColor, setCardTextColor] = useState<string | null>(null);
  const [showChip, setShowChip] = useState(true);
  const [chipColor, setChipColor] = useState<ChipColor>(DEFAULT_CHIP_COLOR);
  const [chipPosition, setChipPosition] = useState<ChipPosition>(DEFAULT_CHIP_POSITION);
  const [notes, setNotes] = useState("");

  const appDefaultLabel = t("wallet.appDefault");
  const currencyOptions = [`${appDefaultLabel} (${appCurrency})`, ...CURRENCIES.map((c) => `${c.code} — ${c.name}`)];
  const currencyValue = currency
    ? (CURRENCIES.find((c) => c.code === currency) ? `${currency} — ${CURRENCIES.find((c) => c.code === currency)!.name}` : currency)
    : `${appDefaultLabel} (${appCurrency})`;

  function handleCurrencyChange(labelText: string) {
    if (labelText.startsWith(appDefaultLabel)) {
      setCurrency(null);
      return;
    }
    setCurrency(labelText.split(" — ")[0]);
  }

  const previewWallet: WalletOption = {
    id: 0,
    name: name || t("wallet.namePlaceholder"),
    color: accountColor,
    background: accountBackground,
    textColor: accountTextColor,
    kind: walletKind,
    currency,
    isDefault,
    archived: false,
    balance: 0,
    isOwner: true,
  };

  const month = expiryMonth ? Number(expiryMonth) : null;
  const year = expiryYear ? Number(expiryYear) : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (kind === "account") {
        const res = await fetch("/api/wallets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            color: accountColor,
            background: accountBackground,
            textColor: accountTextColor,
            kind: walletKind,
            currency,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(typeof data.error === "string" ? data.error : "Could not save.");
          return;
        }
        if (isDefault && data.wallet?.id) {
          await fetch(`/api/wallets/${data.wallet.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isDefault: true }),
          });
        }
        onSavedAccount();
      } else {
        const res = await fetch("/api/wallet-cards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            label,
            holderName: holderName.trim() || null,
            last4: last4.trim() || null,
            expiryMonth: month,
            expiryYear: year,
            network,
            color: cardColor,
            background: cardBackground,
            showNetworkBadge,
            badgePosition,
            textColor: cardTextColor,
            showChip,
            chipColor,
            chipPosition,
            notes: notes.trim() || null,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(typeof data.error === "string" ? data.error : "Could not save.");
          return;
        }
        onSavedCard(toWalletCard(data.card as WalletCardApiRow));
      }
    } catch (err) {
      setError(describeFetchError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal onClose={onClose} title={kind === "account" ? t("wallet.addWallet") : t("wallet.addCard")}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-1 rounded-full bg-bg-soft p-1">
          <button
            type="button"
            onClick={() => setKind("account")}
            className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${
              kind === "account" ? "bg-surface text-foreground shadow-sm" : "text-ink-soft"
            }`}
          >
            {t("wallet.kindAccountLabel")}
          </button>
          <button
            type="button"
            onClick={() => setKind("card")}
            className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${
              kind === "card" ? "bg-surface text-foreground shadow-sm" : "text-ink-soft"
            }`}
          >
            {t("wallet.kindCardLabel")}
          </button>
        </div>

        {kind === "account" ? (
          <>
            <ColorGlowPreview color={backgroundGlowColor(accountBackground, accountColor)}>
              <AccountCardShape wallet={previewWallet} currency={appCurrency} />
            </ColorGlowPreview>

            <FormSection icon={<CategoryIcon iconKey="bank" className="h-4 w-4" />} title={t("wallet.nameLabel")}>
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

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink-soft">{t("wallet.typeLabel")}</label>
                <div className="flex gap-1 rounded-full bg-bg-soft p-1">
                  <button
                    type="button"
                    onClick={() => setWalletKind("cash")}
                    className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${
                      walletKind === "cash" ? "bg-surface text-foreground shadow-sm" : "text-ink-soft"
                    }`}
                  >
                    {t("wallet.cash")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setWalletKind("digital")}
                    className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${
                      walletKind === "digital" ? "bg-surface text-foreground shadow-sm" : "text-ink-soft"
                    }`}
                  >
                    {t("wallet.digital")}
                  </button>
                </div>
              </div>
            </FormSection>

            <FormSection icon={<CategoryIcon iconKey="cash" className="h-4 w-4" />} title={t("wallet.currencyLabel")}>
              <SelectDropdown value={currencyValue} options={currencyOptions} onChange={handleCurrencyChange} />
              <p className="text-xs text-ink-soft">{t("wallet.currencyNote")}</p>

              <button
                type="button"
                onClick={() => setIsDefault((v) => !v)}
                className="flex w-full items-center justify-between gap-3 rounded-card border border-line bg-bg-soft px-3.5 py-2.5 text-left transition"
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
            </FormSection>

            <FormSection icon={<PaletteIcon className="h-4 w-4" />} title={t("wallet.colorLabel")}>
              <CardBackgroundPicker
                value={accountBackground}
                onChange={setAccountBackground}
                plainColor={accountColor}
                onPlainColorChange={setAccountColor}
              />
              <div className="border-t border-line pt-3">
                <label className="mb-1.5 block text-xs font-semibold text-ink-soft">{t("background.textColorLabel")}</label>
                <CardTextColorPicker
                  value={accountTextColor}
                  onChange={setAccountTextColor}
                  autoColor={cardForegroundFor(null, accountBackground, accountColor).full}
                />
              </div>
            </FormSection>
          </>
        ) : (
          <>
            <ColorGlowPreview color={backgroundGlowColor(cardBackground, cardColor)}>
              <WalletCardShape
                label={label || t("wallet.labelPlaceholder")}
                holderName={holderName || null}
                last4={last4 || null}
                expiryMonth={month}
                expiryYear={year}
                network={network}
                color={cardColor}
                background={cardBackground}
                showNetworkBadge={showNetworkBadge}
                badgePosition={badgePosition}
                textColor={cardTextColor}
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
              <CardBackgroundPicker value={cardBackground} onChange={setCardBackground} plainColor={cardColor} onPlainColorChange={setCardColor} />
              <div className="border-t border-line pt-3">
                <label className="mb-1.5 block text-xs font-semibold text-ink-soft">{t("background.textColorLabel")}</label>
                <CardTextColorPicker
                  value={cardTextColor}
                  onChange={setCardTextColor}
                  autoColor={cardForegroundFor(null, cardBackground, cardColor).full}
                />
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
          </>
        )}

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
            {submitting ? t("common.saving") : kind === "account" ? t("wallet.addWallet") : t("wallet.addCard")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
