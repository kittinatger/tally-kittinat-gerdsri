"use client";

import { describeFetchError } from "@/lib/fetch-error";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_LANGUAGE } from "@/lib/languages";
import LanguageDropdown from "./LanguageDropdown";

export default function LanguageSettings() {
  const router = useRouter();
  const [language, setLanguageState] = useState(DEFAULT_LANGUAGE);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (typeof data.language === "string") setLanguageState(data.language);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleChange(code: string) {
    if (code === language) return;
    const previous = language;
    setLanguageState(code);
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: code }),
      });
      if (!res.ok) {
        setLanguageState(previous);
        setError("Could not save language.");
        return;
      }
      router.refresh();
    } catch (err) {
      setLanguageState(previous);
      setError(describeFetchError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-1 px-1 text-xs font-semibold uppercase tracking-wide text-ink-soft">Display language</h3>
        <p className="mb-3 px-1 text-[11px] leading-snug text-ink-soft">
          Starting with the world&apos;s most-spoken languages, plus Thai. Translation is being added
          surface-by-surface — screens not yet translated stay in English until they are.
        </p>
        <div className="rounded-card border border-line bg-surface p-4">
          <LanguageDropdown value={language} onChange={handleChange} disabled={!loaded || saving} />
          {error && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{error}</p>}
        </div>
      </div>
    </div>
  );
}
