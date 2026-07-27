"use client";

import { useMemo, useState } from "react";
import { signedAmount, type Expense } from "@/types/expense";
import { monthKey, monthLabel, formatCurrency } from "@/lib/format";
import { useAllCategories } from "@/lib/categories-context";
import ExpenseRow from "./ExpenseRow";
import FilterDropdown from "./FilterDropdown";

type TypeFilter = "all" | "expense" | "income";

export default function ExpenseList({
  expenses,
  onSelect,
}: {
  expenses: Expense[];
  onSelect: (expense: Expense) => void;
}) {
  const allCategories = useAllCategories();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");

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
      if (q) {
        const haystack = `${e.merchant} ${e.notes ?? ""} ${e.tags.join(" ")}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [expenses, search, typeFilter, categoryFilter, tagFilter]);

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
        <p className="text-4xl">🧾</p>
        <p className="font-display text-lg text-foreground">No transactions yet</p>
        <p className="text-sm text-ink-soft">Add an expense or income entry, or scan a document, to get started.</p>
      </div>
    );
  }

  const filteredNet = filtered.reduce((sum, e) => sum + signedAmount(e), 0);

  return (
    <div>
      <div className="mb-3 flex flex-col gap-2.5 rounded-card border border-line bg-surface p-3 sm:flex-row sm:items-center">
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
      </div>

      <div className="mb-4 flex items-center justify-between px-1 text-sm">
        <span className="text-ink-soft">
          {filtered.length} transaction{filtered.length === 1 ? "" : "s"}
        </span>
        <span
          className={`font-semibold ${
            filteredNet >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
          }`}
        >
          {filteredNet >= 0 ? "+" : "-"}
          {formatCurrency(Math.abs(filteredNet))}
        </span>
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
                    {formatCurrency(Math.abs(net))}
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
