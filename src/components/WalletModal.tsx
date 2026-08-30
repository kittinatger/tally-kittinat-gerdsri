"use client";

import { describeFetchError } from "@/lib/fetch-error";
import { useState } from "react";
import Modal from "./Modal";
import { UploadIcon } from "@/lib/icons";
import SelectDropdown from "./SelectDropdown";
import FormSection from "./FormSection";
import ColorGlowPreview from "./ColorGlowPreview";
import WalletCardShape, { RECOLORABLE_BADGE_ASPECT, ICON_COLOR_ORIGINAL } from "./WalletCardShape";
import CardBackgroundPicker from "./CardBackgroundPicker";
import CardTextColorPicker from "./CardTextColorPicker";
import PremadeCardPicker from "./PremadeCardPicker";
import ForceToggleField from "./ForceToggleField";
import { CATEGORY_PALETTE } from "@/lib/categories";
import { CARD_NETWORKS, type CardNetwork } from "@/lib/wallet-cards";
import { backgroundGlowColor, cardForegroundFor, type CardBackground } from "@/lib/card-backgrounds";
import { CHIP_COLORS, CHIP_COLOR_LABEL_KEYS, CHIP_COLOR_STOPS, DEFAULT_CHIP_COLOR, type ChipColor } from "@/lib/chip-colors";
import { BADGE_POSITIONS, BADGE_POSITION_LABEL_KEYS, DEFAULT_BADGE_POSITION, type BadgePosition } from "@/lib/badge-position";
import { CHIP_POSITIONS, CHIP_POSITION_LABEL_KEYS, DEFAULT_CHIP_POSITION, type ChipPosition } from "@/lib/chip-position";
import { NAME_POSITIONS, NAME_POSITION_LABEL_KEYS, DEFAULT_NAME_POSITION, type NamePosition } from "@/lib/name-position";
import { CARD_TEMPLATE_CATEGORIES, CARD_TEMPLATE_CATEGORY_LABEL_KEYS, type CardTemplateCategory } from "@/lib/card-template-category";
import { CategoryIcon, PaletteIcon, FileIcon } from "@/lib/icons";
import { useCurrency } from "@/lib/currency-context";
import { CURRENCIES } from "@/lib/currencies";
import { countryForCurrency, KNOWN_COUNTRIES } from "@/lib/currency-country";
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
// form now, not two (see the wallets migration comments in db.ts), and
// every wallet always renders with the full card look (WalletCardShape) —
// there's no separate "Payment card look" toggle gating the network/
// holder/last4/expiry/badge/chip fields off; they're just always part of
// the form, always visible.
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
  // Which section of the form is showing — the modal used to be one long
  // scroll (name/type/network/chip/card-number/holder/expiry/currency/
  // balance/color/notes/upload-as-template, 15+ groups). Splitting it into
  // three tabs keeps each screenful focused; the live preview and the
  // submit/cancel row stay outside the tabs so switching never loses sight
  // of either.
  const [tab, setTab] = useState<"basics" | "card" | "look" | "template">("basics");

  // Card-look fields — always part of the form now (see the comment above).
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
  const [showBalance, setShowBalance] = useState(wallet?.showBalance ?? true);
  const [showCurrency, setShowCurrency] = useState(wallet?.showCurrency ?? true);
  const [showCardNumber, setShowCardNumber] = useState(wallet?.showCardNumber ?? true);
  const [showName, setShowName] = useState(wallet?.showName ?? true);
  const [showHolderName, setShowHolderName] = useState(wallet?.showHolderName ?? true);
  const [showExpiry, setShowExpiry] = useState(wallet?.showExpiry ?? true);
  const [namePosition, setNamePosition] = useState<NamePosition>(wallet?.namePosition ?? DEFAULT_NAME_POSITION);
  // Set when a picked premade-card template forces the name position/text
  // color (see PremadeCardPicker's onSelect below) — while locked, the
  // corresponding control is replaced with a "set by template" note plus
  // an explicit unlock action, rather than just being pre-filled, so the
  // template's own placement/color choice can't be silently changed by
  // accident while still leaving the author (not just an admin) able to
  // deliberately override it for this one card.
  const [namePositionLocked, setNamePositionLocked] = useState(false);
  const [textColorLocked, setTextColorLocked] = useState(false);
  // Set once a premade card has been picked in this editing session — the
  // whole "Upload as template" section hides while true, since submitting
  // an already-premade design back in as a new template makes no sense.
  const [templateApplied, setTemplateApplied] = useState(false);
  // Same idea, per show* toggle — a picked template's force_show_* fields
  // (see card_templates in db.ts) don't just set the toggle's value, they
  // take the toggle out of the wallet editor's hands entirely, so the
  // corresponding switch is hidden rather than left interactive-but-
  // overridable. Reset (not just added-to) on every pick, including a
  // plain background/color pick with no forces at all, so switching from a
  // locked template to an unlocked one (or to no template) un-hides
  // everything again.
  const [forcedFields, setForcedFields] = useState<{
    showName: boolean;
    showNetworkBadge: boolean;
    showChip: boolean;
    showCardNumber: boolean;
    showBalance: boolean;
    showCurrency: boolean;
    network: boolean;
    showHolderName: boolean;
    showExpiry: boolean;
  }>({
    showName: false,
    showNetworkBadge: false,
    showChip: false,
    showCardNumber: false,
    showBalance: false,
    showCurrency: false,
    network: false,
    showHolderName: false,
    showExpiry: false,
  });

  // "Upload as template" submits the current background/color/textColor
  // (only the visual skin, nothing balance/identity-related) for review —
  // see card_templates in db.ts. Separate submitting/submitted state from
  // the wallet form's own submitting/error, since this is an independent
  // side action, not part of saving the wallet itself.
  const [templateName, setTemplateName] = useState("");
  // Prefilled once from whatever currency the wallet already has, via the
  // currency->country map (see currency-country.ts) — a starting guess,
  // not tied to lockCurrency below, since the author can change either
  // independently (a template can be locked to JPY without necessarily
  // being filed under Japan, or vice versa). Left editable either way.
  const [templateCountry, setTemplateCountry] = useState(() => countryForCurrency(currency) ?? "");
  const [templateSubmitting, setTemplateSubmitting] = useState(false);
  const [templateSubmitted, setTemplateSubmitted] = useState(false);
  const [templateError, setTemplateError] = useState<string | null>(null);
  // Which per-face toggles the author wants to force onto anyone who picks
  // this template, and to what value — null means "don't touch it" (the
  // default for all six); true/false means "force it on/off", picked
  // independently of whatever showX is currently set to above (see
  // ForceToggleField).
  const [forceToggles, setForceToggles] = useState<{
    showName: boolean | null;
    showNetworkBadge: boolean | null;
    showChip: boolean | null;
    showCardNumber: boolean | null;
    showBalance: boolean | null;
    showCurrency: boolean | null;
    showHolderName: boolean | null;
    showExpiry: boolean | null;
  }>({
    showName: null,
    showNetworkBadge: null,
    showChip: null,
    showCardNumber: null,
    showBalance: null,
    showCurrency: null,
    showHolderName: null,
    showExpiry: null,
  });
  // Separate from forceToggles.showCurrency (which only forces whether a
  // currency renders) — this forces which currency code the wallet itself
  // uses, e.g. a Japanese transit-card template locking pickers to JPY
  // regardless of the app's own default currency. Captures whatever
  // `currency` is currently set to (including null/"app default") at
  // submit time, same pattern as the boolean forces.
  const [lockCurrency, setLockCurrency] = useState(false);
  // Two more author controls submitted alongside the force toggles above —
  // forceNamePosition null means "don't force a corner" (the picker just
  // inherits whatever the wallet already has); lockTextColor forces the
  // template's own textColor and disables the picker's text-color control
  // while it's applied (see card_templates.lock_text_color in db.ts).
  const [templateForceNamePosition, setTemplateForceNamePosition] = useState<NamePosition | null>(null);
  const [templateLockTextColor, setTemplateLockTextColor] = useState(false);
  // What kind of real-world card this is (e-money, credit card, transit
  // card, ...) — see card-template-category.ts. Metadata only, like
  // country, so PremadeCardPicker can filter an increasingly long,
  // multi-country gallery by card type.
  const [templateCategory, setTemplateCategory] = useState<CardTemplateCategory | null>(null);
  // Which network to force the wallet itself onto — null means "don't
  // force a network" (the picker just inherits whatever it already had).
  // Same idea as forceCurrency: a real card's network is inherent to its
  // artwork, so it doesn't make sense to let the picker choose a
  // different one.
  const [templateForceNetwork, setTemplateForceNetwork] = useState<CardNetwork | null>(null);

  const month = expiryMonth ? Number(expiryMonth) : null;
  const year = expiryYear ? Number(expiryYear) : null;

  // The "Card details" tab is now four separate FormSections (Network,
  // Chip, Card face, On-card display) instead of one giant one, each with
  // its own icon/title/border — matching how Basics and Look are already
  // split, rather than one long undivided list. Each has its own "does it
  // actually have anything in it" check, mirroring every condition its own
  // children render under, so a template forcing that whole group off/
  // hidden (see forcedFields) makes the section disappear rather than
  // rendering an empty header with nothing under it.
  const hasNetworkSection =
    (!forcedFields.network && !(forcedFields.showNetworkBadge && !showNetworkBadge)) ||
    !forcedFields.showNetworkBadge ||
    showNetworkBadge;
  const hasChipSection = !forcedFields.showChip || showChip;
  // Always true — the last4/holder/expiry inputs render unconditionally
  // (they're just data fields, independent of whether the corresponding
  // show* toggle is forced), so this section never ends up empty the way
  // Network/Chip/On-card display can.
  const hasCardFaceSection = true;
  const hasOnCardDisplaySection = !forcedFields.showBalance || (showBalance && !forcedFields.showCurrency);

  // The "Template" tab (Upload as template) hides once a premade card's
  // already been picked this session — see templateApplied's own comment
  // above; there's nothing left there to show.
  const tabs = (
    [
      ["basics", "wallet.tabBasics"],
      ["card", "wallet.tabCardDetails"],
      ["look", "wallet.tabLook"],
      ["template", "wallet.tabTemplate"],
    ] as const
  ).filter(([key]) => key !== "template" || !templateApplied);

  const appDefaultLabel = t("wallet.appDefault");
  const currencyOptions = [`${appDefaultLabel} (${appCurrency})`, ...CURRENCIES.map((c) => `${c.code} — ${c.name}`)];
  const currencyValue = currency
    ? (CURRENCIES.find((c) => c.code === currency) ? `${currency} — ${CURRENCIES.find((c) => c.code === currency)!.name}` : currency)
    : `${appDefaultLabel} (${appCurrency})`;

  async function handleUploadTemplate() {
    setTemplateSubmitting(true);
    setTemplateError(null);
    try {
      const res = await fetch("/api/card-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: templateName.trim() || name || t("wallet.namePlaceholder"),
          color,
          background,
          textColor,
          country: templateCountry.trim() || null,
          forceShowName: forceToggles.showName,
          forceShowNetworkBadge: forceToggles.showNetworkBadge,
          forceShowChip: forceToggles.showChip,
          forceShowCardNumber: forceToggles.showCardNumber,
          forceShowBalance: forceToggles.showBalance,
          forceShowCurrency: forceToggles.showCurrency,
          forceShowHolderName: forceToggles.showHolderName,
          forceShowExpiry: forceToggles.showExpiry,
          forceCurrency: lockCurrency ? currency : null,
          forceNamePosition: templateForceNamePosition,
          lockTextColor: templateLockTextColor,
          category: templateCategory,
          forceNetwork: templateForceNetwork,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTemplateError(typeof data.error === "string" ? data.error : "Could not submit.");
        return;
      }
      setTemplateSubmitted(true);
    } catch (err) {
      setTemplateError(describeFetchError(err));
    } finally {
      setTemplateSubmitting(false);
    }
  }

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
        network,
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
        showHolderName,
        showExpiry,
        namePosition,
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
            showHolderName={showHolderName}
            showExpiry={showExpiry}
            namePosition={namePosition}
          />
        </ColorGlowPreview>

        <div className="flex gap-1 rounded-full bg-bg-soft p-1">
          {tabs.map(([key, labelKey]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${
                tab === key ? "bg-surface text-foreground shadow-sm" : "text-ink-soft"
              }`}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>

        {tab === "basics" && (
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

          {/* Same templateCategory state the Template tab's chip picker
           * uses (see wallet.templateCategoryLabel there) — shown here too
           * so the card type can be set up front while filling in the
           * basics, rather than only when actually uploading this wallet
           * as a template. Metadata only: it's never saved on the wallet
           * itself, only submitted alongside a template upload. */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink-soft">{t("wallet.templateCategoryLabel")}</label>
            <div className="flex flex-wrap gap-1.5">
              {CARD_TEMPLATE_CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setTemplateCategory((prev) => (prev === c ? null : c))}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    templateCategory === c
                      ? "border-navy bg-navy/10 text-navy dark:text-blue-300"
                      : "border-line text-ink-soft hover:bg-[var(--nav-hover-bg)]"
                  }`}
                >
                  {t(CARD_TEMPLATE_CATEGORY_LABEL_KEYS[c])}
                </button>
              ))}
            </div>
          </div>
        </FormSection>
        )}

        {tab === "card" && (
        <>
        {hasNetworkSection && (
        <FormSection icon={<CategoryIcon iconKey="shield" className="h-4 w-4" />} title={t("wallet.networkLabel")}>
          {/* Hidden both when a template forces a specific network AND
           * when it forces the network badge off entirely — picking a
           * network is pointless if the badge that would show it never
           * renders. showNetworkBadge itself reflects the forced value
           * here (its own toggle is hidden too whenever forced — see
           * below), so it's safe to read directly rather than needing a
           * separate stored "forced value". */}
          {!forcedFields.network && !(forcedFields.showNetworkBadge && !showNetworkBadge) && (
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
          )}

          {!forcedFields.showNetworkBadge && (
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

          {showNetworkBadge && (
            <div className="border-t border-line pt-3">
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
        </FormSection>
        )}

        {hasChipSection && (
        <FormSection icon={<CategoryIcon iconKey="box" className="h-4 w-4" />} title={t("wallet.chipSectionLabel")}>
          {!forcedFields.showChip && (
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

          {showChip && (
            <div className={forcedFields.showChip ? "" : "border-t border-line pt-3"}>
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
            <div className="border-t border-line pt-3">
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
        </FormSection>
        )}

        {hasCardFaceSection && (
        <FormSection icon={<CategoryIcon iconKey="card" className="h-4 w-4" />} title={t("wallet.cardFaceSectionLabel")}>
          {!forcedFields.showCardNumber && (
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

          {!forcedFields.showName && (
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

          {/* last4/holder/expiry are plain data fields, independent of
           * whether their respective show* toggle is forced — even a
           * forced-hidden field can still be worth filling in (it just
           * won't render on the card), same as chip color/position
           * staying editable regardless of whether "Show chip" itself is
           * forced. Only the toggle switches below hide when forced. */}
          <div className={!forcedFields.showCardNumber || !forcedFields.showName ? "border-t border-line pt-3" : ""}>
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

          {!forcedFields.showHolderName && (
            <button
              type="button"
              onClick={() => setShowHolderName((v) => !v)}
              className="flex w-full items-center justify-between gap-3 rounded-card border border-line bg-bg-soft px-3.5 py-2.5 text-left transition"
            >
              <span>
                <span className="block text-sm font-medium text-foreground">{t("wallet.showHolderNameLabel")}</span>
                <span className="block text-xs text-ink-soft">{t("wallet.showHolderNameDesc")}</span>
              </span>
              <span
                role="switch"
                aria-checked={showHolderName}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
                  showHolderName ? "bg-navy" : "bg-line"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                    showHolderName ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </span>
            </button>
          )}

          {/* Hidden entirely (not just disabled) once a picked template's
           * forceNamePosition locks this — a locked field has nothing for
           * the wallet's own editor to do here, so showing a disabled
           * control just invites confusion about why it doesn't respond.
           * See the matching text-color section on the Look tab for the
           * same idea. */}
          {showHolderName && !namePositionLocked && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-soft">{t("wallet.namePositionLabel")}</label>
              <div className="grid w-24 grid-cols-2 gap-1.5">
                {NAME_POSITIONS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setNamePosition(p)}
                    aria-label={t(NAME_POSITION_LABEL_KEYS[p])}
                    title={t(NAME_POSITION_LABEL_KEYS[p])}
                    className={`flex h-10 w-10 items-center rounded-lg border transition ${
                      p === "topLeft" || p === "topRight" ? "items-start" : "items-end"
                    } ${p === "topLeft" || p === "bottomLeft" ? "justify-start" : "justify-end"} ${
                      namePosition === p
                        ? "border-navy bg-navy/10"
                        : "border-line bg-bg-soft hover:bg-[var(--nav-hover-bg)]"
                    } p-1.5`}
                  >
                    <span className={`h-2 w-2 rounded-full ${namePosition === p ? "bg-navy" : "bg-ink-soft/50"}`} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {!forcedFields.showExpiry && (
            <button
              type="button"
              onClick={() => setShowExpiry((v) => !v)}
              className="flex w-full items-center justify-between gap-3 rounded-card border border-line bg-bg-soft px-3.5 py-2.5 text-left transition"
            >
              <span>
                <span className="block text-sm font-medium text-foreground">{t("wallet.showExpiryLabel")}</span>
                <span className="block text-xs text-ink-soft">{t("wallet.showExpiryDesc")}</span>
              </span>
              <span
                role="switch"
                aria-checked={showExpiry}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
                  showExpiry ? "bg-navy" : "bg-line"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                    showExpiry ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </span>
            </button>
          )}
        </FormSection>
        )}

        {hasOnCardDisplaySection && (
        <FormSection icon={<CategoryIcon iconKey="cash" className="h-4 w-4" />} title={t("wallet.onCardDisplayLabel")}>
          {!forcedFields.showBalance && (
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
          )}
          {showBalance && !forcedFields.showCurrency && (
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
        </FormSection>
        )}

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
        </>
        )}

        {tab === "basics" && (
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

          <div className="border-t border-line pt-3">
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
          </div>
        </FormSection>
        )}

        {tab === "look" && (
        <FormSection icon={<PaletteIcon className="h-4 w-4" />} title={t("wallet.colorLabel")}>
          <PremadeCardPicker
            onSelect={(tpl) => {
              setTemplateApplied(true);
              setBackground(tpl.background);
              setColor(tpl.color);
              setTextColor(tpl.textColor);
              setTextColorLocked(tpl.lockTextColor);
              // Author-forced toggles (see card_templates.force_* in
              // db.ts) — null means the template doesn't touch that one,
              // so only apply the ones actually set.
              if (tpl.forceShowName !== null) setShowName(tpl.forceShowName);
              if (tpl.forceShowNetworkBadge !== null) setShowNetworkBadge(tpl.forceShowNetworkBadge);
              if (tpl.forceShowChip !== null) setShowChip(tpl.forceShowChip);
              if (tpl.forceShowCardNumber !== null) setShowCardNumber(tpl.forceShowCardNumber);
              if (tpl.forceShowBalance !== null) setShowBalance(tpl.forceShowBalance);
              if (tpl.forceShowCurrency !== null) setShowCurrency(tpl.forceShowCurrency);
              if (tpl.forceCurrency !== null) setCurrency(tpl.forceCurrency);
              if (tpl.forceNetwork !== null) setNetwork(tpl.forceNetwork);
              if (tpl.forceShowHolderName !== null) setShowHolderName(tpl.forceShowHolderName);
              if (tpl.forceShowExpiry !== null) setShowExpiry(tpl.forceShowExpiry);
              setForcedFields({
                showName: tpl.forceShowName !== null,
                showNetworkBadge: tpl.forceShowNetworkBadge !== null,
                showChip: tpl.forceShowChip !== null,
                showCardNumber: tpl.forceShowCardNumber !== null,
                showBalance: tpl.forceShowBalance !== null,
                showCurrency: tpl.forceShowCurrency !== null,
                network: tpl.forceNetwork !== null,
                showHolderName: tpl.forceShowHolderName !== null,
                showExpiry: tpl.forceShowExpiry !== null,
              });
              if (tpl.forceNamePosition !== null) {
                setNamePosition(tpl.forceNamePosition);
                setNamePositionLocked(true);
              } else {
                setNamePositionLocked(false);
              }
            }}
          />
          <CardBackgroundPicker value={background} onChange={setBackground} plainColor={color} onPlainColorChange={setColor} />
          {/* Hidden entirely once a picked template locks the text color —
           * see the matching name-position section above for why this is a
           * hide, not a disabled/note state. */}
          {!textColorLocked && (
            <div className="border-t border-line pt-3">
              <label className="mb-1.5 block text-xs font-semibold text-ink-soft">{t("background.textColorLabel")}</label>
              <CardTextColorPicker value={textColor} onChange={setTextColor} autoColor={cardForegroundFor(null, background, color).full} />
            </div>
          )}
          {showNetworkBadge && (
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
        )}

        {tab === "template" && !templateApplied && (
        <>
        {templateSubmitted ? (
        <FormSection icon={<UploadIcon className="h-4 w-4" />} title={t("wallet.uploadTemplateLabel")}>
          <p className="text-xs text-ink-soft">{t("wallet.templateSubmittedDesc")}</p>
        </FormSection>
        ) : (
        <>
        <p className="text-xs text-ink-soft">{t("wallet.uploadTemplateDesc")}</p>

        <FormSection icon={<CategoryIcon iconKey="bank" className="h-4 w-4" />} title={t("wallet.templateDetailsLabel")}>
          <div>
            <label htmlFor="templateNameInput" className="mb-1.5 block text-xs font-semibold text-ink-soft">
              {t("wallet.templateNameLabel")}
            </label>
            <input
              id="templateNameInput"
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder={name || t("wallet.namePlaceholder")}
              className="w-full rounded-card border border-line bg-bg-soft px-3.5 py-2.5 text-base text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
            />
          </div>

          <div>
            <label htmlFor="templateCountryInput" className="mb-1.5 block text-xs font-semibold text-ink-soft">
              {t("wallet.templateCountryLabel")}
            </label>
            <input
              id="templateCountryInput"
              type="text"
              list="templateCountryOptions"
              value={templateCountry}
              onChange={(e) => setTemplateCountry(e.target.value)}
              placeholder={t("wallet.templateCountryPlaceholder")}
              className="w-full rounded-card border border-line bg-bg-soft px-3.5 py-2.5 text-base text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
            />
            <datalist id="templateCountryOptions">
              {KNOWN_COUNTRIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink-soft">{t("wallet.templateCategoryLabel")}</label>
            <div className="flex flex-wrap gap-1.5">
              {CARD_TEMPLATE_CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setTemplateCategory((prev) => (prev === c ? null : c))}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    templateCategory === c
                      ? "border-navy bg-navy/10 text-navy dark:text-blue-300"
                      : "border-line text-ink-soft hover:bg-[var(--nav-hover-bg)]"
                  }`}
                >
                  {t(CARD_TEMPLATE_CATEGORY_LABEL_KEYS[c])}
                </button>
              ))}
            </div>
          </div>
        </FormSection>

        <FormSection icon={<CategoryIcon iconKey="shield" className="h-4 w-4" />} title={t("wallet.forceTogglesLabel")}>
          <p className="text-xs text-ink-soft">{t("wallet.forceTogglesDesc")}</p>
          <div className="space-y-1.5">
            {(
              [
                ["showName", "wallet.forceLabelName"],
                ["showNetworkBadge", "wallet.forceLabelNetworkBadge"],
                ["showChip", "wallet.forceLabelChip"],
                ["showCardNumber", "wallet.forceLabelCardNumber"],
                ["showHolderName", "wallet.forceLabelHolderName"],
                ["showExpiry", "wallet.forceLabelExpiry"],
                ["showBalance", "wallet.forceLabelBalance"],
                ["showCurrency", "wallet.forceLabelCurrency"],
              ] as const
            ).map(([key, labelKey]) => (
              <ForceToggleField
                key={key}
                label={t(labelKey)}
                value={forceToggles[key]}
                onChange={(v) => setForceToggles((prev) => ({ ...prev, [key]: v }))}
              />
            ))}
          </div>
        </FormSection>

        <FormSection icon={<PaletteIcon className="h-4 w-4" />} title={t("wallet.templateLocksLabel")}>
          <button
            type="button"
            onClick={() => {
              setLockCurrency((v) => !v);
              // A nudge, not a sync — only fills an still-empty country
              // field, never overwrites something the author already
              // typed or edited away from the suggestion.
              if (!lockCurrency && !templateCountry.trim()) {
                const suggested = countryForCurrency(currency);
                if (suggested) setTemplateCountry(suggested);
              }
            }}
            className="flex w-full items-center justify-between gap-3 rounded-card border border-line bg-bg-soft px-3.5 py-2.5 text-left transition"
          >
            <span>
              <span className="block text-sm font-medium text-foreground">{t("wallet.lockCurrencyLabel")}</span>
              <span className="block text-xs text-ink-soft">
                {lockCurrency ? t("wallet.lockCurrencyDesc").replace("{currency}", currency ?? appCurrency) : t("wallet.lockCurrencyOffDesc")}
              </span>
            </span>
            <span
              role="switch"
              aria-checked={lockCurrency}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
                lockCurrency ? "bg-navy" : "bg-line"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                  lockCurrency ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTemplateLockTextColor((v) => !v)}
            className="flex w-full items-center justify-between gap-3 rounded-card border border-line bg-bg-soft px-3.5 py-2.5 text-left transition"
          >
            <span>
              <span className="block text-sm font-medium text-foreground">{t("wallet.lockTextColorLabel")}</span>
              <span className="block text-xs text-ink-soft">{t("wallet.lockTextColorDesc")}</span>
            </span>
            <span
              role="switch"
              aria-checked={templateLockTextColor}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
                templateLockTextColor ? "bg-navy" : "bg-line"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                  templateLockTextColor ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </span>
          </button>

          {/* Positioning holder-name text makes no sense once "Name on
           * card" is itself forced off — see the matching guard on force
           * network below. */}
          {forceToggles.showName !== false && (
            <div className="border-t border-line pt-3">
              <p className="mb-0.5 text-xs font-semibold text-foreground">{t("wallet.forceNamePositionLabel")}</p>
              <p className="mb-2 text-[11px] text-ink-soft">{t("wallet.forceNamePositionDesc")}</p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setTemplateForceNamePosition(null)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    templateForceNamePosition === null
                      ? "border-navy bg-navy/10 text-navy dark:text-blue-300"
                      : "border-line text-ink-soft hover:bg-[var(--nav-hover-bg)]"
                  }`}
                >
                  {t("wallet.forceAuto")}
                </button>
                {NAME_POSITIONS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setTemplateForceNamePosition(p)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      templateForceNamePosition === p
                        ? "border-navy bg-navy/10 text-navy dark:text-blue-300"
                        : "border-line text-ink-soft hover:bg-[var(--nav-hover-bg)]"
                    }`}
                  >
                    {t(NAME_POSITION_LABEL_KEYS[p])}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Forcing a network makes no sense once the badge that would
           * show it is itself forced off. */}
          {forceToggles.showNetworkBadge !== false && (
            <div className="border-t border-line pt-3">
              <p className="mb-0.5 text-xs font-semibold text-foreground">{t("wallet.forceNetworkLabel")}</p>
              <p className="mb-2 text-[11px] text-ink-soft">{t("wallet.forceNetworkDesc")}</p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setTemplateForceNetwork(null)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    templateForceNetwork === null
                      ? "border-navy bg-navy/10 text-navy dark:text-blue-300"
                      : "border-line text-ink-soft hover:bg-[var(--nav-hover-bg)]"
                  }`}
                >
                  {t("wallet.forceAuto")}
                </button>
                {CARD_NETWORKS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setTemplateForceNetwork(n)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      templateForceNetwork === n
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
        </FormSection>

        {templateError && <p className="text-sm text-red-600 dark:text-red-400">{templateError}</p>}
        <button
          type="button"
          onClick={handleUploadTemplate}
          disabled={templateSubmitting}
          className="w-full rounded-card border border-line bg-bg-soft px-3.5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-[var(--nav-hover-bg)] disabled:opacity-60"
        >
          {templateSubmitting ? t("common.saving") : t("wallet.uploadTemplateLabel")}
        </button>
        </>
        )}
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
            {submitting ? t("common.saving") : isEdit ? t("form.saveChanges") : t("wallet.addWallet")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
