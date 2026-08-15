"use client";

import { describeFetchError } from "@/lib/fetch-error";
import { useEffect, useState } from "react";
import { DEFAULT_LANGUAGE } from "@/lib/languages";
import LanguageDropdown from "./LanguageDropdown";

export default function LanguageSettings() {
  const [saved, setSaved] = useState(DEFAULT_LANGUAGE);
  const [selected, setSelected] = useState(DEFAULT_LANGUAGE);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (typeof data.language === "string") {
          setSaved(data.language);
          setSelected(data.language);
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSave() {
    if (selected === saved) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: selected }),
      });
      if (!res.ok) {
        setError("Could not save language.");
        setSaving(false);
        return;
      }
      // A full reload (not router.refresh()) so that once translated
      // surfaces exist, switching language visibly and immediately takes
      // effect everywhere, not just in re-fetched server data.
      window.location.reload();
    } catch (err) {
      setError(describeFetchError(err));
      setSaving(false);
    }
  }

  const dirty = selected !== saved;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-1 px-1 text-xs font-semibold uppercase tracking-wide text-ink-soft">Display language</h3>
        <p className="mb-3 px-1 text-[11px] leading-snug text-ink-soft">
          Starting with the world&apos;s most-spoken languages, plus Thai. Translation is being added
          surface-by-surface — screens not yet translated stay in English until they are.
        </p>
        <div className="rounded-card border border-line bg-surface p-4">
          <LanguageDropdown value={selected} onChange={setSelected} disabled={!loaded || saving} />
          <button
            type="button"
            onClick={handleSave}
            disabled={!dirty || saving}
            className="mt-3 w-full rounded-xl bg-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-navy-dark disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            {saving ? "Saving…" : "Save language"}
          </button>
          {error && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{error}</p>}
        </div>
      </div>
    </div>
  );
}
