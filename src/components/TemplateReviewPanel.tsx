"use client";

import { useEffect, useState } from "react";
import { cardBackgroundStyle } from "@/lib/card-backgrounds";
import { heroGradientClasses, colorHeroStyle } from "@/lib/category-styles";
import { describeFetchError } from "@/lib/fetch-error";
import { CheckCircleIcon, XCircleIcon, EditIcon } from "@/lib/icons";
import { NAME_POSITION_LABEL_KEYS } from "@/lib/name-position";
import { useT } from "@/lib/language-context";
import TemplateEditModal from "./TemplateEditModal";
import type { CardTemplateOption } from "@/types/card-template";

const STATUS_BADGE_CLASSES: Record<CardTemplateOption["status"], string> = {
  pending: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  approved: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  rejected: "bg-red-500/15 text-red-700 dark:text-red-400",
};

// Admin-only (the route itself 403s anyone else — see
// /api/card-templates?status=all) page to view, edit, or permanently
// remove every submitted "premade card" template regardless of status —
// not just the pending queue. Quick approve/reject stay one tap for the
// common case; the pencil opens the full editor (TemplateEditModal) for
// anything else, including changing a template's look after the fact or
// moving it back out of approved.
export default function TemplateReviewPanel() {
  const t = useT();
  const [templates, setTemplates] = useState<CardTemplateOption[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<number | null>(null);
  const [editing, setEditing] = useState<CardTemplateOption | null>(null);

  function load() {
    fetch("/api/card-templates?status=all", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Could not load."))))
      .then((data) => setTemplates(data.templates))
      .catch((err) => setError(describeFetchError(err)));
  }

  useEffect(load, []);

  async function review(id: number, status: "approved" | "rejected") {
    setActingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/card-templates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not save.");
        return;
      }
      setTemplates((prev) => prev?.map((tpl) => (tpl.id === id ? data.template : tpl)) ?? null);
    } catch (err) {
      setError(describeFetchError(err));
    } finally {
      setActingId(null);
    }
  }

  // A short "Forces: X off, Y on" line so the admin can see what a
  // template does to a picker's toggles at a glance — null fields (the
  // common case: no forced toggles at all) are skipped entirely, so this
  // returns "" for a plain-look template.
  function forcedSummary(tpl: CardTemplateOption): string {
    const entries: [boolean | null, string][] = [
      [tpl.forceShowName, t("wallet.showNameOnCardLabel")],
      [tpl.forceShowNetworkBadge, t("wallet.showNetworkBadgeLabel")],
      [tpl.forceShowChip, t("wallet.showChipLabel")],
      [tpl.forceShowCardNumber, t("wallet.showCardNumberLabel")],
      [tpl.forceShowBalance, t("wallet.showBalanceOnCardLabel")],
      [tpl.forceShowCurrency, t("wallet.showCurrencyOnCardLabel")],
    ];
    const parts = entries
      .filter(([value]) => value !== null)
      .map(([value, label]) => `${label}: ${value ? t("wallet.forceOn") : t("wallet.forceOff")}`);
    if (tpl.forceCurrency !== null) parts.push(`${t("wallet.lockCurrencyLabel")}: ${tpl.forceCurrency}`);
    if (tpl.forceNamePosition !== null) parts.push(`${t("wallet.namePositionLabel")}: ${t(NAME_POSITION_LABEL_KEYS[tpl.forceNamePosition])}`);
    if (tpl.lockTextColor) parts.push(t("wallet.lockTextColorLabel"));
    return parts.length ? parts.join(", ") : "";
  }

  return (
    <div>
      <h2 className="mb-5 font-display text-2xl text-foreground">{t("wallet.templateReviewTitle")}</h2>

      {error && <p className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {templates === null ? (
        <p className="text-sm text-ink-soft">{t("common.loading")}</p>
      ) : templates.length === 0 ? (
        <p className="text-sm text-ink-soft">{t("wallet.noTemplatesToReview")}</p>
      ) : (
        <div className="space-y-3">
          {templates.map((tpl) => (
            <div key={tpl.id} className="flex items-center gap-3 rounded-card border border-line bg-surface p-3">
              <span
                className={`h-14 w-24 shrink-0 rounded-lg border border-line shadow-sm ${tpl.background ? "" : heroGradientClasses(tpl.color)}`}
                style={tpl.background ? cardBackgroundStyle(tpl.background) : colorHeroStyle(tpl.color)}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-semibold text-foreground">{tpl.name}</p>
                  <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold capitalize ${STATUS_BADGE_CLASSES[tpl.status]}`}>
                    {tpl.status}
                  </span>
                </div>
                <p className="truncate text-xs text-ink-soft">
                  {tpl.submittedByUsername ?? t("wallet.unknownSubmitter")}
                  {tpl.country ? ` · ${tpl.country}` : ""}
                </p>
                {forcedSummary(tpl) && <p className="truncate text-[11px] text-ink-soft">{forcedSummary(tpl)}</p>}
              </div>
              {tpl.status === "pending" && (
                <>
                  <button
                    type="button"
                    onClick={() => review(tpl.id, "approved")}
                    disabled={actingId === tpl.id}
                    aria-label={t("wallet.approveTemplate")}
                    title={t("wallet.approveTemplate")}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line text-emerald-600 transition hover:bg-emerald-500/10 disabled:opacity-60 dark:text-emerald-400"
                  >
                    <CheckCircleIcon className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => review(tpl.id, "rejected")}
                    disabled={actingId === tpl.id}
                    aria-label={t("wallet.rejectTemplate")}
                    title={t("wallet.rejectTemplate")}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line text-red-600 transition hover:bg-red-500/10 disabled:opacity-60 dark:text-red-400"
                  >
                    <XCircleIcon className="h-5 w-5" />
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setEditing(tpl)}
                aria-label={t("common.edit")}
                title={t("common.edit")}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line text-ink-soft transition hover:bg-[var(--nav-hover-bg)] hover:text-foreground"
              >
                <EditIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <TemplateEditModal
          template={editing}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            setTemplates((prev) => prev?.map((tpl) => (tpl.id === updated.id ? updated : tpl)) ?? null);
            setEditing(null);
          }}
          onDeleted={(id) => {
            setTemplates((prev) => prev?.filter((tpl) => tpl.id !== id) ?? null);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
