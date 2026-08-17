"use client";

import { describeFetchError } from "@/lib/fetch-error";
import { useState } from "react";
import Modal from "./Modal";
import PassShape from "./PassShape";
import { CATEGORY_PALETTE } from "@/lib/categories";
import { dotClasses } from "@/lib/category-styles";
import { CATEGORY_ICON_KEYS, CATEGORY_ICON_LABEL_KEYS } from "@/lib/category-icons";
import { CATEGORY_ICON_COMPONENTS } from "@/lib/icons";
import { MEMBERSHIP_CODE_FORMATS, type MembershipCodeFormat } from "@/lib/memberships";
import {
  PASS_TEMPLATES,
  PASS_ZONES,
  TEMPLATE_FIELDS,
  TEMPLATE_LABEL_KEYS,
  defaultLayoutFor,
  type PassTemplate,
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
  const [icon, setIcon] = useState<string | null>(card?.icon ?? null);
  const [notes, setNotes] = useState(card?.notes ?? "");
  const [template, setTemplate] = useState<PassTemplate>(card?.template ?? "generic");
  const [fields, setFields] = useState<Record<string, string>>(card?.fields ?? {});
  const [layout, setLayout] = useState(card?.layout ?? defaultLayoutFor(template));
  const [editorMode, setEditorMode] = useState<"guided" | "custom">("guided");
  const [selectedFieldKey, setSelectedFieldKey] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoryIconLabels = Object.fromEntries(
    Object.entries(CATEGORY_ICON_LABEL_KEYS).map(([k, v]) => [k, t(v)]),
  ) as Record<string, string>;

  const templateFieldDefs = TEMPLATE_FIELDS[template];
  const fieldByKey = Object.fromEntries(templateFieldDefs.map((f) => [f.key, f]));
  const placedKeys = new Set(Object.values(layout).flat().filter((k): k is string => Boolean(k)));
  const unplacedKeys = templateFieldDefs.map((f) => f.key).filter((k) => !placedKeys.has(k));

  function handleTemplateChange(next: PassTemplate) {
    setTemplate(next);
    setFields({});
    setLayout(defaultLayoutFor(next));
    setSelectedFieldKey(null);
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const body = { name, codeValue, codeFormat, color, icon, notes: notes.trim() || null, template, fields, layout };
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
      onSaved(toMembershipCard(data.card as MembershipCardApiRow));
    } catch (err) {
      setError(describeFetchError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal onClose={onClose} title={isEdit ? t("membership.editTitle") : t("membership.addCard")}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="membershipName" className="mb-1.5 block text-sm font-semibold text-ink-soft">
            {t("membership.nameLabel")}
          </label>
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
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink-soft">{t("membership.templateLabel")}</label>
          <div className="flex flex-wrap gap-1.5">
            {PASS_TEMPLATES.map((tpl) => (
              <button
                key={tpl}
                type="button"
                onClick={() => handleTemplateChange(tpl)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  template === tpl
                    ? "border-navy bg-navy/10 text-navy dark:text-blue-300"
                    : "border-line text-ink-soft hover:bg-[var(--nav-hover-bg)]"
                }`}
              >
                {t(TEMPLATE_LABEL_KEYS[tpl])}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <label htmlFor="membershipCode" className="block text-sm font-semibold text-ink-soft">
              {t("membership.codeLabel")}
            </label>
            <button
              type="button"
              onClick={onScanRequested}
              className="text-xs font-semibold text-navy hover:underline dark:text-blue-300"
            >
              {t("membership.scanInstead")}
            </button>
          </div>
          <input
            id="membershipCode"
            type="text"
            required
            value={codeValue}
            onChange={(e) => setCodeValue(e.target.value)}
            placeholder={t("membership.codePlaceholder")}
            className="w-full rounded-card border border-line bg-bg-soft px-3.5 py-2.5 text-base text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink-soft">{t("membership.formatLabel")}</label>
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

        {templateFieldDefs.length > 0 && (
          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <label className="block text-sm font-semibold text-ink-soft">{t(TEMPLATE_LABEL_KEYS[template])}</label>
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
            </div>

            {editorMode === "guided" ? (
              <div className="space-y-3">
                {templateFieldDefs.map((def) => (
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
              <div className="space-y-3 rounded-card border border-line p-3">
                {PASS_ZONES.map((zone) => {
                  if (!templateFieldDefs.some((f) => f.zone === zone)) return null;
                  const placed = (layout[zone] ?? []).filter((k): k is string => Boolean(k));
                  return (
                    <div key={zone}>
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
                        {t(ZONE_LABEL_KEYS[zone])}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {placed.map((key) => {
                          const def = fieldByKey[key];
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => unplaceField(zone, key)}
                              className="rounded-full border border-navy bg-navy/10 px-3 py-1.5 text-xs font-semibold text-navy dark:text-blue-300"
                            >
                              {def ? t(def.labelKey) : key} ×
                            </button>
                          );
                        })}
                        <button
                          type="button"
                          onClick={() => placeField(zone)}
                          disabled={!selectedFieldKey}
                          aria-label={t("membership.addFieldHere")}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-line text-ink-soft transition hover:bg-[var(--nav-hover-bg)] disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}

                {unplacedKeys.length > 0 && (
                  <div className="border-t border-line pt-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">{t("membership.availableFields")}</p>
                    <p className="mb-1.5 text-[11px] text-ink-soft">{t("membership.tapFieldHint")}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {unplacedKeys.map((key) => {
                        const def = fieldByKey[key];
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setSelectedFieldKey(key)}
                            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                              selectedFieldKey === key
                                ? "border-navy bg-navy text-white"
                                : "border-line text-ink-soft hover:bg-[var(--nav-hover-bg)]"
                            }`}
                          >
                            {def ? t(def.labelKey) : key}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {placedKeys.size > 0 && (
                  <div className="space-y-2.5 border-t border-line pt-3">
                    {templateFieldDefs
                      .filter((def) => placedKeys.has(def.key))
                      .map((def) => (
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
                )}
              </div>
            )}
          </div>
        )}

        {codeValue && (
          <div>
            <p className="mb-1.5 text-sm font-semibold text-ink-soft">{t("membership.previewLabel")}</p>
            <div className="pointer-events-none">
              <PassShape
                name={name || t("membership.namePlaceholder")}
                color={color}
                icon={icon}
                template={template}
                fields={fields}
                layout={layout}
                codeValue={codeValue}
                codeFormat={codeFormat}
                codeSize="small"
              />
            </div>
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink-soft">{t("membership.colorLabel")}</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-label={c}
                className={`h-8 w-8 rounded-full transition ${dotClasses(c)} ${
                  color === c ? "ring-2 ring-navy ring-offset-2 ring-offset-surface" : ""
                }`}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink-soft">{t("membership.iconLabel")}</label>
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

        <div>
          <label htmlFor="membershipNotes" className="mb-1.5 block text-sm font-semibold text-ink-soft">
            {t("membership.notesLabel")}
          </label>
          <textarea
            id="membershipNotes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t("membership.notesPlaceholder")}
            className="w-full resize-none rounded-card border border-line bg-bg-soft px-3.5 py-2.5 text-base text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
          />
        </div>

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
            {submitting ? t("common.saving") : isEdit ? t("form.saveChanges") : t("membership.addCard")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
