"use client";

import { useRef, useState } from "react";
import Modal from "./Modal";
import FormSection from "./FormSection";
import ColorGlowPreview from "./ColorGlowPreview";
import CardBackgroundPicker from "./CardBackgroundPicker";
import CardTextColorPicker from "./CardTextColorPicker";
import ForceToggleField from "./ForceToggleField";
import LockToggleField from "./LockToggleField";
import { backgroundGlowColor, cardForegroundFor, cardBackgroundStyle, type CardBackground } from "@/lib/card-backgrounds";
import { heroGradientClasses, colorHeroStyle } from "@/lib/category-styles";
import { CATEGORY_PALETTE } from "@/lib/categories";
import { PASS_KINDS, KIND_LABEL_KEYS, type PassKind } from "@/lib/membership-templates";
import { PASS_TEMPLATE_CATEGORIES, PASS_TEMPLATE_CATEGORY_LABEL_KEYS, type PassTemplateCategory } from "@/lib/pass-template-category";
import { passTemplateImageUrl } from "@/lib/membership-card-mapper";
import { PaletteIcon, TrashIcon, CloseIcon } from "@/lib/icons";
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
  const [lockLogo, setLockLogo] = useState(template.lockLogo);
  const [lockBanner, setLockBanner] = useState(template.lockBanner);
  const [lockFields, setLockFields] = useState(template.lockFields);
  const [status, setStatus] = useState(template.status);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // The logo/banner images themselves upload/remove immediately (unlike
  // every other field here, which only saves on form submit) — the
  // template already has an id, so there's no "create it first" step the
  // way a brand-new pass needs before it can attach one. hasLogo/hasBanner/
  // *UpdatedAt are tracked locally so the preview and cache-busting query
  // param update right after a successful call, without waiting on
  // onSaved's full-template refresh (which only happens on form submit).
  const [hasLogo, setHasLogo] = useState(template.hasLogo);
  const [hasBanner, setHasBanner] = useState(template.hasBanner);
  const [logoUpdatedAt, setLogoUpdatedAt] = useState(template.logoUpdatedAt);
  const [bannerUpdatedAt, setBannerUpdatedAt] = useState(template.bannerUpdatedAt);
  const [imageError, setImageError] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  async function handleImageSelected(kind: "logo" | "banner", file: File | undefined) {
    if (!file) return;
    setImageError(null);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch(`/api/pass-templates/${template.id}/${kind}`, { method: "POST", body: formData });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setImageError(typeof data?.error === "string" ? data.error : "Could not upload that image.");
        return;
      }
      const now = new Date().toISOString();
      if (kind === "logo") {
        setHasLogo(true);
        setLogoUpdatedAt(now);
      } else {
        setHasBanner(true);
        setBannerUpdatedAt(now);
      }
    } catch (err) {
      setImageError(describeFetchError(err));
    }
  }

  async function handleImageRemove(kind: "logo" | "banner") {
    setImageError(null);
    try {
      const res = await fetch(`/api/pass-templates/${template.id}/${kind}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setImageError(typeof data?.error === "string" ? data.error : "Could not remove that image.");
        return;
      }
      if (kind === "logo") {
        setHasLogo(false);
        setLogoUpdatedAt(null);
      } else {
        setHasBanner(false);
        setBannerUpdatedAt(null);
      }
    } catch (err) {
      setImageError(describeFetchError(err));
    }
  }

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
          lockLogo,
          lockBanner,
          lockFields,
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

        {/* Logo/banner images upload/remove immediately (see
         * handleImageSelected/handleImageRemove) — locking one only makes
         * sense once an image actually exists to lock, so the toggle and
         * the image slot live in the same section. */}
        <FormSection icon={<PaletteIcon className="h-4 w-4" />} title={t("membership.lockLogoLabel")}>
          {imageError && <p className="text-xs text-red-600 dark:text-red-400">{imageError}</p>}
          <input
            ref={logoInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              handleImageSelected("logo", file);
            }}
          />
          {hasLogo ? (
            <div className="relative inline-block h-16 w-16">
              {/* eslint-disable-next-line @next/next/no-img-element -- API-served image, not a build-time asset */}
              <img
                src={passTemplateImageUrl(template.id, "logo", logoUpdatedAt)}
                alt=""
                className="h-full w-full rounded-lg object-contain ring-1 ring-line"
              />
              <button
                type="button"
                onClick={() => handleImageRemove("logo")}
                aria-label={t("membership.removeImage")}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-black"
              >
                <CloseIcon className="h-2.5 w-2.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-line text-xs font-semibold text-ink-soft transition hover:bg-[var(--nav-hover-bg)]"
            >
              {t("membership.addLogo")}
            </button>
          )}
          <LockToggleField
            label={t("membership.lockLogoLabel")}
            description={t("membership.lockLogoDesc")}
            checked={lockLogo}
            onChange={setLockLogo}
          />
        </FormSection>

        <FormSection icon={<PaletteIcon className="h-4 w-4" />} title={t("membership.lockBannerLabel")}>
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              handleImageSelected("banner", file);
            }}
          />
          {hasBanner ? (
            <div className="relative inline-block h-16 w-full max-w-xs">
              {/* eslint-disable-next-line @next/next/no-img-element -- API-served image, not a build-time asset */}
              <img
                src={passTemplateImageUrl(template.id, "banner", bannerUpdatedAt)}
                alt=""
                className="h-full w-full rounded-lg object-cover ring-1 ring-line"
              />
              <button
                type="button"
                onClick={() => handleImageRemove("banner")}
                aria-label={t("membership.removeImage")}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-black"
              >
                <CloseIcon className="h-2.5 w-2.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => bannerInputRef.current?.click()}
              className="flex h-16 w-full max-w-xs items-center justify-center rounded-lg border border-dashed border-line text-xs font-semibold text-ink-soft transition hover:bg-[var(--nav-hover-bg)]"
            >
              {t("membership.addBanner")}
            </button>
          )}
          <LockToggleField
            label={t("membership.lockBannerLabel")}
            description={t("membership.lockBannerDesc")}
            checked={lockBanner}
            onChange={setLockBanner}
          />
        </FormSection>

        <FormSection icon={<PaletteIcon className="h-4 w-4" />} title={t("wallet.lockTextColorLabel")}>
          <LockToggleField
            label={t("wallet.lockTextColorLabel")}
            description={t("wallet.lockTextColorDesc")}
            checked={lockTextColor}
            onChange={setLockTextColor}
          />
          <LockToggleField
            label={t("membership.lockFieldsLabel")}
            description={t("membership.lockFieldsDesc")}
            checked={lockFields}
            onChange={setLockFields}
          />
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
