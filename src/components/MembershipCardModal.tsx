"use client";

import { describeFetchError } from "@/lib/fetch-error";
import { useEffect, useMemo, useRef, useState } from "react";
import Modal from "./Modal";
import PassShape from "./PassShape";
import ImageCropModal from "./ImageCropModal";
import FormSection from "./FormSection";
import ColorGlowPreview from "./ColorGlowPreview";
import { CATEGORY_PALETTE } from "@/lib/categories";
import CardBackgroundPicker from "./CardBackgroundPicker";
import CardTextColorPicker from "./CardTextColorPicker";
import PremadePassPicker from "./PremadePassPicker";
import ForceToggleField from "./ForceToggleField";
import { backgroundGlowColor, cardForegroundFor } from "@/lib/card-backgrounds";
import type { CardBackground } from "@/lib/card-backgrounds";
import { CATEGORY_ICON_KEYS, CATEGORY_ICON_LABEL_KEYS } from "@/lib/category-icons";
import { CATEGORY_ICON_COMPONENTS, PlusIcon, CloseIcon, TagIcon, PaletteIcon, FileIcon, MembershipCardIcon } from "@/lib/icons";
import { downscaleImage } from "@/lib/image-downscale";
import { MEMBERSHIP_CODE_FORMATS, type MembershipCodeFormat } from "@/lib/memberships";
import {
  PASS_KINDS,
  PASS_ZONES,
  KIND_FIELDS,
  KIND_LABEL_KEYS,
  MAX_CUSTOM_FIELDS,
  defaultLayoutFor,
  type PassKind,
  type PassZone,
} from "@/lib/membership-templates";
import { toMembershipCard, type MembershipCardApiRow } from "@/lib/membership-card-mapper";
import { useT } from "@/lib/language-context";
import type { MessageKey } from "@/lib/i18n/messages";
import type { MembershipCard } from "@/types/membership";

const FORMAT_LABEL_KEYS: Record<MembershipCodeFormat, MessageKey> = {
  qr: "membership.formatQr",
  code128: "membership.formatCode128",
  ean13: "membership.formatEan13",
  upc: "membership.formatUpc",
  pdf417: "membership.formatPdf417",
  aztec: "membership.formatAztec",
};

const ZONE_LABEL_KEYS: Record<PassZone, MessageKey> = {
  header: "membership.zoneHeader",
  primary: "membership.zonePrimary",
  secondary: "membership.zoneSecondary",
  auxiliary: "membership.zoneAuxiliary",
};

// Which /wallet stack ("pass" vs. "membership") a card belongs to used to
// be a question the entry menu asked up front (separate "Add pass" and
// "Add loyalty card" rows). That was redundant with the Kind picker
// below, which already distinguishes a store/loyalty card from a
// ticket/coupon/boarding pass — so category is now just derived from
// whichever kind is selected, and the two entry-menu rows collapsed into
// one ("Add pass" in WalletEntryModal).
const CATEGORY_BY_KIND: Record<PassKind, "pass" | "membership"> = {
  generic: "membership",
  storeCard: "membership",
  coupon: "pass",
  eventTicket: "pass",
  boardingPass: "pass",
  giftCard: "membership",
  transitPass: "pass",
};

// A slot for attaching an image — a dashed "+" tile when empty, or the
// picked image with a small remove button once one's attached. The
// placeholder tile always uses `className` (a fixed box, so the empty
// state still reads as a clear drop target); the filled preview uses
// `previewClassName` if given — for the logo, that's a fixed height with
// no forced width, so a wide logo stays wide and a tall one stays narrow
// instead of every logo getting squashed into the same square, the way a
// crop tool now already lets the user choose exactly.
function ImageSlot({
  previewUrl,
  onPick,
  onClear,
  ariaLabel,
  removeLabel,
  label,
  className,
  previewClassName,
  fit = "cover",
}: {
  previewUrl: string | null;
  onPick: () => void;
  onClear: () => void;
  ariaLabel: string;
  removeLabel: string;
  label: string;
  className: string;
  previewClassName?: string;
  fit?: "cover" | "contain";
}) {
  if (previewUrl) {
    return (
      <div className={`relative shrink-0 ${previewClassName ?? className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- local object URL / API-served image, not a build-time asset */}
        <img
          src={previewUrl}
          alt=""
          className={`h-full rounded-lg ring-1 ring-line ${fit === "contain" ? "w-auto object-contain" : "w-full object-cover"}`}
        />
        <button
          type="button"
          onClick={onClear}
          aria-label={removeLabel}
          className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-black"
        >
          <CloseIcon className="h-2.5 w-2.5" />
        </button>
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={onPick}
      aria-label={ariaLabel}
      className={`flex shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-line bg-bg-soft text-ink-soft transition hover:border-navy hover:text-navy dark:hover:text-blue-300 ${className}`}
    >
      <PlusIcon className="h-4 w-4" />
      <span className="text-[11px] font-semibold">{label}</span>
    </button>
  );
}

export default function MembershipCardModal({
  card,
  onClose,
  onSaved,
  onScanRequested,
  scannedValue,
}: {
  card?: MembershipCard;
  onClose: () => void;
  onSaved: (card: MembershipCard) => void;
  /** Opens the camera scanner (see ScanCardModal); this modal stays mounted
   * behind it and is re-shown, pre-filled, once a scan succeeds. */
  onScanRequested: () => void;
  scannedValue?: { value: string; format: MembershipCodeFormat } | null;
}) {
  const t = useT();
  const isEdit = Boolean(card);
  const [name, setName] = useState(card?.name ?? "");
  const [codeValue, setCodeValue] = useState(scannedValue?.value ?? card?.codeValue ?? "");
  const [codeFormat, setCodeFormat] = useState<MembershipCodeFormat>(scannedValue?.format ?? card?.codeFormat ?? "qr");
  const [color, setColor] = useState<string>(card?.color ?? CATEGORY_PALETTE[0]);
  const [background, setBackground] = useState<CardBackground | null>(card?.background ?? null);
  const [textColor, setTextColor] = useState<string | null>(card?.textColor ?? null);
  const [icon, setIcon] = useState<string | null>(card?.icon ?? null);
  const [notes, setNotes] = useState(card?.notes ?? "");
  const [showLogo, setShowLogo] = useState(card?.showLogo ?? true);
  const [showName, setShowName] = useState(card?.showName ?? true);
  const [kind, setKind] = useState<PassKind>(card?.kind ?? "generic");
  const [fields, setFields] = useState<Record<string, string>>(card?.fields ?? {});
  const [layout, setLayout] = useState(card?.layout ?? defaultLayoutFor(kind));
  const [editorMode, setEditorMode] = useState<"guided" | "custom">("guided");
  const [selectedFieldKey, setSelectedFieldKey] = useState<string | null>(null);
  // User-named fields beyond the kind's own fixed set — key -> the label
  // the user typed (not an i18n key). Only placeable/editable from the
  // custom editor, same as any other field, once added here.
  const [customFieldLabels, setCustomFieldLabels] = useState<Record<string, string>>(card?.customFieldLabels ?? {});
  const [newCustomFieldLabel, setNewCustomFieldLabel] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Locked by a picked premade pass's lockTextColor — see PremadePassPicker
  // onSelect below. Same convention as WalletModal's own textColorLocked:
  // hides the manual text-color control entirely rather than disabling it.
  const [textColorLocked, setTextColorLocked] = useState(false);
  // Whether a premade pass has been applied this session — once true, the
  // "Submit as template" tab hides (nothing left to upload that isn't
  // already someone else's submitted design), same idea as WalletModal's
  // templateApplied.
  const [templateApplied, setTemplateApplied] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateCountry, setTemplateCountry] = useState("");
  const [templateLockTextColor, setTemplateLockTextColor] = useState(false);
  const [templateForceShowName, setTemplateForceShowName] = useState<boolean | null>(null);
  const [templateForceShowLogo, setTemplateForceShowLogo] = useState<boolean | null>(null);
  const [templateSubmitting, setTemplateSubmitting] = useState(false);
  const [templateSubmitted, setTemplateSubmitted] = useState(false);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const category = CATEGORY_BY_KIND[kind];
  // The modal used to be one long scroll of 5 FormSections (name+kind,
  // code, the field editor, color/icon/images, notes) — same problem the
  // wallet editor had before its own tab split. Grouped the same way here:
  // Basics/Code stay separate (both short, both essential), Fields is its
  // own tab since the guided/custom editor is the single biggest chunk of
  // UI, and Look folds in notes at the end (matching how the wallet
  // editor's "Card details" tab also ends with Notes).
  const [tab, setTab] = useState<"basics" | "code" | "fields" | "look" | "template">("basics");

  // Logo/banner: a staged File replaces whatever's already saved (shown via
  // the /logo|/banner API routes for an existing card); "removed" clears a
  // previously-saved image with no replacement. Actual upload/delete calls
  // happen after the card itself is saved, since a brand-new card has no id
  // yet to attach an image to.
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoRemoved, setLogoRemoved] = useState(false);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerRemoved, setBannerRemoved] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  // A picked file opens the crop modal before it ever becomes logoFile/
  // bannerFile — the raw picked file, not what actually gets staged/saved.
  const [cropTarget, setCropTarget] = useState<{ kind: "logo" | "banner"; file: File } | null>(null);

  // Derived (not stateful) so creating the URL never triggers a setState-
  // in-effect cascade — the effect below only ever revokes, never sets.
  const logoObjectUrl = useMemo(() => (logoFile ? URL.createObjectURL(logoFile) : null), [logoFile]);
  const bannerObjectUrl = useMemo(() => (bannerFile ? URL.createObjectURL(bannerFile) : null), [bannerFile]);
  useEffect(() => () => { if (logoObjectUrl) URL.revokeObjectURL(logoObjectUrl); }, [logoObjectUrl]);
  useEffect(() => () => { if (bannerObjectUrl) URL.revokeObjectURL(bannerObjectUrl); }, [bannerObjectUrl]);

  const logoPreviewUrl = logoFile ? logoObjectUrl : logoRemoved ? null : card?.hasLogo ? `/api/memberships/${card.id}/logo` : null;
  const bannerPreviewUrl = bannerFile ? bannerObjectUrl : bannerRemoved ? null : card?.hasBanner ? `/api/memberships/${card.id}/banner` : null;

  function handleLogoSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setCropTarget({ kind: "logo", file });
  }

  function handleBannerSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setCropTarget({ kind: "banner", file });
  }

  async function handleCropped(cropped: File) {
    const kind = cropTarget?.kind;
    setCropTarget(null);
    const downscaled = await downscaleImage(cropped);
    if (kind === "logo") {
      setLogoFile(downscaled);
      setLogoRemoved(false);
    } else if (kind === "banner") {
      setBannerFile(downscaled);
      setBannerRemoved(false);
    }
  }

  function clearLogo() {
    setLogoFile(null);
    setLogoRemoved(true);
  }

  function clearBanner() {
    setBannerFile(null);
    setBannerRemoved(true);
  }

  // Runs after the card fields themselves are saved (so an id definitely
  // exists) — uploads/deletes the logo and banner, then folds the result
  // into the flags the rest of the app reads (MembershipCard.hasLogo/
  // hasBanner) so the caller doesn't need a second fetch to see them.
  async function syncImages(cardId: number, current: { hasLogo: boolean; hasBanner: boolean }) {
    let hasLogo = current.hasLogo;
    let hasBanner = current.hasBanner;
    if (logoFile) {
      const fd = new FormData();
      fd.set("image", logoFile);
      const res = await fetch(`/api/memberships/${cardId}/logo`, { method: "POST", body: fd });
      if (res.ok) hasLogo = true;
    } else if (logoRemoved) {
      await fetch(`/api/memberships/${cardId}/logo`, { method: "DELETE" });
      hasLogo = false;
    }
    if (bannerFile) {
      const fd = new FormData();
      fd.set("image", bannerFile);
      const res = await fetch(`/api/memberships/${cardId}/banner`, { method: "POST", body: fd });
      if (res.ok) hasBanner = true;
    } else if (bannerRemoved) {
      await fetch(`/api/memberships/${cardId}/banner`, { method: "DELETE" });
      hasBanner = false;
    }
    return { hasLogo, hasBanner };
  }

  // Submits the current pass's look — not its data — as a "premade pass"
  // for admin review, same idea as WalletModal's handleUploadTemplate.
  // `kind` travels along unconditionally (a pass template is always tied
  // to one, unlike a wallet card's optional category).
  async function handleUploadTemplate() {
    setTemplateSubmitting(true);
    setTemplateError(null);
    try {
      const res = await fetch("/api/pass-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: templateName.trim() || name || t("membership.namePlaceholder"),
          kind,
          color,
          background,
          textColor,
          lockTextColor: templateLockTextColor,
          forceShowName: templateForceShowName,
          forceShowLogo: templateForceShowLogo,
          country: templateCountry.trim() || null,
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

  const categoryIconLabels = Object.fromEntries(
    Object.entries(CATEGORY_ICON_LABEL_KEYS).map(([k, v]) => [k, t(v)]),
  ) as Record<string, string>;

  const kindFieldDefs = KIND_FIELDS[kind];
  const fieldByKey = Object.fromEntries(kindFieldDefs.map((f) => [f.key, f]));
  const customFieldKeys = Object.keys(customFieldLabels);
  const placedKeys = new Set(Object.values(layout).flat().filter((k): k is string => Boolean(k)));
  const unplacedKeys = [...kindFieldDefs.map((f) => f.key), ...customFieldKeys].filter((k) => !placedKeys.has(k));
  const hasAnyFields = kindFieldDefs.length > 0 || customFieldKeys.length > 0;

  // A field's label either comes from the kind's own i18n key, or — for a
  // custom field — is whatever plain text the user typed for it.
  function labelForKey(key: string): string {
    const def = fieldByKey[key];
    return def ? t(def.labelKey) : (customFieldLabels[key] ?? key);
  }

  // "Fields" only shows up once the current kind actually has fields to
  // place, kind-defined or custom — same idea as the wallet editor's
  // Template tab disappearing once it's no longer relevant. The "template"
  // tab here is the *actual* premade-design submission tab (see
  // handleUploadTemplate) — unrelated to a card's own `kind`.
  const tabs = (
    [
      ["basics", "wallet.tabBasics"],
      ["code", "membership.tabCode"],
      ["fields", "membership.tabFields"],
      ["look", "wallet.tabLook"],
      ["template", "wallet.tabTemplate"],
    ] as const
  ).filter(([key]) => (key !== "fields" || hasAnyFields) && (key !== "template" || !templateApplied));

  function handleKindChange(next: PassKind) {
    setKind(next);
    setFields({});
    setLayout(defaultLayoutFor(next));
    setSelectedFieldKey(null);
    // A kind switch starts the field layout fresh, so any custom fields
    // placed under the old kind wouldn't have anywhere meaningful to live
    // either — same reset as fields/layout above.
    setCustomFieldLabels({});
    // Switching to a kind with no fields (e.g. "generic" used to) makes
    // the "Fields" tab disappear from the strip above — bail out of it so
    // the user isn't left on a tab that no longer renders anything.
    if (tab === "fields" && KIND_FIELDS[next].length === 0) setTab("basics");
  }

  function setFieldValue(key: string, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  function placeField(zone: PassZone) {
    if (!selectedFieldKey) return;
    setLayout((prev) => ({ ...prev, [zone]: [...(prev[zone] ?? []), selectedFieldKey] }));
    setSelectedFieldKey(null);
  }

  function unplaceField(zone: PassZone, key: string) {
    setLayout((prev) => ({ ...prev, [zone]: (prev[zone] ?? []).filter((k) => k !== key) }));
  }

  // Custom fields (unlike a kind's own fixed set) are the user's own
  // creation, so — unlike unplaceField, which just moves a field back to
  // the "available" pool — this drops it entirely: its label, its value,
  // and any zone slot it was placed in.
  function addCustomField() {
    const label = newCustomFieldLabel.trim();
    if (!label || customFieldKeys.length >= MAX_CUSTOM_FIELDS) return;
    // A full UUID here ("custom-" + 36 chars = 43) blew past the 40-char
    // key cap validation.ts enforces on both fields/customFieldLabels —
    // every save with a custom field on it failed with "Could not save."
    // A base-36 timestamp plus a short random suffix is plenty unique for
    // fields on one pass and comfortably under the limit.
    const key = `custom-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    setCustomFieldLabels((prev) => ({ ...prev, [key]: label }));
    setFields((prev) => ({ ...prev, [key]: "" }));
    setNewCustomFieldLabel("");
    setSelectedFieldKey(key);
  }

  function removeCustomField(key: string) {
    setCustomFieldLabels((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setFields((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setLayout((prev) =>
      Object.fromEntries(PASS_ZONES.map((zone) => [zone, (prev[zone] ?? []).filter((k) => k !== key)])) as typeof prev,
    );
    if (selectedFieldKey === key) setSelectedFieldKey(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const body = {
        name,
        codeValue,
        codeFormat,
        color,
        background,
        textColor,
        icon,
        notes: notes.trim() || null,
        kind,
        fields,
        layout,
        category,
        customFieldLabels,
        showLogo,
        showName,
      };
      const res = isEdit
        ? await fetch(`/api/memberships/${card!.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch("/api/memberships", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not save.");
        return;
      }
      const saved = toMembershipCard(data.card as MembershipCardApiRow);
      const images = await syncImages(saved.id, saved);
      onSaved({ ...saved, ...images });
    } catch (err) {
      setError(describeFetchError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      onClose={onClose}
      title={
        category === "pass"
          ? isEdit
            ? t("wallet.editPass")
            : t("wallet.addPass")
          : isEdit
            ? t("membership.editTitle")
            : t("membership.addCard")
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Always renders through PassShape — the same component the saved
         * detail view uses — rather than swapping in a separate bare
         * placeholder before a code is entered. That previously meant
         * kind/field/layout edits (points balance, discount, seat,
         * etc.) had no visible effect at all until a code existed;
         * MembershipCardCode itself now handles the empty-code case (a
         * dashed placeholder instead of trying to render a barcode for
         * empty text), so PassShape can always be shown. */}
        <ColorGlowPreview color={backgroundGlowColor(background, color)}>
          <PassShape
            name={name || t("membership.namePlaceholder")}
            color={color}
            background={background}
            textColor={textColor}
            icon={icon}
            kind={kind}
            fields={fields}
            layout={layout}
            codeValue={codeValue}
            codeFormat={codeFormat}
            codeSize="small"
            logoUrl={logoPreviewUrl}
            bannerUrl={bannerPreviewUrl}
            notes={notes}
            customFieldLabels={customFieldLabels}
            showLogo={showLogo}
            showName={showName}
          />
        </ColorGlowPreview>

        {/* Same horizontally-scrollable chip strip as the wallet editor's
         * tab bar — each tab keeps its natural width instead of being
         * squeezed into an equal-width segmented control. */}
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {tabs.map(([key, labelKey]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                tab === key
                  ? "border-transparent bg-navy text-white shadow-sm"
                  : "border-line bg-bg-soft text-ink-soft hover:bg-[var(--nav-hover-bg)]"
              }`}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>

        {tab === "basics" && (
        <FormSection icon={<TagIcon className="h-4 w-4" />} title={t("membership.nameLabel")}>
          <input
            id="membershipName"
            type="text"
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("membership.namePlaceholder")}
            className="w-full rounded-card border border-line bg-bg-soft px-3.5 py-2.5 text-base text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
          />

          {/* The name itself stays required (used in lists, the modal
           * title, etc.) — this only controls whether it also repeats in
           * the card face's header, which can feel redundant next to a
           * logo or banner that already spells the name out. */}
          <button
            type="button"
            onClick={() => setShowName((v) => !v)}
            className="flex w-full items-center justify-between gap-3 rounded-card border border-line bg-bg-soft px-3.5 py-2.5 text-left transition"
          >
            <span className="text-sm font-medium text-foreground">{t("membership.showNameOnCardLabel")}</span>
            <span
              role="switch"
              aria-checked={showName}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${showName ? "bg-navy" : "bg-line"}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                  showName ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </span>
          </button>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink-soft">{t("membership.kindLabel")}</label>
            <div className="flex flex-wrap gap-1.5">
              {PASS_KINDS.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => handleKindChange(k)}
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
        </FormSection>
        )}

        {tab === "code" && (
        <FormSection
          icon={<MembershipCardIcon className="h-4 w-4" />}
          title={t("membership.codeLabel")}
          action={
            <button
              type="button"
              onClick={onScanRequested}
              className="text-xs font-semibold text-navy hover:underline dark:text-blue-300"
            >
              {t("membership.scanInstead")}
            </button>
          }
        >
          <input
            id="membershipCode"
            type="text"
            required
            value={codeValue}
            onChange={(e) => setCodeValue(e.target.value)}
            placeholder={t("membership.codePlaceholder")}
            className="w-full rounded-card border border-line bg-bg-soft px-3.5 py-2.5 text-base text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
          />
          <p className="-mt-1 text-[11px] text-ink-soft">{t("membership.codeLinkHint")}</p>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink-soft">{t("membership.formatLabel")}</label>
            <div className="flex flex-wrap gap-1.5">
              {MEMBERSHIP_CODE_FORMATS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setCodeFormat(f)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    codeFormat === f
                      ? "border-navy bg-navy/10 text-navy dark:text-blue-300"
                      : "border-line text-ink-soft hover:bg-[var(--nav-hover-bg)]"
                  }`}
                >
                  {t(FORMAT_LABEL_KEYS[f])}
                </button>
              ))}
            </div>
          </div>
        </FormSection>
        )}

        {tab === "fields" && hasAnyFields && (
          <FormSection
            icon={(() => {
              const Icon = CATEGORY_ICON_COMPONENTS.receipt;
              return <Icon className="h-4 w-4" />;
            })()}
            title={t(KIND_LABEL_KEYS[kind])}
            action={
              <div className="flex gap-1 rounded-full bg-bg-soft p-1">
                <button
                  type="button"
                  onClick={() => setEditorMode("guided")}
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                    editorMode === "guided" ? "bg-surface text-foreground shadow-sm" : "text-ink-soft"
                  }`}
                >
                  {t("membership.editorGuided")}
                </button>
                <button
                  type="button"
                  onClick={() => setEditorMode("custom")}
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                    editorMode === "custom" ? "bg-surface text-foreground shadow-sm" : "text-ink-soft"
                  }`}
                >
                  {t("membership.editorCustom")}
                </button>
              </div>
            }
          >
            {editorMode === "guided" ? (
              <div className="space-y-3">
                {kindFieldDefs.map((def) => (
                  <div key={def.key}>
                    <label className="mb-1 block text-xs font-semibold text-ink-soft">{t(def.labelKey)}</label>
                    <input
                      type="text"
                      value={fields[def.key] ?? ""}
                      onChange={(e) => setFieldValue(def.key, e.target.value)}
                      placeholder={t(def.placeholderKey)}
                      className="w-full rounded-card border border-line bg-bg-soft px-3 py-2 text-sm text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3 rounded-card border border-line bg-bg-soft p-3">
                {/* Every zone is offered here now, not just the ones the
                 * current kind pre-defines a field for — a custom field
                 * can go anywhere, including a zone (e.g. Header) this
                 * kind's own fixed fields never use. */}
                {PASS_ZONES.map((zone) => {
                  const placed = (layout[zone] ?? []).filter((k): k is string => Boolean(k));
                  return (
                    <div key={zone}>
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
                        {t(ZONE_LABEL_KEYS[zone])}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {placed.map((key) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => unplaceField(zone, key)}
                            className="rounded-full border border-navy bg-navy/10 px-3 py-1.5 text-xs font-semibold text-navy dark:text-blue-300"
                          >
                            {labelForKey(key)} ×
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => placeField(zone)}
                          disabled={!selectedFieldKey}
                          aria-label={t("membership.addFieldHere")}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-line bg-surface text-ink-soft transition hover:bg-[var(--nav-hover-bg)] disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Type a name, add it to the available pool below, then
                 * tap-then-place it into a zone the same way as any of the
                 * kind's own fields — the only field-adding path used
                 * to be picking from that fixed list. */}
                <div className="border-t border-line pt-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">{t("membership.newFieldLabel")}</p>
                  <div className="mt-1.5 flex gap-1.5">
                    <input
                      type="text"
                      value={newCustomFieldLabel}
                      onChange={(e) => setNewCustomFieldLabel(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addCustomField();
                        }
                      }}
                      placeholder={t("membership.newFieldPlaceholder")}
                      disabled={customFieldKeys.length >= MAX_CUSTOM_FIELDS}
                      className="min-w-0 flex-1 rounded-card border border-line bg-surface px-3 py-2 text-sm text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20 disabled:opacity-60"
                    />
                    <button
                      type="button"
                      onClick={addCustomField}
                      disabled={!newCustomFieldLabel.trim() || customFieldKeys.length >= MAX_CUSTOM_FIELDS}
                      className="shrink-0 rounded-full border border-line bg-surface px-3.5 py-2 text-xs font-semibold text-foreground transition hover:bg-[var(--nav-hover-bg)] disabled:opacity-40"
                    >
                      {t("membership.newFieldAdd")}
                    </button>
                  </div>
                  {customFieldKeys.length >= MAX_CUSTOM_FIELDS && (
                    <p className="mt-1 text-[11px] text-ink-soft">{t("membership.newFieldLimitReached")}</p>
                  )}
                </div>

                {unplacedKeys.length > 0 && (
                  <div className="border-t border-line pt-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">{t("membership.availableFields")}</p>
                    <p className="mb-1.5 text-[11px] text-ink-soft">{t("membership.tapFieldHint")}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {unplacedKeys.map((key) => {
                        const isCustom = key in customFieldLabels;
                        return (
                          <div key={key} className="flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={() => setSelectedFieldKey(key)}
                              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                                selectedFieldKey === key
                                  ? "border-navy bg-navy text-white"
                                  : "border-line bg-surface text-ink-soft hover:bg-[var(--nav-hover-bg)]"
                              }`}
                            >
                              {labelForKey(key)}
                            </button>
                            {isCustom && (
                              <button
                                type="button"
                                onClick={() => removeCustomField(key)}
                                aria-label={t("membership.removeCustomField")}
                                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-ink-soft transition hover:bg-[var(--nav-hover-bg)] hover:text-red-600 dark:hover:text-red-400"
                              >
                                <CloseIcon className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {placedKeys.size > 0 && (
                  <div className="space-y-2.5 border-t border-line pt-3">
                    {[...kindFieldDefs.map((f) => f.key), ...customFieldKeys]
                      .filter((key) => placedKeys.has(key))
                      .map((key) => {
                        const def = fieldByKey[key];
                        const isCustom = key in customFieldLabels;
                        return (
                          <div key={key}>
                            <div className="mb-1 flex items-center justify-between gap-2">
                              <label className="text-xs font-semibold text-ink-soft">{labelForKey(key)}</label>
                              {isCustom && (
                                <button
                                  type="button"
                                  onClick={() => removeCustomField(key)}
                                  className="text-[11px] font-semibold text-ink-soft hover:text-red-600 dark:hover:text-red-400"
                                >
                                  {t("membership.removeCustomField")}
                                </button>
                              )}
                            </div>
                            <input
                              type="text"
                              value={fields[key] ?? ""}
                              onChange={(e) => setFieldValue(key, e.target.value)}
                              placeholder={def ? t(def.placeholderKey) : undefined}
                              className="w-full rounded-card border border-line bg-surface px-3 py-2 text-sm text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
                            />
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            )}
          </FormSection>
        )}

        {tab === "look" && (
        <>
        <FormSection icon={<PaletteIcon className="h-4 w-4" />} title={t("membership.colorLabel")}>
          <PremadePassPicker
            onSelect={(tpl) => {
              setTemplateApplied(true);
              handleKindChange(tpl.kind);
              setBackground(tpl.background);
              setColor(tpl.color);
              setTextColor(tpl.textColor);
              setTextColorLocked(tpl.lockTextColor);
              if (tpl.forceShowName !== null) setShowName(tpl.forceShowName);
              if (tpl.forceShowLogo !== null) setShowLogo(tpl.forceShowLogo);
            }}
          />
          <CardBackgroundPicker value={background} onChange={setBackground} plainColor={color} onPlainColorChange={setColor} />

          {!textColorLocked && (
          <div className="border-t border-line pt-3">
            <label className="mb-1.5 block text-xs font-semibold text-ink-soft">{t("background.textColorLabel")}</label>
            <CardTextColorPicker value={textColor} onChange={setTextColor} autoColor={cardForegroundFor(null, background, color).full} />
          </div>
          )}

          <div className="border-t border-line pt-3">
            <label className="mb-1.5 block text-xs font-semibold text-ink-soft">{t("membership.iconLabel")}</label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setIcon(null)}
                className={`flex h-9 w-9 items-center justify-center rounded-full border text-xs font-semibold transition ${
                  icon === null ? "border-navy bg-navy/10 text-navy dark:text-blue-300" : "border-line text-ink-soft hover:bg-[var(--nav-hover-bg)]"
                }`}
              >
                {t("category.none")}
              </button>
              {CATEGORY_ICON_KEYS.map((key) => {
                const Icon = CATEGORY_ICON_COMPONENTS[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setIcon(key)}
                    aria-label={categoryIconLabels[key]}
                    className={`flex h-9 w-9 items-center justify-center rounded-full border transition ${
                      icon === key
                        ? "border-navy bg-navy/10 text-navy dark:text-blue-300"
                        : "border-line text-ink-soft hover:bg-[var(--nav-hover-bg)]"
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-line pt-3">
            <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoSelected} className="hidden" />
            <input ref={bannerInputRef} type="file" accept="image/*" onChange={handleBannerSelected} className="hidden" />
            {cropTarget && (
              <ImageCropModal
                file={cropTarget.file}
                // Banner is always the pass's fixed 16:9 hero strip, so its
                // crop frame is locked to that shape; the logo has no fixed
                // shape of its own — freeform, so whatever the user drags
                // the frame to becomes the logo's own aspect ratio.
                aspect={cropTarget.kind === "banner" ? 16 / 9 : null}
                onCancel={() => setCropTarget(null)}
                onCropped={handleCropped}
              />
            )}
            <div className="flex gap-3">
              <ImageSlot
                previewUrl={logoPreviewUrl}
                onPick={() => logoInputRef.current?.click()}
                onClear={clearLogo}
                ariaLabel={t("membership.addLogo")}
                removeLabel={t("membership.removeImage")}
                label={t("membership.addLogo")}
                className="h-16 w-16"
                previewClassName="h-16 max-w-[10rem]"
                fit="contain"
              />
              <ImageSlot
                previewUrl={bannerPreviewUrl}
                onPick={() => bannerInputRef.current?.click()}
                onClear={clearBanner}
                ariaLabel={t("membership.addBanner")}
                removeLabel={t("membership.removeImage")}
                label={t("membership.addBanner")}
                className="h-16 flex-1"
              />
            </div>

            {/* Controls the header's logo/icon slot as a whole — attaching
             * a logo doesn't force it to show, and this doesn't clear a
             * logo that's already attached, just whether it's shown. */}
            <button
              type="button"
              onClick={() => setShowLogo((v) => !v)}
              className="mt-3 flex w-full items-center justify-between gap-3 rounded-card border border-line bg-bg-soft px-3.5 py-2.5 text-left transition"
            >
              <span className="text-sm font-medium text-foreground">{t("membership.showLogoOnCardLabel")}</span>
              <span
                role="switch"
                aria-checked={showLogo}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${showLogo ? "bg-navy" : "bg-line"}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                    showLogo ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </span>
            </button>
          </div>
        </FormSection>

        <FormSection icon={<FileIcon className="h-4 w-4" />} title={t("membership.notesLabel")}>
          <textarea
            id="membershipNotes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t("membership.notesPlaceholder")}
            className="w-full resize-none rounded-card border border-line bg-bg-soft px-3.5 py-2.5 text-base text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
          />
        </FormSection>
        </>
        )}

        {tab === "template" && !templateApplied && (
        <>
        {templateSubmitted ? (
        <FormSection icon={<PaletteIcon className="h-4 w-4" />} title={t("wallet.uploadTemplateLabel")}>
          <p className="text-xs text-ink-soft">{t("wallet.templateSubmittedDesc")}</p>
        </FormSection>
        ) : (
        <>
        <p className="text-xs text-ink-soft">{t("membership.uploadPassTemplateDesc")}</p>

        <FormSection icon={<MembershipCardIcon className="h-4 w-4" />} title={t("wallet.templateDetailsLabel")}>
          <div>
            <label htmlFor="passTemplateNameInput" className="mb-1.5 block text-xs font-semibold text-ink-soft">
              {t("wallet.templateNameLabel")}
            </label>
            <input
              id="passTemplateNameInput"
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder={name || t("membership.namePlaceholder")}
              className="w-full rounded-card border border-line bg-bg-soft px-3.5 py-2.5 text-base text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
            />
          </div>

          <div>
            <label htmlFor="passTemplateCountryInput" className="mb-1.5 block text-xs font-semibold text-ink-soft">
              {t("wallet.templateCountryLabel")}
            </label>
            <input
              id="passTemplateCountryInput"
              type="text"
              value={templateCountry}
              onChange={(e) => setTemplateCountry(e.target.value)}
              placeholder={t("wallet.templateCountryPlaceholder")}
              className="w-full rounded-card border border-line bg-bg-soft px-3.5 py-2.5 text-base text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
            />
          </div>
        </FormSection>

        <FormSection icon={<PaletteIcon className="h-4 w-4" />} title={t("wallet.forceTogglesLabel")}>
          <p className="text-xs text-ink-soft">{t("wallet.forceTogglesDesc")}</p>
          <div className="space-y-1.5">
            <ForceToggleField label={t("membership.showNameOnCardLabel")} value={templateForceShowName} onChange={setTemplateForceShowName} />
            <ForceToggleField label={t("membership.showLogoOnCardLabel")} value={templateForceShowLogo} onChange={setTemplateForceShowLogo} />
          </div>

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
            {submitting
              ? t("common.saving")
              : isEdit
                ? t("form.saveChanges")
                : category === "pass"
                  ? t("wallet.addPass")
                  : t("membership.addCard")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
