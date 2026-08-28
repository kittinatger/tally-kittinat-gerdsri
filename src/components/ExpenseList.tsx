"use client";

import { useMemo, useState } from "react";
import { signedAmount, type Expense } from "@/types/expense";
import type { TransactionType } from "@/lib/categories";
import { monthKey, monthLabel, formatCurrency, formatAmountRaw, todayInputValue } from "@/lib/format";
import { useAllCategories } from "@/lib/categories-context";
import { useWallets } from "@/lib/wallets-context";
import { useCurrency } from "@/lib/currency-context";
import { badgeClasses } from "@/lib/category-styles";
import { useT, useLanguage } from "@/lib/language-context";
import { mutateFetch } from "@/lib/offline/fetch-wrapper";
import ExpenseRow from "./ExpenseRow";
import SplitExpenseGroup from "./SplitExpenseGroup";
import FilterDropdown from "./FilterDropdown";
import DateRangeFilter from "./DateRangeFilter";
import Modal from "./Modal";

export type TypeFilter = "all" | TransactionType;

function DownloadIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M10 3v9.5M6 9l4 4 4-4" />
      <path d="M4 15.5h12" />
    </svg>
  );
}

function SelectCheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <rect x="3" y="3" width="14" height="14" rx="4" />
      <path d="M6.5 10l2.5 2.5 4.5-5" />
    </svg>
  );
}

type DisplayRow = { kind: "single"; expense: Expense } | { kind: "split"; groupId: string; items: Expense[] };

// Splits share a split_group_id purely for display grouping (see
// createSplitExpense) — collapses each group into one row here, in the
// list's normal sort order, rather than showing every line separately.
function buildDisplayRows(items: Expense[]): DisplayRow[] {
  const seen = new Set<string>();
  const rows: DisplayRow[] = [];
  for (const e of items) {
    if (e.splitGroupId) {
      if (seen.has(e.splitGroupId)) continue;
      seen.add(e.splitGroupId);
      rows.push({ kind: "split", groupId: e.splitGroupId, items: items.filter((x) => x.splitGroupId === e.splitGroupId) });
    } else {
      rows.push({ kind: "single", expense: e });
    }
  }
  return rows;
}

export default function ExpenseList({
  expenses,
  onSelect,
  onEdit,
  onBulkDeleted,
  onBulkUpdated,
  typeFilter,
  onTypeFilterChange,
  walletFilter,
  onWalletFilterChange,
}: {
  expenses: Expense[];
  onSelect: (expense: Expense) => void;
  /** Enables the sm:+ hover-revealed Edit button on each row (desktop
   * quick-edit, bypassing the detail view/modal). */
  onEdit?: (expense: Expense) => void;
  onBulkDeleted: (ids: number[]) => void;
  onBulkUpdated: (expenses: Expense[]) => void;
  /** Controlled from ActivitiesView so the balance card's Expense/Income/
   * Transfer buttons can drive the same type filter as the segmented
   * control below. */
  typeFilter: TypeFilter;
  onTypeFilterChange: (type: TypeFilter) => void;
  /** Controlled from ActivitiesView so the balance card's wallet-scope
   * selector drives the same wallet filter as the dropdown below. */
  walletFilter: string;
  onWalletFilterChange: (wallet: string) => void;
}) {
  const t = useT();
  const language = useLanguage();
  const allCategories = useAllCategories();
  const wallets = useWallets();
  const currency = useCurrency();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  // Tracks which single expense row (if any) currently has its swipe
  // Share/Delete panel open, so opening one row always closes any other —
  // otherwise each row's swipe state was fully independent and two rows
  // could show their action panels open at the same time.
  const [openRowId, setOpenRowId] = useState<number | null>(null);

  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkTagInput, setBulkTagInput] = useState("");

  function toggleSelectMode() {
    setSelectMode((v) => !v);
    setSelectedIds(new Set());
    setConfirmBulkDelete(false);
    setBulkError(null);
  }

  function toggleSelected(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleBulkDelete() {
    if (!confirmBulkDelete) {
      setConfirmBulkDelete(true);
      return;
    }
    setBulkBusy(true);
    setBulkError(null);
    const ids = Array.from(selectedIds);
    const deleted: number[] = [];
    for (const id of ids) {
      try {
        const res = await mutateFetch(`/api/expenses/${id}`, { method: "DELETE" });
        if (res.ok) deleted.push(id);
      } catch {
        // best-effort — surfaced via the error message below if anything's left over
      }
    }
    if (deleted.length > 0) onBulkDeleted(deleted);
    if (deleted.length < ids.length) {
      setBulkError(`Deleted ${deleted.length} of ${ids.length} — some transactions couldn't be deleted.`);
    } else {
      setSelectedIds(new Set());
      setSelectMode(false);
    }
    setConfirmBulkDelete(false);
    setBulkBusy(false);
  }

  async function handleSwipeDelete(id: number) {
    try {
      const res = await mutateFetch(`/api/expenses/${id}`, { method: "DELETE" });
      if (res.ok) onBulkDeleted([id]);
    } catch {
      // Best-effort — the row simply stays put if this fails.
    }
  }

  async function handleBulkAddTag() {
    const tag = bulkTagInput.trim();
    if (!tag) return;
    setBulkBusy(true);
    setBulkError(null);
    const targets = expenses.filter((e) => selectedIds.has(e.id));
    const updated: Expense[] = [];
    let failed = 0;
    for (const e of targets) {
      const newTags = e.tags.includes(tag) ? e.tags : [...e.tags, tag];
      try {
        const res = await mutateFetch(`/api/expenses/${e.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: e.type,
            direction: e.type === "transfer" ? (e.direction ?? "out") : undefined,
            date: e.date,
            amount: e.amount,
            merchant: e.merchant,
            category: e.category,
            notes: e.notes || undefined,
            tags: newTags,
            walletId: e.walletId,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          // data.expense is absent when this was queued offline (see
          // mutateFetch) — fall back to the tags we optimistically applied.
          updated.push({
            ...e,
            tags: data.expense?.tags ?? newTags,
          });
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }
    if (updated.length > 0) onBulkUpdated(updated);
    if (failed > 0) {
      setBulkError(`Tagged ${updated.length} of ${targets.length} — ${failed} couldn't be updated.`);
    } else {
      setBulkTagInput("");
      setSelectedIds(new Set());
      setSelectMode(false);
    }
    setBulkBusy(false);
  }

  const categoryOptions = useMemo(() => {
    const names = new Set(
      allCategories.filter((c) => typeFilter === "all" || c.type === typeFilter).map((c) => c.name),
    );
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [allCategories, typeFilter]);

  const tagOptions = useMemo(() => {
    const names = new Set<string>();
    for (const e of expenses) {
      for (const tag of e.tags) names.add(tag);
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [expenses]);

  // A stored category selection can go stale when the type filter changes
  // out from under it — including from outside this component, e.g. via
  // ActivitiesBalanceCard's Expense/Income/Transfer buttons — since a
  // category belongs to exactly one type. Deriving the effective value here
  // (rather than syncing categoryFilter back to "all" in an effect) means
  // stale state is never actually read: the dropdown, the filter count, and
  // the filtering below all agree the instant typeFilter changes.
  const categoryFilterValid =
    categoryFilter === "all" ||
    allCategories.some((c) => c.name === categoryFilter && (typeFilter === "all" || c.type === typeFilter));
  const effectiveCategoryFilter = categoryFilterValid ? categoryFilter : "all";

  const activeFilterCount = [
    typeFilter !== "all",
    effectiveCategoryFilter !== "all",
    tagFilter !== "all",
    walletFilter !== "all",
    Boolean(dateFrom || dateTo),
  ].filter(Boolean).length;

  function clearAllFilters() {
    onTypeFilterChange("all");
    setCategoryFilter("all");
    setTagFilter("all");
    onWalletFilterChange("all");
    setDateFrom("");
    setDateTo("");
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return expenses.filter((e) => {
      if (typeFilter !== "all" && e.type !== typeFilter) return false;
      if (effectiveCategoryFilter !== "all" && e.category !== effectiveCategoryFilter) return false;
      if (tagFilter !== "all" && !e.tags.includes(tagFilter)) return false;
      if (walletFilter !== "all" && String(e.walletId) !== walletFilter) return false;
      if (dateFrom && e.date < dateFrom) return false;
      if (dateTo && e.date > dateTo) return false;
      if (q) {
        const haystack = `${e.merchant} ${e.notes ?? ""} ${e.tags.join(" ")} ${e.category}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [expenses, search, typeFilter, effectiveCategoryFilter, tagFilter, walletFilter, dateFrom, dateTo]);

  function exportCsv() {
    const header = ["Date", "Type", "Merchant", "Category", "Tags", "Amount", "Notes"];
    const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const lines = [header.join(",")];
    for (const e of filtered) {
      lines.push(
        [
          e.date,
          e.type,
          escape(e.merchant),
          escape(e.category),
          escape(e.tags.join("; ")),
          formatAmountRaw(signedAmount(e), currency),
          escape(e.notes ?? ""),
        ].join(","),
      );
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tally-export-${todayInputValue()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const groups = useMemo(() => {
    const map = new Map<string, Expense[]>();
    for (const e of filtered) {
      const key = monthKey(e.date);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [filtered]);

  if (expenses.length === 0) {
    return (
      <div className="mt-10 flex flex-col items-center gap-2 text-center">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10 text-ink-soft">
          <path d="M5 2.5h10v15l-2-1.3-1.5 1.3-1.5-1.3-1.5 1.3-1.5-1.3-2 1.3v-15Z" />
          <path d="M7.5 6.5h5M7.5 9.5h5M7.5 12.5h3" />
        </svg>
        <p className="font-display text-lg text-foreground">{t("activities.noTransactionsYet")}</p>
        <p className="text-sm text-ink-soft">{t("activities.noTransactionsDesc")}</p>
      </div>
    );
  }

  const filteredNet = filtered.reduce((sum, e) => sum + signedAmount(e), 0);

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <div className="relative flex-1">
          <svg
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft"
          >
            <circle cx="8.7" cy="8.7" r="5.5" />
            <path d="M16.5 16.5l-3.6-3.6" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("activities.searchPlaceholder")}
            className="w-full rounded-full border border-line bg-surface py-2.5 pl-9 pr-3 text-sm text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
          />
        </div>

        <button
          type="button"
          onClick={() => setFilterOpen(true)}
          aria-label={t("modal.filters")}
          className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition ${
            activeFilterCount > 0
              ? "border-navy bg-navy/10 text-navy dark:text-blue-300"
              : "border-line bg-surface text-ink-soft hover:border-navy hover:text-foreground"
          }`}
        >
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
            <path d="M3 5.5h14M5.5 10h9M8 14.5h4" />
          </svg>
          {activeFilterCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-navy text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {filterOpen && (
        <Modal onClose={() => setFilterOpen(false)} title={t("modal.filters")}>
          <div className="space-y-4">
            <div>
              <p className="mb-1.5 text-sm font-semibold text-surface-foreground-soft">{t("common.category")}</p>
              <FilterDropdown
                value={effectiveCategoryFilter}
                allLabel={t("activities.allCategories")}
                options={categoryOptions}
                onChange={setCategoryFilter}
              />
            </div>

            {tagOptions.length > 0 && (
              <div>
                <p className="mb-1.5 text-sm font-semibold text-surface-foreground-soft">{t("activities.tag")}</p>
                <FilterDropdown value={tagFilter} allLabel={t("activities.allTags")} options={tagOptions} onChange={setTagFilter} />
              </div>
            )}

            {wallets.length > 1 && (
              <div>
                <p className="mb-1.5 text-sm font-semibold text-surface-foreground-soft">{t("common.wallet")}</p>
                <FilterDropdown
                  value={walletFilter}
                  allLabel={t("activities.allWallets")}
                  options={wallets.map((w) => ({ value: String(w.id), label: w.name }))}
                  onChange={onWalletFilterChange}
                />
              </div>
            )}

            <div>
              <p className="mb-1.5 text-sm font-semibold text-surface-foreground-soft">{t("activities.dateRange")}</p>
              <DateRangeFilter
                from={dateFrom}
                to={dateTo}
                onChange={(nextFrom, nextTo) => {
                  setDateFrom(nextFrom);
                  setDateTo(nextTo);
                }}
              />
            </div>

            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="w-full rounded-full px-4 py-2.5 text-sm font-semibold text-surface-foreground-soft transition hover:bg-[var(--surface-nav-hover)] hover:text-surface-foreground"
              >
                {t("activities.clearAllFilters")}
              </button>
            )}
          </div>
        </Modal>
      )}

      <div className="mb-4 flex items-center justify-between gap-3 rounded-card border border-surface-line bg-surface px-4 py-3.5">
        <div className="min-w-0">
          <p className="text-xs font-medium text-surface-foreground-soft">
            {filtered.length} {t("activities.transaction")}
            {language === "en" && filtered.length !== 1 ? "s" : ""}
          </p>
          <p
            className={`text-lg font-bold tabular-nums ${
              filteredNet >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
            }`}
          >
            {filteredNet >= 0 ? "+" : "-"}
            {formatCurrency(Math.abs(filteredNet), currency)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={exportCsv}
            disabled={filtered.length === 0}
            aria-label={t("activities.export")}
            className="flex items-center gap-1.5 rounded-full border border-line px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-bg-soft disabled:opacity-40"
          >
            <DownloadIcon />
            <span className="hidden sm:inline">{t("activities.export")}</span>
          </button>
          <button
            onClick={toggleSelectMode}
            disabled={filtered.length === 0}
            aria-label={selectMode ? t("common.cancel") : t("activities.select")}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold transition disabled:opacity-40 ${
              selectMode ? "border-surface-accent bg-surface-accent/10 text-surface-accent" : "border-line text-foreground hover:bg-bg-soft"
            }`}
          >
            <SelectCheckIcon />
            {selectMode ? t("common.cancel") : t("activities.select")}
          </button>
        </div>
      </div>

      {selectMode && (
        <div className="mb-4 flex flex-col gap-2.5 rounded-card border border-surface-line bg-surface p-3 sm:flex-row sm:items-center">
          <span className="text-sm font-semibold text-surface-foreground-soft">
            {selectedIds.size} selected
          </span>
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <input
              type="text"
              value={bulkTagInput}
              onChange={(e) => setBulkTagInput(e.target.value)}
              placeholder={t("activities.addTagPlaceholder")}
              disabled={selectedIds.size === 0}
              className="min-w-0 flex-1 rounded-full border border-surface-line bg-surface-soft px-3 py-1.5 text-sm text-surface-foreground outline-none transition focus:border-surface-accent focus:ring-2 focus:ring-surface-accent/20 disabled:opacity-50"
            />
            <button
              onClick={handleBulkAddTag}
              disabled={bulkBusy || selectedIds.size === 0 || !bulkTagInput.trim()}
              className="shrink-0 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-bg-soft disabled:opacity-40"
            >
              {t("activities.addTag")}
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={bulkBusy || selectedIds.size === 0}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition disabled:opacity-40 ${
                confirmBulkDelete
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              }`}
            >
              {bulkBusy ? t("common.saving") : confirmBulkDelete ? t("common.confirmDelete") : t("common.delete")}
            </button>
          </div>
          {bulkError && <p className="w-full text-xs text-red-600 dark:text-red-400">{bulkError}</p>}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-2 text-center">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10 text-ink-soft">
            <circle cx="8.7" cy="8.7" r="5.5" />
            <path d="M16.5 16.5l-3.6-3.6" />
          </svg>
          <p className="font-display text-lg text-foreground">{t("activities.noMatchingTransactions")}</p>
          <p className="text-sm text-ink-soft">{t("activities.noMatchingDesc")}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(([key, items]) => {
            const net = items.reduce((sum, e) => sum + signedAmount(e), 0);
            return (
              <section key={key}>
                <div className="mb-2 flex items-center justify-between px-1">
                  <h2 className="font-display text-base text-foreground">{monthLabel(key)}</h2>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      net >= 0
                        ? badgeClasses("emerald")
                        : "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                    }`}
                  >
                    {net >= 0 ? "+" : "-"}
                    {formatCurrency(Math.abs(net), currency)}
                  </span>
                </div>
                <div className="overflow-hidden rounded-card border border-surface-line bg-surface">
                  {selectMode
                    ? items.map((expense, i) => (
                        <ExpenseRow
                          key={expense.id}
                          expense={expense}
                          onClick={() => onSelect(expense)}
                          isLast={i === items.length - 1}
                          selectMode
                          selected={selectedIds.has(expense.id)}
                          onToggleSelect={() => toggleSelected(expense.id)}
                        />
                      ))
                    : buildDisplayRows(items).map((row, i, arr) =>
                        row.kind === "split" ? (
                          <SplitExpenseGroup
                            key={row.groupId}
                            items={row.items}
                            onSelectLine={onSelect}
                            isLast={i === arr.length - 1}
                          />
                        ) : (
                          <ExpenseRow
                            key={row.expense.id}
                            expense={row.expense}
                            onClick={() => onSelect(row.expense)}
                            onDelete={handleSwipeDelete}
                            onEdit={onEdit}
                            isLast={i === arr.length - 1}
                            isOpen={openRowId === row.expense.id}
                            onOpenChange={(open) => setOpenRowId(open ? row.expense.id : null)}
                          />
                        ),
                      )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
