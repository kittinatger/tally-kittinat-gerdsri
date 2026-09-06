"use client";

import { useState } from "react";
import Modal from "./Modal";
import FormSection from "./FormSection";
import ColorGlowPreview from "./ColorGlowPreview";
import CardBackgroundPicker from "./CardBackgroundPicker";
import CardTextColorPicker from "./CardTextColorPicker";
import ForceToggleField from "./ForceToggleField";
import { backgroundGlowColor, cardForegroundFor, cardBackgroundStyle, type CardBackground } from "@/lib/card-backgrounds";
import { heroGradientClasses, colorHeroStyle } from "@/lib/category-styles";
import { CATEGORY_PALETTE } from "@/lib/categories";
import { PASS_KINDS, KIND_LABEL_KEYS, type PassKind } from "@/lib/membership-templates";
import { PASS_TEMPLATE_CATEGORIES, PASS_TEMPLATE_CATEGORY_LABEL_KEYS, type PassTemplateCategory } from "@/lib/pass-template-category";
import { PaletteIcon, TrashIcon } from "@/lib/icons";
import { describeFetchError } from "@/lib/fetch-error";
import { useT } from "@/lib/language-context";
import type { PassTemplateOption } from "@/types/pass-template";

const STATUSES = ["pending", "approved", "rejected"] as const;

// The admin's full edit surface for one existing pass template — mirrors
// TemplateEditModal (card templates) exactly, minus the long list of
// force_* overrides card templates carry (a pass's kind already fixes its
// fields, so there's less to override). Previously pass templates had no
// edit surface at all — see updatePassTemplate's comment in db.ts.
export default function PassTemplateEditModal({
  template,
  onClose,
  onSaved,
  onDeleted,
}: {
  template: PassTemplateOption;
  onClose: () => void;
  onSaved: (updated: PassTemplateOption) => void;
  onDeleted: (id: number) => void;
}) {
  const t = useT();
  const [name, setName] = useState(template.name);
  const [kind, setKind] = useState<PassKind>(template.kind);
  const [color, setColor] = useState(template.color || CATEGORY_PALETTE[0]);
  const [background, setBackground] = useState<CardBackground | null>(template.background);
  const [textColor, setTextColor] = useState<string | null>(template.textColor);
  const [lockTextColor, setLockTextColor] = useState(template.lockTextColor);
  const [forceShowName, setForceShowName] = useState<boolean | null>(template.forceShowName);
  const [forceShowLogo, setForceShowLogo] = useState<boolean | null>(template.forceShowLogo);
  const [category, setCategory] = useState<PassTemplateCategory | null>(template.category);
  const [status, setStatus] = useState(template.status);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/pass-templates/${template.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          kind,
          color,
          background,
          textColor,
          lockTextColor,
          forceShowName,
          forceShowLogo,
          category,
          status,
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
      const res = await fetch(`/api/pass-templates/${template.id}`, { method: "DELETE" });
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
        {/* Same portrait, non-card-shaped swatch as the review list and
         * PremadePassPicker — a pass isn't a bank card. */}
        <ColorGlowPreview color={backgroundGlowColor(background, color)}>
          <div className="mx-auto h-40 w-28 overflow-hidden rounded-2xl shadow-soft">
            <div
              className={`h-2/3 w-full ${background ? "" : heroGradientClasses(color)}`}
              style={background ? cardBackgroundStyle(background) : colorHeroStyle(color)}
            />
            <div className="h-1/3 w-full bg-white" />
          </div>
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
            <label className="mb-1.5 block text-xs font-semibold text-ink-soft">{t("membership.kindLabel")}</label>
            <div className="flex flex-wrap gap-1.5">
              {PASS_KINDS.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    kind === k
                      ? "border-navy bg-navy/10 text-navy dark:text-blue-300"
                      : "border-line text-ink-soft hover:bg-[var(--nav-hover-bg)]"
                  }`}
                >
                  {t(KIND_LABEL_KEYS[k])}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink-soft">{t("membership.passTemplateCategoryLabel")}</label>
            <div className="flex flex-wrap gap-1.5">
              {PASS_TEMPLATE_CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory((prev) => (prev === c ? null : c))}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    category === c
                      ? "border-navy bg-navy/10 text-navy dark:text-blue-300"
                      : "border-line text-ink-soft hover:bg-[var(--nav-hover-bg)]"
                  }`}
                >
                  {t(PASS_TEMPLATE_CATEGORY_LABEL_KEYS[c])}
                </button>
              ))}
            </div>
          </div>

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
            <ForceToggleField label={t("membership.showNameOnCardLabel")} value={forceShowName} onChange={setForceShowName} />
            <ForceToggleField label={t("membership.showLogoOnCardLabel")} value={forceShowLogo} onChange={setForceShowLogo} />
          </div>
        </FormSection>

        <FormSection icon={<PaletteIcon className="h-4 w-4" />} title={t("wallet.lockTextColorLabel")}>
          <button
            type="button"
            onClick={() => setLockTextColor((v) => !v)}
            className="flex w-full items-center justify-between gap-3 rounded-card border border-line bg-bg-soft px-3.5 py-2.5 text-left transition"
          >
            <span>
              <span className="block text-sm font-medium text-foreground">{t("wallet.lockTextColorLabel")}</span>
              <span className="block text-xs text-ink-soft">{t("wallet.lockTextColorDesc")}</span>
            </span>
            <span
              role="switch"
              aria-checked={lockTextColor}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
                lockTextColor ? "bg-navy" : "bg-line"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                  lockTextColor ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </span>
          </button>
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
