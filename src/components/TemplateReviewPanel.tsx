"use client";

import { useEffect, useState } from "react";
import { cardBackgroundStyle } from "@/lib/card-backgrounds";
import { heroGradientClasses, colorHeroStyle } from "@/lib/category-styles";
import { describeFetchError } from "@/lib/fetch-error";
import { CheckCircleIcon, XCircleIcon } from "@/lib/icons";
import { useT } from "@/lib/language-context";
import type { CardTemplateOption } from "@/types/card-template";

// Admin-only (the route itself 403s anyone else — see
// /api/card-templates?status=pending) review queue for user-submitted
// "premade card" designs. Approve makes it selectable by everyone via
// PremadeCardPicker; reject just removes it from the queue, no
// notification back to the submitter (out of scope for a personal app
// with one reviewer).
export default function TemplateReviewPanel() {
  const t = useT();
  const [templates, setTemplates] = useState<CardTemplateOption[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<number | null>(null);

  function load() {
    fetch("/api/card-templates?status=pending", { cache: "no-store" })
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
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(typeof data?.error === "string" ? data.error : "Could not save.");
        return;
      }
      setTemplates((prev) => prev?.filter((tpl) => tpl.id !== id) ?? null);
    } catch (err) {
      setError(describeFetchError(err));
    } finally {
      setActingId(null);
    }
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
                <p className="truncate text-sm font-semibold text-foreground">{tpl.name}</p>
                <p className="truncate text-xs text-ink-soft">
                  {tpl.submittedByUsername ?? t("wallet.unknownSubmitter")}
                </p>
              </div>
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
