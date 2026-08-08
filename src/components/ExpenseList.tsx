"use client";

import { useMemo, useState } from "react";
import { signedAmount, type Expense } from "@/types/expense";
import type { TransactionType } from "@/lib/categories";
import { monthKey, monthLabel, formatCurrency, todayInputValue } from "@/lib/format";
import { useAllCategories } from "@/lib/categories-context";
import { useWallets } from "@/lib/wallets-context";
import { useCurrency } from "@/lib/currency-context";
import ExpenseRow from "./ExpenseRow";
import SplitExpenseGroup from "./SplitExpenseGroup";
import FilterDropdown from "./FilterDropdown";
import DateRangeFilter from "./DateRangeFilter";
import Modal from "./Modal";

export type TypeFilter = "all" | TransactionType;

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
  onBulkDeleted,
  onBulkUpdated,
  typeFilter,
  onTypeFilterChange,
  walletFilter,
  onWalletFilterChange,
}: {
  expenses: Expense[];
  onSelect: (expense: Expense) => void;
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
  const allCategories = useAllCategories();
  const wallets = useWallets();
  const currency = useCurrency();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

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
        const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
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
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
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
        const res = await fetch(`/api/expenses/${e.id}`, {
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
          updated.push({
            ...e,
            tags: data.expense.tags ?? newTags,
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
      if (walletFilter !== "all" && e.walletName !== walletFilter) return false;
      if (dateFrom && e.date < dateFrom) return false;
      if (dateTo && e.date > dateTo) return false;
      if (q) {
        const haystack = `${e.merchant} ${e.notes ?? ""} ${e.tags.join(" ")}`.toLowerCase();
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
          signedAmount(e).toFixed(2),
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
        <svg viewBox="0 0 21.3281 27.5959" fill="currentColor" className="h-10 w-10 text-ink-soft">
          <path d="M0 26.254C0 27.4259 1.23047 28.0118 2.36328 27.2599L4.01367 26.2442L5.75195 27.377C6.05469 27.5724 6.30859 27.5821 6.61133 27.377L8.30078 26.2345L10.0391 27.377C10.3418 27.5821 10.5957 27.5821 10.9082 27.377L12.6465 26.2345L14.3359 27.377C14.6582 27.5919 14.873 27.5919 15.1953 27.377L16.9434 26.2345L18.6035 27.2599C19.7266 28.0118 20.9668 27.4259 20.9668 26.254L20.9668 4.10555C20.9668 1.60555 19.6973 0.345788 17.168 0.345788L3.79883 0.345788C1.26953 0.345788 0 1.60555 0 4.10555ZM5.03906 7.33798C4.63867 7.33798 4.33594 7.03524 4.33594 6.63485C4.33594 6.24423 4.63867 5.93173 5.03906 5.93173L11.6309 5.93173C12.0508 5.93173 12.3535 6.24423 12.3535 6.63485C12.3535 7.03524 12.0508 7.33798 11.6309 7.33798ZM14.8145 7.33798C14.4141 7.33798 14.1113 7.03524 14.1113 6.63485C14.1113 6.24423 14.4141 5.93173 14.8145 5.93173L15.8984 5.93173C16.3086 5.93173 16.6113 6.24423 16.6113 6.63485C16.6113 7.03524 16.3086 7.33798 15.8984 7.33798ZM5.03906 11.9474C4.63867 11.9474 4.33594 11.6446 4.33594 11.2638C4.33594 10.8536 4.63867 10.5411 5.03906 10.5411L11.6309 10.5411C12.0508 10.5411 12.3535 10.8536 12.3535 11.2638C12.3535 11.6446 12.0508 11.9474 11.6309 11.9474ZM14.8145 11.9474C14.4141 11.9474 14.1113 11.6446 14.1113 11.2638C14.1113 10.8536 14.4141 10.5411 14.8145 10.5411L15.8984 10.5411C16.3086 10.5411 16.6113 10.8536 16.6113 11.2638C16.6113 11.6446 16.3086 11.9474 15.8984 11.9474ZM5.03906 16.4884C4.63867 16.4884 4.33594 16.1856 4.33594 15.795C4.33594 15.3946 4.63867 15.0821 5.03906 15.0821L11.6602 15.0821C12.0801 15.0821 12.3828 15.3946 12.3828 15.795C12.3828 16.1856 12.0801 16.4884 11.6602 16.4884ZM14.7852 16.4884C14.3848 16.4884 14.082 16.1856 14.082 15.795C14.082 15.3946 14.3848 15.0821 14.7852 15.0821L15.8984 15.0821C16.3086 15.0821 16.6113 15.3946 16.6113 15.795C16.6113 16.1856 16.3086 16.4884 15.8984 16.4884ZM5.03906 21.0977C4.63867 21.0977 4.33594 20.795 4.33594 20.4141C4.33594 20.0138 4.63867 19.7013 5.03906 19.7013L11.6602 19.7013C12.0801 19.7013 12.3828 20.0138 12.3828 20.4141C12.3828 20.795 12.0801 21.0977 11.6602 21.0977ZM14.7852 21.0977C14.3848 21.0977 14.082 20.795 14.082 20.4141C14.082 20.0138 14.3848 19.7013 14.7852 19.7013L15.8984 19.7013C16.3086 19.7013 16.6113 20.0138 16.6113 20.4141C16.6113 20.795 16.3086 21.0977 15.8984 21.0977Z" />
        </svg>
        <p className="font-display text-lg text-foreground">No transactions yet</p>
        <p className="text-sm text-ink-soft">Add an expense or income entry, or scan a document, to get started.</p>
      </div>
    );
  }

  const filteredNet = filtered.reduce((sum, e) => sum + signedAmount(e), 0);

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <div className="relative flex-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 25.4688 25.332"
            fill="currentColor"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft"
          >
            <path d="M0 10.4346C0 16.1914 4.67285 20.8691 10.4346 20.8691C12.4316 20.8691 14.2822 20.2832 15.8447 19.292L21.2305 24.6777C21.6602 25.1172 22.251 25.3271 22.8564 25.3271C24.1553 25.3271 25.1074 24.3311 25.1074 23.0566C25.1074 22.4561 24.8975 21.8945 24.4629 21.4551L19.126 16.0986C20.2246 14.4922 20.874 12.5391 20.874 10.4346C20.874 4.67285 16.1963 0 10.4346 0C4.67285 0 0 4.67285 0 10.4346ZM3.05664 10.4346C3.05664 6.36719 6.36719 3.05664 10.4346 3.05664C14.5068 3.05664 17.8076 6.36719 17.8076 10.4346C17.8076 14.4971 14.5068 17.8076 10.4346 17.8076C6.36719 17.8076 3.05664 14.4971 3.05664 10.4346Z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search merchant, notes, or tags..."
            className="w-full rounded-full border border-line bg-surface py-2.5 pl-9 pr-3 text-sm text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
          />
        </div>

        <button
          type="button"
          onClick={() => setFilterOpen(true)}
          aria-label="Filters"
          className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition ${
            activeFilterCount > 0
              ? "border-navy bg-navy/10 text-navy dark:text-blue-300"
              : "border-line bg-surface text-ink-soft hover:border-navy hover:text-foreground"
          }`}
        >
          <svg viewBox="0 0 26.5137 15.7324" fill="currentColor" className="h-4.5 w-4.5">
            <path d="M6.49902 15.7129L19.6924 15.7129C20.4346 15.7129 21.0156 15.0879 21.0156 14.3604C21.0156 13.6084 20.4395 13.0029 19.6924 13.0029L6.49902 13.0029C5.75684 13.0029 5.1709 13.6182 5.1709 14.3604C5.1709 15.0781 5.76172 15.7129 6.49902 15.7129Z" />
            <path d="M3.93066 9.21387L22.2607 9.21387C23.0029 9.21387 23.584 8.58887 23.584 7.86133C23.584 7.10938 23.0078 6.49902 22.2607 6.49902L3.93066 6.49902C3.18848 6.49902 2.60254 7.11914 2.60254 7.86133C2.60254 8.5791 3.19336 9.21387 3.93066 9.21387Z" />
            <path d="M1.32812 2.71484L24.8242 2.71484C25.5713 2.71484 26.1523 2.08984 26.1523 1.35254C26.1523 0.610352 25.5762 0 24.8242 0L1.32812 0C0.585938 0 0 0.620117 0 1.35254C0 2.0752 0.59082 2.71484 1.32812 2.71484Z" />
          </svg>
          {activeFilterCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-navy text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {filterOpen && (
        <Modal onClose={() => setFilterOpen(false)} title="Filters">
          <div className="space-y-4">
            <div>
              <p className="mb-1.5 text-sm font-semibold text-surface-foreground-soft">Category</p>
              <FilterDropdown
                value={effectiveCategoryFilter}
                allLabel="All categories"
                options={categoryOptions}
                onChange={setCategoryFilter}
              />
            </div>

            {tagOptions.length > 0 && (
              <div>
                <p className="mb-1.5 text-sm font-semibold text-surface-foreground-soft">Tag</p>
                <FilterDropdown value={tagFilter} allLabel="All tags" options={tagOptions} onChange={setTagFilter} />
              </div>
            )}

            {wallets.length > 1 && (
              <div>
                <p className="mb-1.5 text-sm font-semibold text-surface-foreground-soft">Wallet</p>
                <FilterDropdown
                  value={walletFilter}
                  allLabel="All wallets"
                  options={wallets.map((w) => w.name)}
                  onChange={onWalletFilterChange}
                />
              </div>
            )}

            <div>
              <p className="mb-1.5 text-sm font-semibold text-surface-foreground-soft">Date range</p>
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
                Clear all filters
              </button>
            )}
          </div>
        </Modal>
      )}

      <div className="mb-4 flex items-center justify-between gap-3 px-1 text-sm">
        <span className="text-ink-soft">
          {filtered.length} transaction{filtered.length === 1 ? "" : "s"}
        </span>
        <div className="flex items-center gap-3">
          <span
            className={`font-semibold ${
              filteredNet >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
            }`}
          >
            {filteredNet >= 0 ? "+" : "-"}
            {formatCurrency(Math.abs(filteredNet), currency)}
          </span>
          <button
            onClick={exportCsv}
            disabled={filtered.length === 0}
            className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-bg-soft disabled:opacity-40"
          >
            Export CSV
          </button>
          <button
            onClick={toggleSelectMode}
            disabled={filtered.length === 0}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-40 ${
              selectMode ? "border-surface-accent bg-surface-accent/10 text-surface-accent" : "border-line text-foreground hover:bg-bg-soft"
            }`}
          >
            {selectMode ? "Cancel" : "Select"}
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
              placeholder="Add tag to selected..."
              disabled={selectedIds.size === 0}
              className="min-w-0 flex-1 rounded-full border border-surface-line bg-surface-soft px-3 py-1.5 text-sm text-surface-foreground outline-none transition focus:border-surface-accent focus:ring-2 focus:ring-surface-accent/20 disabled:opacity-50"
            />
            <button
              onClick={handleBulkAddTag}
              disabled={bulkBusy || selectedIds.size === 0 || !bulkTagInput.trim()}
              className="shrink-0 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-bg-soft disabled:opacity-40"
            >
              Add tag
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
              {bulkBusy ? "Working..." : confirmBulkDelete ? "Confirm delete" : "Delete"}
            </button>
          </div>
          {bulkError && <p className="w-full text-xs text-red-600 dark:text-red-400">{bulkError}</p>}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-2 text-center">
          <svg viewBox="0 0 24.7656 24.6387" fill="currentColor" className="h-10 w-10 text-ink-soft">
            <path d="M0 9.88281C0 15.3223 4.43359 19.7559 9.88281 19.7559C12.0801 19.7559 14.1016 19.0332 15.7422 17.8125L22.1777 24.2578C22.4219 24.5117 22.7637 24.6387 23.1152 24.6387C23.8867 24.6387 24.4043 24.0527 24.4043 23.3203C24.4043 22.959 24.2773 22.6465 24.043 22.4023L17.6367 15.9668C18.9648 14.2969 19.7656 12.1777 19.7656 9.88281C19.7656 4.43359 15.332 0 9.88281 0C4.43359 0 0 4.43359 0 9.88281ZM1.82617 9.88281C1.82617 5.43945 5.43945 1.82617 9.88281 1.82617C14.3262 1.82617 17.9297 5.43945 17.9297 9.88281C17.9297 14.3164 14.3262 17.9297 9.88281 17.9297C5.43945 17.9297 1.82617 14.3164 1.82617 9.88281Z" />
          </svg>
          <p className="font-display text-lg text-foreground">No matching transactions</p>
          <p className="text-sm text-ink-soft">Try a different search term or clear the filters.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(([key, items]) => {
            const net = items.reduce((sum, e) => sum + signedAmount(e), 0);
            return (
              <section key={key}>
                <div className="mb-2 flex items-center justify-between px-1">
                  <h2 className="text-sm font-semibold text-ink-soft">{monthLabel(key)}</h2>
                  <span
                    className={`text-sm font-semibold ${
                      net >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
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
                            isLast={i === arr.length - 1}
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
