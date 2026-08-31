"use client";

import { useEffect, useState } from "react";
import { describeFetchError } from "@/lib/fetch-error";
import { MODEL, LITE_MODEL, IMAGE_MODEL } from "@/lib/gemini-models";
import { useT } from "@/lib/language-context";

type Usage = { used: number; limit: number };

const FEATURES: { labelKey: "ai.featureScan" | "ai.featureVoice" | "ai.featureAssistant" | "ai.featurePattern"; model: string; fallback: boolean }[] = [
  { labelKey: "ai.featureScan", model: MODEL, fallback: true },
  { labelKey: "ai.featureVoice", model: MODEL, fallback: true },
  { labelKey: "ai.featureAssistant", model: MODEL, fallback: true },
  { labelKey: "ai.featurePattern", model: IMAGE_MODEL, fallback: false },
];

export default function AiUsagePanel() {
  const t = useT();
  const [usage, setUsage] = useState<Usage | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/gemini-usage")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("failed"))))
      .then((data) => {
        if (!cancelled && typeof data.used === "number" && typeof data.limit === "number") {
          setUsage({ used: data.used, limit: data.limit });
        }
      })
      .catch((err) => {
        if (!cancelled) setError(describeFetchError(err));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const pct = usage ? Math.min(100, Math.round((usage.used / usage.limit) * 100)) : 0;

  return (
    <div className="flex flex-col gap-6">
      <h3 className="font-display text-2xl text-foreground">{t("ai.usageTitle")}</h3>

      <section className="rounded-card border border-line bg-surface p-4">
        <h4 className="text-sm font-semibold text-foreground">{t("ai.usageTodayLabel")}</h4>
        {error ? (
          <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>
        ) : usage ? (
          <>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {usage.used} <span className="text-sm font-normal text-ink-soft">/ {usage.limit}</span>
            </p>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-bg-soft">
              <div className="h-full rounded-full bg-navy transition-all" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-2 text-[11px] leading-snug text-ink-soft">{t("ai.usageDescription")}</p>
          </>
        ) : (
          <p className="mt-2 text-xs text-ink-soft">{t("common.loading")}</p>
        )}
      </section>

      <section className="rounded-card border border-line bg-surface p-4">
        <h4 className="text-sm font-semibold text-foreground">{t("ai.modelsTitle")}</h4>
        <p className="mt-1 text-xs leading-snug text-ink-soft">{t("ai.modelsDescription")}</p>
        <div className="mt-3 divide-y divide-line overflow-hidden rounded-card border border-line">
          {FEATURES.map((f) => (
            <div key={f.labelKey} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
              <span className="text-sm text-foreground">{t(f.labelKey)}</span>
              <span className="text-right text-[11px] text-ink-soft">
                <span className="font-mono">{f.model}</span>
                {f.fallback && (
                  <>
                    <br />
                    {t("ai.fallbackHint")} <span className="font-mono">{LITE_MODEL}</span>
                  </>
                )}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] leading-snug text-ink-soft">{t("ai.fallbackExplainer")}</p>
      </section>
    </div>
  );
}
