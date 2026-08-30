"use client";

import { useState } from "react";
import Modal from "./Modal";
import FormSection from "./FormSection";
import ColorGlowPreview from "./ColorGlowPreview";
import CardBackgroundPicker from "./CardBackgroundPicker";
import CardTextColorPicker from "./CardTextColorPicker";
import ForceToggleField from "./ForceToggleField";
import SelectDropdown from "./SelectDropdown";
import { backgroundGlowColor, cardForegroundFor, cardBackgroundStyle, type CardBackground } from "@/lib/card-backgrounds";
import { heroGradientClasses, colorHeroStyle } from "@/lib/category-styles";
import { CATEGORY_PALETTE } from "@/lib/categories";
import { CURRENCIES } from "@/lib/currencies";
import { useCurrency } from "@/lib/currency-context";
import { PaletteIcon, TrashIcon } from "@/lib/icons";
import { describeFetchError } from "@/lib/fetch-error";
import { useT } from "@/lib/language-context";
import type { CardTemplateOption } from "@/types/card-template";

const STATUSES = ["pending", "approved", "rejected"] as const;

const FORCE_FIELDS = [
  ["forceShowName", "wallet.forceLabelName"],
  ["forceShowNetworkBadge", "wallet.forceLabelNetworkBadge"],
  ["forceShowChip", "wallet.forceLabelChip"],
  ["forceShowCardNumber", "wallet.forceLabelCardNumber"],
  ["forceShowBalance", "wallet.forceLabelBalance"],
  ["forceShowCurrency", "wallet.forceLabelCurrency"],
] as const;

// The admin's full edit surface for one existing card template — unlike
// WalletModal's "Upload as template" (author-side, submit-only), this can
// change every field including status, and offers a permanent delete.
export default function TemplateEditModal({
  template,
  onClose,
  onSaved,
  onDeleted,
}: {
  template: CardTemplateOption;
  onClose: () => void;
  onSaved: (updated: CardTemplateOption) => void;
  onDeleted: (id: number) => void;
}) {
  const t = useT();
  const appCurrency = useCurrency();
  const [name, setName] = useState(template.name);
  const [color, setColor] = useState(template.color || CATEGORY_PALETTE[0]);
  const [background, setBackground] = useState<CardBackground | null>(template.background);
  const [textColor, setTextColor] = useState<string | null>(template.textColor);
  const [status, setStatus] = useState(template.status);
  const [force, setForce] = useState({
    forceShowName: template.forceShowName,
    forceShowNetworkBadge: template.forceShowNetworkBadge,
    forceShowChip: template.forceShowChip,
    forceShowCardNumber: template.forceShowCardNumber,
    forceShowBalance: template.forceShowBalance,
    forceShowCurrency: template.forceShowCurrency,
  });
  // Distinct from force.forceShowCurrency above (whether a currency
  // renders at all) — this is which currency code the wallet itself gets
  // forced onto. currencyLocked tracks on/off separately from the value
  // itself so toggling off doesn't lose whatever code was picked.
  const [currencyLocked, setCurrencyLocked] = useState(template.forceCurrency !== null);
  const [forceCurrencyValue, setForceCurrencyValue] = useState(template.forceCurrency ?? appCurrency);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/card-templates/${template.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          color,
          background,
          textColor,
          status,
          ...force,
          forceCurrency: currencyLocked ? forceCurrencyValue : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not save.");
        return;
      }
      onSaved(data.template);
    } catch (err) {
      setError(describeFetchError(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/card-templates/${template.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(typeof data?.error === "string" ? data.error : "Could not delete.");
        return;
      }
      onDeleted(template.id);
    } catch (err) {
      setError(describeFetchError(err));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Modal onClose={onClose} title={template.name}>
      <form onSubmit={handleSave} className="space-y-4">
        {/* No name label stamped on the preview — `name` here is just this
         * template's admin-facing catalog name (shown as the modal title
         * and the field below), not on-card text. Overlaying it on top of
         * the background used to duplicate onto artwork that already has
         * its own wordmark baked in (e.g. a Suica card's own "Suica"
         * text), reading as a rendering bug. */}
        <ColorGlowPreview color={backgroundGlowColor(background, color)}>
          <div
            className={`aspect-[1.586/1] min-h-[190px] w-full rounded-2xl shadow-soft ${background ? "" : heroGradientClasses(color)}`}
            style={background ? cardBackgroundStyle(background) : colorHeroStyle(color)}
          />
        </ColorGlowPreview>

        <FormSection icon={<PaletteIcon className="h-4 w-4" />} title={t("wallet.templateNameLabel")}>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-card border border-line bg-bg-soft px-3.5 py-2.5 text-base text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
          />

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink-soft">{t("common.status")}</label>
            <div className="flex gap-1 rounded-full bg-bg-soft p-1">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`flex-1 rounded-full py-2 text-sm font-semibold capitalize transition ${
                    status === s ? "bg-surface text-foreground shadow-sm" : "text-ink-soft"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </FormSection>

        <FormSection icon={<PaletteIcon className="h-4 w-4" />} title={t("wallet.colorLabel")}>
          <CardBackgroundPicker value={background} onChange={setBackground} plainColor={color} onPlainColorChange={setColor} />
          <div className="border-t border-line pt-3">
            <label className="mb-1.5 block text-xs font-semibold text-ink-soft">{t("background.textColorLabel")}</label>
            <CardTextColorPicker value={textColor} onChange={setTextColor} autoColor={cardForegroundFor(null, background, color).full} />
          </div>
        </FormSection>

        <FormSection icon={<PaletteIcon className="h-4 w-4" />} title={t("wallet.forceTogglesLabel")}>
          <p className="text-xs text-ink-soft">{t("wallet.forceTogglesDesc")}</p>
          <div className="space-y-1.5">
            {FORCE_FIELDS.map(([key, labelKey]) => (
              <ForceToggleField
                key={key}
                label={t(labelKey)}
                value={force[key]}
                onChange={(v) => setForce((prev) => ({ ...prev, [key]: v }))}
              />
            ))}
          </div>
        </FormSection>

        <FormSection icon={<PaletteIcon className="h-4 w-4" />} title={t("wallet.lockCurrencyLabel")}>
          <button
            type="button"
            onClick={() => setCurrencyLocked((v) => !v)}
            className="flex w-full items-center justify-between gap-3 rounded-card border border-line bg-bg-soft px-3.5 py-2.5 text-left transition"
          >
            <span>
              <span className="block text-sm font-medium text-foreground">{t("wallet.lockCurrencyLabel")}</span>
              <span className="block text-xs text-ink-soft">
                {currencyLocked ? t("wallet.lockCurrencyDesc").replace("{currency}", forceCurrencyValue) : t("wallet.lockCurrencyOffDesc")}
              </span>
            </span>
            <span
              role="switch"
              aria-checked={currencyLocked}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
                currencyLocked ? "bg-navy" : "bg-line"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                  currencyLocked ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </span>
          </button>
          {currencyLocked && (
            <SelectDropdown
              value={CURRENCIES.find((c) => c.code === forceCurrencyValue) ? `${forceCurrencyValue} — ${CURRENCIES.find((c) => c.code === forceCurrencyValue)!.name}` : forceCurrencyValue}
              options={CURRENCIES.map((c) => `${c.code} — ${c.name}`)}
              onChange={(label) => setForceCurrencyValue(label.split(" — ")[0])}
            />
          )}
        </FormSection>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        {confirmDelete ? (
          <div className="space-y-2 rounded-card border border-red-500/30 bg-red-500/5 p-3">
            <p className="text-xs text-foreground">{t("wallet.confirmDeleteTemplateDesc")}</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="flex-1 rounded-full px-4 py-2 text-sm font-semibold text-ink-soft transition hover:bg-[var(--nav-hover-bg)]"
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-red-700 disabled:opacity-60"
              >
                {deleting ? t("common.deleting") : t("common.confirmDelete")}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              aria-label={t("common.delete")}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line text-red-600 transition hover:bg-red-500/10 dark:text-red-400"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2">
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
                {submitting ? t("common.saving") : t("form.saveChanges")}
              </button>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
}
