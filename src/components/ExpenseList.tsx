"use client";

import { useMemo, useRef, useState } from "react";
import { signedAmount, type Expense } from "@/types/expense";
import { monthKey, monthLabel, formatCurrency, todayInputValue } from "@/lib/format";
import { useAllCategories } from "@/lib/categories-context";
import { useCurrency } from "@/lib/currency-context";
import ExpenseRow from "./ExpenseRow";
import FilterDropdown from "./FilterDropdown";
import DateRangeFilter from "./DateRangeFilter";

type TypeFilter = "all" | "expense" | "income";

export default function ExpenseList({
  expenses,
  onSelect,
}: {
  expenses: Expense[];
  onSelect: (expense: Expense) => void;
}) {
  const allCategories = useAllCategories();
  const currency = useCurrency();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const filterBarRef = useRef<HTMLDivElement>(null);
  const exportButtonRef = useRef<HTMLButtonElement>(null);

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

  function handleTypeFilter(nextType: TypeFilter) {
    setTypeFilter(nextType);
    if (categoryFilter === "all") return;
    const stillValid = allCategories.some(
      (c) => c.name === categoryFilter && (nextType === "all" || c.type === nextType),
    );
    if (!stillValid) setCategoryFilter("all");
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return expenses.filter((e) => {
      if (typeFilter !== "all" && e.type !== typeFilter) return false;
      if (categoryFilter !== "all" && e.category !== categoryFilter) return false;
      if (tagFilter !== "all" && !e.tags.includes(tagFilter)) return false;
      if (dateFrom && e.date < dateFrom) return false;
      if (dateTo && e.date > dateTo) return false;
      if (q) {
        const haystack = `${e.merchant} ${e.notes ?? ""} ${e.tags.join(" ")}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [expenses, search, typeFilter, categoryFilter, tagFilter, dateFrom, dateTo]);

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
      <div
        ref={filterBarRef}
        className="mb-3 flex flex-col gap-2.5 rounded-card border border-line bg-surface p-3 sm:flex-row sm:items-center"
      >
        <div className="relative flex-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft"
          >
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
              clipRule="evenodd"
            />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search merchant, notes, or tags..."
            className="w-full rounded-full border border-line bg-bg-soft py-2 pl-9 pr-3 text-sm text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
          />
        </div>

        <div className="flex gap-1 rounded-full bg-bg-soft p-1">
          {(["all", "expense", "income"] as const).map((t) => (
            <button
              key={t}
              onClick={() => handleTypeFilter(t)}
              className={`flex-1 rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition sm:flex-none sm:text-sm ${
                typeFilter === t ? "bg-surface text-foreground shadow-sm" : "text-ink-soft"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <FilterDropdown
          value={categoryFilter}
          allLabel="All categories"
          options={categoryOptions}
          onChange={setCategoryFilter}
        />

        {tagOptions.length > 0 && (
          <FilterDropdown value={tagFilter} allLabel="All tags" options={tagOptions} onChange={setTagFilter} />
        )}

        <DateRangeFilter
          from={dateFrom}
          to={dateTo}
          onChange={(nextFrom, nextTo) => {
            setDateFrom(nextFrom);
            setDateTo(nextTo);
          }}
          alignTopRef={exportButtonRef}
          alignRightRef={filterBarRef}
        />
      </div>

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
            ref={exportButtonRef}
            onClick={exportCsv}
            disabled={filtered.length === 0}
            className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-bg-soft disabled:opacity-40"
          >
            Export CSV
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-2 text-center">
          <p className="text-4xl">🔍</p>
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
                  {items.map((expense, i) => (
                    <ExpenseRow
                      key={expense.id}
                      expense={expense}
                      onClick={() => onSelect(expense)}
                      isLast={i === items.length - 1}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
