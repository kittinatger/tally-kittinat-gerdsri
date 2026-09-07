"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { describeFetchError } from "@/lib/fetch-error";
import { formatCurrency, formatDateLong } from "@/lib/format";
import { useCurrency } from "@/lib/currency-context";
import { badgeClasses, hashNameToColor } from "@/lib/category-styles";
import { WIDGET_ACCENTS } from "@/lib/dashboard-widgets";
import { EditIcon } from "@/lib/icons";
import EmptyState from "./EmptyState";
import ManagerHeader from "./ManagerHeader";
import { useT, useLanguage } from "@/lib/language-context";
import type { VendorStat } from "@/lib/db";

// Same glyph as SettingsNavList's own StoreIcon — kept as its own local
// copy rather than a shared export since every icon in this codebase is
// defined per-file by convention (see e.g. WalletCardShape/ExpenseRow's
// own ShareIcon).
function StoreIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
      <path d="M3 7.5 4 3h12l1 4.5" />
      <path d="M3 7.5a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0" />
      <path d="M4 8v8.5h12V8" />
      <path d="M8 16.5V12h4v4.5" />
    </svg>
  );
}

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

// Deterministic per-vendor accent color (same palette and hash FriendsManager/
// SplitBillManager/ChallengesManager use for avatars, so the same name lands
// on the same color family everywhere it's shown) — purely cosmetic, so two
// vendors with similar names still land on different colors most of the time
// without needing any real per-vendor color to be stored anywhere.
function avatarColor(name: string) {
  return hashNameToColor(name, WIDGET_ACCENTS);
}

function mergeVendorRows(rows: VendorStat[], oldName: string, newName: string): VendorStat[] {
  const merged = new Map<string, VendorStat>();
  for (const v of rows) {
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
}

// Settings-level view of every merchant the user has ever logged — lets
// them jump into that vendor's transactions (via Activities' vendor
// filter, see ActivitiesView), fix a single misspelled name inline, or
// select several inconsistent spellings of the same vendor at once and
// merge them onto one in a single action.
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

  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [mergeTarget, setMergeTarget] = useState("");

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
  const selectedVendors = useMemo(() => sorted.filter((v) => selected.has(v.name)), [sorted, selected]);

  // The merge target dropdown must always point at one of the currently
  // selected vendors — re-pick (most-used of the selection) whenever the
  // selection itself changes, rather than letting a stale target from a
  // previous selection silently carry over.
  useEffect(() => {
    if (selectedVendors.length === 0) {
      setMergeTarget("");
      return;
    }
    if (!selectedVendors.some((v) => v.name === mergeTarget)) {
      setMergeTarget([...selectedVendors].sort((a, b) => b.count - a.count)[0].name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-derive when the selection changes
  }, [selectedVendors]);

  function toggleSelectMode() {
    setSelectMode((v) => !v);
    setSelected(new Set());
    setActionError(null);
  }

  function toggleSelected(name: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function startEdit(vendor: VendorStat) {
    setEditing(vendor.name);
    setDraft(vendor.name);
    setActionError(null);
  }

  async function renameOnServer(oldName: string, newName: string): Promise<boolean> {
    const res = await fetch("/api/vendors", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldName, newName }),
    });
    return res.ok;
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
      const ok = await renameOnServer(oldName, newName);
      if (!ok) {
        setActionError(t("vendors.couldNotRename"));
        return;
      }
      setVendors((prev) => (prev ? mergeVendorRows(prev, oldName, newName) : prev));
      setEditing(null);
    } catch (err) {
      setActionError(describeFetchError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleMergeSelected() {
    const target = mergeTarget.trim();
    if (!target) return;
    const others = selectedVendors.filter((v) => v.name !== target);
    if (others.length === 0) return;
    setBusy(true);
    setActionError(null);
    let failed = 0;
    let nextVendors = vendors ?? [];
    for (const v of others) {
      try {
        const ok = await renameOnServer(v.name, target);
        if (ok) nextVendors = mergeVendorRows(nextVendors, v.name, target);
        else failed++;
      } catch {
        failed++;
      }
    }
    setVendors(nextVendors);
    if (failed > 0) {
      setActionError(t("vendors.couldNotMergeSome"));
    } else {
      setSelected(new Set());
      setSelectMode(false);
    }
    setBusy(false);
  }

  if (loadError) {
    return (
      <div>
        <ManagerHeader title={t("settings.vendors")} />
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">{loadError}</p>
      </div>
    );
  }

  if (!vendors) {
    return (
      <div>
        <ManagerHeader title={t("settings.vendors")} />
        <p className="mt-4 text-sm text-ink-soft">{t("common.loading")}</p>
      </div>
    );
  }

  if (vendors.length === 0) {
    return (
      <div>
        <ManagerHeader title={t("settings.vendors")} />
        <div className="mt-4">
          <EmptyState icon={<StoreIcon />} text={t("vendors.noVendorsYet")} />
        </div>
      </div>
    );
  }

  const sortOptions: { value: SortMode; label: string }[] = [
    { value: "mostUsed", label: t("vendors.sortMostUsed") },
    { value: "recent", label: t("vendors.sortRecent") },
    { value: "highestSpend", label: t("vendors.sortHighestSpend") },
    { value: "alphabetical", label: t("vendors.sortAlphabetical") },
  ];

  return (
    <div>
      <ManagerHeader title={t("settings.vendors")} />
      {actionError && <p className="mt-3 text-sm text-red-600 dark:text-red-400 animate-[fade-in_0.15s_ease-out] motion-reduce:animate-none">{actionError}</p>}

      <div className="mt-4 mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
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
        <button
          type="button"
          onClick={toggleSelectMode}
          className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
            selectMode ? "border-navy bg-navy/10 text-navy dark:text-blue-300" : "border-line text-foreground hover:bg-bg-soft"
          }`}
        >
          {selectMode ? t("common.cancel") : t("activities.select")}
        </button>
      </div>

      {selectMode && selected.size >= 2 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-card border border-navy/30 bg-navy/5 p-3">
          <span className="text-xs font-semibold text-ink-soft">
            {selected.size} {t("vendors.selectedCount")}
          </span>
          <label className="text-xs font-semibold text-ink-soft">{t("vendors.mergeInto")}</label>
          <select
            value={mergeTarget}
            onChange={(e) => setMergeTarget(e.target.value)}
            className="min-w-0 flex-1 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-foreground outline-none focus:border-navy focus:ring-2 focus:ring-navy/20"
          >
            {selectedVendors.map((v) => (
              <option key={v.name} value={v.name}>
                {v.name} ({v.count})
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleMergeSelected}
            disabled={busy}
            className="shrink-0 rounded-full bg-navy px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-navy-dark active:scale-[0.97] disabled:opacity-60"
          >
            {busy ? t("common.saving") : t("activities.mergeMerchantsButton")}
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-card border border-line bg-surface">
        {sorted.map((vendor, i) => {
          const isSelected = selected.has(vendor.name);
          return (
            <div
              key={vendor.name}
              className={`flex items-center gap-3 px-4 py-3 ${i === sorted.length - 1 ? "" : "border-b border-line"} ${
                isSelected ? "bg-[var(--nav-hover-bg)]" : ""
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
                      className="rounded-full bg-navy px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-navy-dark active:scale-[0.97] disabled:opacity-60"
                    >
                      {t("common.save")}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {selectMode && (
                    <button
                      type="button"
                      onClick={() => toggleSelected(vendor.name)}
                      aria-label={vendor.name}
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                        isSelected ? "border-navy bg-navy text-white" : "border-line"
                      }`}
                    >
                      {isSelected && (
                        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                          <path d="M4 10l4 4 8-8" />
                        </svg>
                      )}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      selectMode ? toggleSelected(vendor.name) : router.push(`/?vendor=${encodeURIComponent(vendor.name)}`)
                    }
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${badgeClasses(avatarColor(vendor.name))}`}
                    >
                      {vendor.name.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{vendor.name}</p>
                      <p className="truncate text-xs text-ink-soft">
                        {vendor.count} {t("tag.transaction")}
                        {language === "en" && vendor.count !== 1 ? "s" : ""}
                        {" · "}
                        {formatCurrency(vendor.totalSpent, currency)} {t("vendors.totalSpent").toLowerCase()}
                        {" · "}
                        {t("vendors.lastUsed")} {formatDateLong(vendor.lastUsed)}
                      </p>
                    </div>
                  </button>
                  {!selectMode && (
                    <button
                      onClick={() => startEdit(vendor)}
                      aria-label={`Rename ${vendor.name}`}
                      className="shrink-0 rounded-full p-2 text-ink-soft transition hover:bg-[var(--nav-hover-bg)] hover:text-foreground"
                    >
                      <EditIcon className="h-4 w-4" />
                    </button>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
