"use client";

import { useEffect, useState } from "react";
import { cardBackgroundStyle } from "@/lib/card-backgrounds";
import { heroGradientClasses, colorHeroStyle } from "@/lib/category-styles";
import { describeFetchError } from "@/lib/fetch-error";
import { CheckCircleIcon, XCircleIcon, TrashIcon } from "@/lib/icons";
import { KIND_LABEL_KEYS } from "@/lib/membership-templates";
import { PASS_TEMPLATE_CATEGORY_LABEL_KEYS } from "@/lib/pass-template-category";
import { useT } from "@/lib/language-context";
import type { PassTemplateOption } from "@/types/pass-template";

const STATUS_BADGE_CLASSES: Record<PassTemplateOption["status"], string> = {
  pending: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  approved: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  rejected: "bg-red-500/15 text-red-700 dark:text-red-400",
};

// Admin-only (the route itself 403s anyone else — see
// /api/pass-templates?status=all) page to review every submitted "premade
// pass" template. Simpler than TemplateReviewPanel (card templates): a
// pass template's shape is small enough (no full force-toggle grid) that
// there's no separate full-edit modal — just approve/reject and, for
// anything not worth keeping, permanent removal.
export default function PassTemplateReviewPanel() {
  const t = useT();
  const [templates, setTemplates] = useState<PassTemplateOption[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<number | null>(null);

  function load() {
    fetch("/api/pass-templates?status=all", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Could not load."))))
      .then((data) => setTemplates(data.templates))
      .catch((err) => setError(describeFetchError(err)));
  }

  useEffect(load, []);

  async function review(id: number, status: "approved" | "rejected") {
    setActingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/pass-templates/${id}`, {
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

  async function remove(id: number) {
    setActingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/pass-templates/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(typeof data?.error === "string" ? data.error : "Could not remove.");
        return;
      }
      setTemplates((prev) => prev?.filter((tpl) => tpl.id !== id) ?? null);
    } catch (err) {
      setError(describeFetchError(err));
    } finally {
      setActingId(null);
    }
  }

  function forcedSummary(tpl: PassTemplateOption): string {
    const entries: [boolean | null, string][] = [
      [tpl.forceShowName, t("membership.showNameOnCardLabel")],
      [tpl.forceShowLogo, t("membership.showLogoOnCardLabel")],
    ];
    const parts = entries
      .filter(([value]) => value !== null)
      .map(([value, label]) => `${label}: ${value ? t("wallet.forceOn") : t("wallet.forceOff")}`);
    if (tpl.lockTextColor) parts.push(t("wallet.lockTextColorLabel"));
    return parts.length ? parts.join(", ") : "";
  }

  return (
    <div>
      <h2 className="mb-5 font-display text-2xl text-foreground">{t("membership.passTemplateReviewTitle")}</h2>

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
                  {` · ${t(KIND_LABEL_KEYS[tpl.kind])}`}
                  {tpl.category ? ` · ${t(PASS_TEMPLATE_CATEGORY_LABEL_KEYS[tpl.category])}` : ""}
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
                onClick={() => remove(tpl.id)}
                disabled={actingId === tpl.id}
                aria-label={t("common.delete")}
                title={t("common.delete")}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line text-ink-soft transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-60 dark:hover:bg-red-900/20 dark:hover:text-red-400"
              >
                <TrashIcon />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
