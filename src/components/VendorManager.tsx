"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { describeFetchError } from "@/lib/fetch-error";
import { formatCurrency, formatDateLong } from "@/lib/format";
import { useCurrency } from "@/lib/currency-context";
import { EditIcon } from "@/lib/icons";
import { useT, useLanguage } from "@/lib/language-context";
import type { VendorStat } from "@/lib/db";

type SortMode = "mostUsed" | "alphabetical" | "recent" | "highestSpend";

function sortVendors(vendors: VendorStat[], mode: SortMode): VendorStat[] {
  const sorted = [...vendors];
  switch (mode) {
    case "mostUsed":
      return sorted.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    case "alphabetical":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case "recent":
      return sorted.sort((a, b) => (a.lastUsed < b.lastUsed ? 1 : a.lastUsed > b.lastUsed ? -1 : 0));
    case "highestSpend":
      return sorted.sort((a, b) => b.totalSpent - a.totalSpent || a.name.localeCompare(b.name));
  }
}

// Settings-level view of every merchant the user has ever logged — lets
// them jump into that vendor's transactions (via Activities' vendor
// filter, see ActivitiesView) and fix a misspelled/inconsistent name from
// one place, rather than only discovering it while scrolling Activities.
export default function VendorManager() {
  const t = useT();
  const language = useLanguage();
  const router = useRouter();
  const currency = useCurrency();
  const [vendors, setVendors] = useState<VendorStat[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("mostUsed");
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/vendors", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Could not load."))))
      .then((data) => {
        if (!cancelled) setVendors(Array.isArray(data.vendors) ? data.vendors : []);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(describeFetchError(err));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const sorted = useMemo(() => (vendors ? sortVendors(vendors, sortMode) : []), [vendors, sortMode]);

  function startEdit(vendor: VendorStat) {
    setEditing(vendor.name);
    setDraft(vendor.name);
    setActionError(null);
  }

  async function saveRename(oldName: string) {
    const newName = draft.trim();
    if (!newName || newName === oldName) {
      setEditing(null);
      return;
    }
    setBusy(true);
    setActionError(null);
    try {
      const res = await fetch("/api/vendors", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldName, newName }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionError(typeof data.error === "string" ? data.error : "Could not rename that vendor.");
        return;
      }
      // Renaming onto an existing vendor's name merges the two — combine
      // their stats into one row rather than leaving a stale duplicate.
      setVendors((prev) => {
        if (!prev) return prev;
        const merged = new Map<string, VendorStat>();
        for (const v of prev) {
          const key = v.name === oldName ? newName : v.name;
          const existing = merged.get(key);
          merged.set(
            key,
            existing
              ? {
                  name: key,
                  count: existing.count + v.count,
                  totalSpent: existing.totalSpent + v.totalSpent,
                  lastUsed: existing.lastUsed > v.lastUsed ? existing.lastUsed : v.lastUsed,
                }
              : { ...v, name: key },
          );
        }
        return Array.from(merged.values());
      });
      setEditing(null);
    } catch (err) {
      setActionError(describeFetchError(err));
    } finally {
      setBusy(false);
    }
  }

  if (loadError) {
    return <p className="text-sm text-red-600 dark:text-red-400">{loadError}</p>;
  }

  if (!vendors) {
    return <p className="text-sm text-ink-soft">{t("common.loading")}</p>;
  }

  if (vendors.length === 0) {
    return <p className="text-sm text-ink-soft">{t("vendors.noVendorsYet")}</p>;
  }

  const sortOptions: { value: SortMode; label: string }[] = [
    { value: "mostUsed", label: t("vendors.sortMostUsed") },
    { value: "recent", label: t("vendors.sortRecent") },
    { value: "highestSpend", label: t("vendors.sortHighestSpend") },
    { value: "alphabetical", label: t("vendors.sortAlphabetical") },
  ];

  return (
    <div>
      {actionError && <p className="mb-3 text-sm text-red-600 dark:text-red-400">{actionError}</p>}

      <div className="mb-3 flex items-center gap-2">
        <label className="text-xs font-semibold text-ink-soft">{t("vendors.sortLabel")}</label>
        <select
          value={sortMode}
          onChange={(e) => setSortMode(e.target.value as SortMode)}
          className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm text-foreground outline-none focus:border-navy focus:ring-2 focus:ring-navy/20"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-card border border-line bg-surface">
        {sorted.map((vendor, i) => (
          <div
            key={vendor.name}
            className={`flex items-center justify-between gap-3 px-4 py-3 ${
              i === sorted.length - 1 ? "" : "border-b border-line"
            }`}
          >
            {editing === vendor.name ? (
              <>
                <input
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveRename(vendor.name);
                    if (e.key === "Escape") setEditing(null);
                  }}
                  maxLength={120}
                  className="min-w-0 flex-1 rounded-full border border-line bg-bg-soft px-3 py-1.5 text-sm text-foreground outline-none focus:border-navy focus:ring-2 focus:ring-navy/20"
                />
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => setEditing(null)}
                    className="rounded-full px-3 py-1.5 text-xs font-semibold text-ink-soft transition hover:bg-[var(--nav-hover-bg)]"
                  >
                    {t("common.cancel")}
                  </button>
                  <button
                    onClick={() => saveRename(vendor.name)}
                    disabled={busy}
                    className="rounded-full bg-navy px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-navy-dark disabled:opacity-60"
                  >
                    {t("common.save")}
                  </button>
                </div>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => router.push(`/?vendor=${encodeURIComponent(vendor.name)}`)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="truncate font-medium text-foreground">{vendor.name}</p>
                  <p className="truncate text-xs text-ink-soft">
                    {vendor.count} {t("tag.transaction")}
                    {language === "en" && vendor.count !== 1 ? "s" : ""}
                    {" · "}
                    {formatCurrency(vendor.totalSpent, currency)} {t("vendors.totalSpent").toLowerCase()}
                    {" · "}
                    {t("vendors.lastUsed")} {formatDateLong(vendor.lastUsed)}
                  </p>
                </button>
                <button
                  onClick={() => startEdit(vendor)}
                  aria-label={`Rename ${vendor.name}`}
                  className="shrink-0 rounded-full p-2 text-ink-soft transition hover:bg-[var(--nav-hover-bg)] hover:text-foreground"
                >
                  <EditIcon className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
