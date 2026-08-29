"use client";

import { describeFetchError } from "@/lib/fetch-error";
import { useState } from "react";
import Modal from "./Modal";
import SelectDropdown from "./SelectDropdown";
import FormSection from "./FormSection";
import ColorGlowPreview from "./ColorGlowPreview";
import AccountCardShape from "./AccountCardShape";
import WalletCardShape, { RECOLORABLE_BADGE_ASPECT, ICON_COLOR_ORIGINAL } from "./WalletCardShape";
import CardBackgroundPicker from "./CardBackgroundPicker";
import CardTextColorPicker from "./CardTextColorPicker";
import { CATEGORY_PALETTE } from "@/lib/categories";
import { CARD_NETWORKS, type CardNetwork } from "@/lib/wallet-cards";
import { backgroundGlowColor, cardForegroundFor, type CardBackground } from "@/lib/card-backgrounds";
import { CHIP_COLORS, CHIP_COLOR_LABEL_KEYS, CHIP_COLOR_STOPS, DEFAULT_CHIP_COLOR, type ChipColor } from "@/lib/chip-colors";
import { BADGE_POSITIONS, BADGE_POSITION_LABEL_KEYS, DEFAULT_BADGE_POSITION, type BadgePosition } from "@/lib/badge-position";
import { CHIP_POSITIONS, CHIP_POSITION_LABEL_KEYS, DEFAULT_CHIP_POSITION, type ChipPosition } from "@/lib/chip-position";
import { CategoryIcon, PaletteIcon, FileIcon } from "@/lib/icons";
import { useCurrency } from "@/lib/currency-context";
import { CURRENCIES } from "@/lib/currencies";
import { useT } from "@/lib/language-context";
import type { MessageKey } from "@/lib/i18n/messages";
import type { WalletKind } from "@/lib/wallets";
import type { WalletOption } from "@/types/wallet";

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

// The single wallet editor — money account and payment-card visuals are one
// form now, not two (see the wallets migration comments in db.ts). A plain
// account is just "hasCardLook: false"; flipping that on reveals the same
// network/holder/last4/expiry/badge/chip fields the old standalone
// wallet-cards feature had, and the live preview switches from
// AccountCardShape to WalletCardShape to match.
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
  const [background, setBackground] = useState<CardBackground | null>(wallet?.background ?? null);
  const [textColor, setTextColor] = useState<string | null>(wallet?.textColor ?? null);
  const [kind, setKind] = useState<WalletKind>(wallet?.kind ?? "cash");
  const [currency, setCurrency] = useState<string | null>(wallet?.currency ?? null);
  const [isDefault, setIsDefault] = useState(wallet?.isDefault ?? false);
  const [startingBalance, setStartingBalance] = useState(isEdit ? String(wallet!.balance) : "0");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Card-look fields — only meaningful (and only shown) once hasCardLook is
  // on. Seeded from the wallet's network being non-null on edit, same
  // convention WalletCardShape itself uses.
  const [hasCardLook, setHasCardLook] = useState(Boolean(wallet?.network));
  const [network, setNetwork] = useState<CardNetwork>(wallet?.network ?? "other");
  const [holderName, setHolderName] = useState(wallet?.holderName ?? "");
  const [last4, setLast4] = useState(wallet?.last4 ?? "");
  const [expiryMonth, setExpiryMonth] = useState(wallet?.expiryMonth ? String(wallet.expiryMonth) : "");
  const [expiryYear, setExpiryYear] = useState(wallet?.expiryYear ? String(wallet.expiryYear) : "");
  const [showNetworkBadge, setShowNetworkBadge] = useState(wallet?.showNetworkBadge ?? true);
  const [badgePosition, setBadgePosition] = useState<BadgePosition>(wallet?.badgePosition ?? DEFAULT_BADGE_POSITION);
  const [iconColor, setIconColor] = useState<string | null>(wallet?.iconColor ?? null);
  const [showChip, setShowChip] = useState(wallet?.showChip ?? true);
  const [chipColor, setChipColor] = useState<ChipColor>(wallet?.chipColor ?? DEFAULT_CHIP_COLOR);
  const [chipPosition, setChipPosition] = useState<ChipPosition>(wallet?.chipPosition ?? DEFAULT_CHIP_POSITION);
  const [cardNotes, setCardNotes] = useState(wallet?.notes ?? "");
  // Only meaningful once hasCardLook is on — a plain account always shows
  // its balance/currency (that's the entire point of an account), so these
  // toggles don't even apply there. Default true so a freshly-added card
  // that turns hasCardLook on doesn't have to also remember to turn these
  // on separately.
  const [showBalance, setShowBalance] = useState(wallet?.showBalance ?? true);
  const [showCurrency, setShowCurrency] = useState(wallet?.showCurrency ?? true);
  const [showCardNumber, setShowCardNumber] = useState(wallet?.showCardNumber ?? true);
  const [showName, setShowName] = useState(wallet?.showName ?? true);

  const month = expiryMonth ? Number(expiryMonth) : null;
  const year = expiryYear ? Number(expiryYear) : null;

  const appDefaultLabel = t("wallet.appDefault");
  const currencyOptions = [`${appDefaultLabel} (${appCurrency})`, ...CURRENCIES.map((c) => `${c.code} — ${c.name}`)];
  const currencyValue = currency
    ? (CURRENCIES.find((c) => c.code === currency) ? `${currency} — ${CURRENCIES.find((c) => c.code === currency)!.name}` : currency)
    : `${appDefaultLabel} (${appCurrency})`;

  const previewWallet: WalletOption = {
    id: wallet?.id ?? 0,
    name: name || t("wallet.namePlaceholder"),
    color,
    background,
    textColor,
    kind,
    currency,
    isDefault,
    archived: false,
    balance: Number(startingBalance) || 0,
    isOwner: wallet?.isOwner ?? true,
    holderName: holderName || null,
    last4: last4 || null,
    expiryMonth: month,
    expiryYear: year,
    network: hasCardLook ? network : null,
    showNetworkBadge,
    badgePosition,
    iconColor,
    showChip,
    chipColor,
    chipPosition,
    notes: cardNotes || null,
    showBalance,
    showCurrency,
    showCardNumber,
    showName,
  };

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
      const cardFields = {
        holderName: holderName.trim() || null,
        last4: last4.trim() || null,
        expiryMonth: month,
        expiryYear: year,
        network: hasCardLook ? network : null,
        showNetworkBadge,
        badgePosition,
        iconColor,
        showChip,
        chipColor,
        chipPosition,
        notes: cardNotes.trim() || null,
        showBalance,
        showCurrency,
        showCardNumber,
        showName,
      };
      const res = isEdit
        ? await fetch(`/api/wallets/${wallet!.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name,
              color,
              background,
              textColor,
              kind,
              currency,
              startingBalance: Number(startingBalance),
              ...(isDefault && !wallet!.isDefault ? { isDefault: true } : {}),
              ...cardFields,
            }),
          })
        : await fetch("/api/wallets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, color, background, textColor, kind, currency, ...cardFields }),
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
        <ColorGlowPreview color={backgroundGlowColor(background, color)}>
          {hasCardLook ? (
            <WalletCardShape
              label={name || t("wallet.namePlaceholder")}
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
              iconColor={iconColor}
              showChip={showChip}
              chipColor={chipColor}
              chipPosition={chipPosition}
              balance={Number(startingBalance) || 0}
              currency={currency ?? appCurrency}
              showBalance={showBalance}
              showCurrency={showCurrency}
              showCardNumber={showCardNumber}
              showName={showName}
            />
          ) : (
            <AccountCardShape wallet={previewWallet} currency={appCurrency} />
          )}
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

          <button
            type="button"
            onClick={() => setHasCardLook((v) => !v)}
            className="flex w-full items-center justify-between gap-3 rounded-card border border-line bg-bg-soft px-3.5 py-2.5 text-left transition"
          >
            <span>
              <span className="block text-sm font-medium text-foreground">{t("wallet.cardLookLabel")}</span>
              <span className="block text-xs text-ink-soft">{t("wallet.cardLookDesc")}</span>
            </span>
            <span
              role="switch"
              aria-checked={hasCardLook}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
                hasCardLook ? "bg-navy" : "bg-line"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                  hasCardLook ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </span>
          </button>

          {hasCardLook && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-soft">{t("wallet.networkLabel")}</label>
              <div className="flex flex-wrap gap-1.5">
                {CARD_NETWORKS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => {
                      setNetwork(n);
                      // See the matching comment further down, by the
                      // "original colors" reset link.
                      if (iconColor === ICON_COLOR_ORIGINAL && !RECOLORABLE_BADGE_ASPECT[n]) setIconColor(null);
                    }}
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
          )}

          {hasCardLook && (
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
          )}

          {hasCardLook && showNetworkBadge && (
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

          {hasCardLook && (
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
          )}

          {hasCardLook && showChip && (
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

          {hasCardLook && showChip && (
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

          {hasCardLook && (
            <button
              type="button"
              onClick={() => setShowCardNumber((v) => !v)}
              className="flex w-full items-center justify-between gap-3 rounded-card border border-line bg-bg-soft px-3.5 py-2.5 text-left transition"
            >
              <span>
                <span className="block text-sm font-medium text-foreground">{t("wallet.showCardNumberLabel")}</span>
                <span className="block text-xs text-ink-soft">{t("wallet.showCardNumberDesc")}</span>
              </span>
              <span
                role="switch"
                aria-checked={showCardNumber}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
                  showCardNumber ? "bg-navy" : "bg-line"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                    showCardNumber ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </span>
            </button>
          )}

          {hasCardLook && (
            <button
              type="button"
              onClick={() => setShowName((v) => !v)}
              className="flex w-full items-center justify-between gap-3 rounded-card border border-line bg-bg-soft px-3.5 py-2.5 text-left transition"
            >
              <span>
                <span className="block text-sm font-medium text-foreground">{t("wallet.showNameOnCardLabel")}</span>
                <span className="block text-xs text-ink-soft">{t("wallet.showNameOnCardDesc")}</span>
              </span>
              <span
                role="switch"
                aria-checked={showName}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
                  showName ? "bg-navy" : "bg-line"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                    showName ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </span>
            </button>
          )}

          {hasCardLook && (
            <div>
              <label htmlFor="walletLast4" className="mb-1.5 block text-xs font-semibold text-ink-soft">
                {t("wallet.last4Label")}
              </label>
              <input
                id="walletLast4"
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
          )}

          {hasCardLook && (
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
          )}
        </FormSection>

        <FormSection icon={<CategoryIcon iconKey="cash" className="h-4 w-4" />} title={t("wallet.currencyLabel")}>
          <SelectDropdown value={currencyValue} options={currencyOptions} onChange={handleCurrencyChange} />
          <p className="text-xs text-ink-soft">{t("wallet.currencyNote")}</p>

          {isEdit && (
            <div className="border-t border-line pt-3">
              <label htmlFor="walletBalance" className="mb-1.5 block text-xs font-semibold text-ink-soft">
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
              <p className="mt-1.5 text-xs text-ink-soft">{t("wallet.balanceNote")}</p>
            </div>
          )}

          {hasCardLook && (
            <div className="space-y-2 border-t border-line pt-3">
              <button
                type="button"
                onClick={() => setShowBalance((v) => !v)}
                className="flex w-full items-center justify-between gap-3 rounded-card border border-line bg-bg-soft px-3.5 py-2.5 text-left transition"
              >
                <span>
                  <span className="block text-sm font-medium text-foreground">{t("wallet.showBalanceOnCardLabel")}</span>
                  <span className="block text-xs text-ink-soft">{t("wallet.showBalanceOnCardDesc")}</span>
                </span>
                <span
                  role="switch"
                  aria-checked={showBalance}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
                    showBalance ? "bg-navy" : "bg-line"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                      showBalance ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </span>
              </button>
              {showBalance && (
                <button
                  type="button"
                  onClick={() => setShowCurrency((v) => !v)}
                  className="flex w-full items-center justify-between gap-3 rounded-card border border-line bg-bg-soft px-3.5 py-2.5 text-left transition"
                >
                  <span>
                    <span className="block text-sm font-medium text-foreground">{t("wallet.showCurrencyOnCardLabel")}</span>
                    <span className="block text-xs text-ink-soft">{t("wallet.showCurrencyOnCardDesc")}</span>
                  </span>
                  <span
                    role="switch"
                    aria-checked={showCurrency}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
                      showCurrency ? "bg-navy" : "bg-line"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                        showCurrency ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </span>
                </button>
              )}
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
        </FormSection>

        <FormSection icon={<PaletteIcon className="h-4 w-4" />} title={t("wallet.colorLabel")}>
          <CardBackgroundPicker value={background} onChange={setBackground} plainColor={color} onPlainColorChange={setColor} />
          <div className="border-t border-line pt-3">
            <label className="mb-1.5 block text-xs font-semibold text-ink-soft">{t("background.textColorLabel")}</label>
            <CardTextColorPicker value={textColor} onChange={setTextColor} autoColor={cardForegroundFor(null, background, color).full} />
          </div>
          {hasCardLook && showNetworkBadge && (
            <div className="border-t border-line pt-3">
              <label className="mb-1.5 block text-xs font-semibold text-ink-soft">{t("wallet.iconColorLabel")}</label>
              <p className="mb-1.5 text-[11px] text-ink-soft">{t("wallet.iconColorDesc")}</p>
              {iconColor === ICON_COLOR_ORIGINAL ? (
                <div className="flex items-center justify-between gap-2 rounded-card border border-line bg-bg-soft px-3.5 py-2.5">
                  <span className="text-xs text-ink-soft">{t("wallet.iconColorOriginalActive")}</span>
                  <button
                    type="button"
                    onClick={() => setIconColor(null)}
                    className="shrink-0 text-xs font-semibold text-navy underline dark:text-blue-300"
                  >
                    {t("wallet.iconColorCustomize")}
                  </button>
                </div>
              ) : (
                <>
                  <CardTextColorPicker
                    value={iconColor}
                    onChange={setIconColor}
                    autoColor={cardForegroundFor(textColor, background, color).full}
                  />
                  {RECOLORABLE_BADGE_ASPECT[network] && (
                    <button
                      type="button"
                      onClick={() => setIconColor(ICON_COLOR_ORIGINAL)}
                      className="mt-1.5 text-xs font-semibold text-ink-soft underline"
                    >
                      {t("wallet.iconColorUseOriginal")}
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </FormSection>

        {hasCardLook && (
          <FormSection icon={<FileIcon className="h-4 w-4" />} title={t("membership.notesLabel")}>
            <textarea
              id="walletCardNotes"
              rows={2}
              value={cardNotes}
              onChange={(e) => setCardNotes(e.target.value)}
              placeholder={t("membership.notesPlaceholder")}
              className="w-full resize-none rounded-card border border-line bg-bg-soft px-3.5 py-2.5 text-base text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
            />
          </FormSection>
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
            {submitting ? t("common.saving") : isEdit ? t("form.saveChanges") : t("wallet.addWallet")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
