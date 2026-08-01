"use client";

import { useState } from "react";
import { signedAmount } from "@/types/expense";
import { todayInputValue } from "@/lib/format";

type ApiExpense = {
  id: number;
  type: string;
  date: string;
  amount: string;
  merchant: string;
  category: string;
  notes: string | null;
  tags: string[];
};

export default function ExportDataButton() {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setExporting(true);
    setError(null);
    try {
      const res = await fetch("/api/expenses");
      const data = await res.json();
      if (!res.ok) {
        setError("Could not load your data.");
        return;
      }
      const expenses: ApiExpense[] = data.expenses ?? [];

      const header = ["Date", "Type", "Merchant", "Category", "Tags", "Amount", "Notes"];
      const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
      const lines = [header.join(",")];
      for (const e of expenses) {
        const amount = signedAmount({
          id: e.id,
          type: e.type === "income" ? "income" : "expense",
          date: e.date,
          amount: Number(e.amount),
          merchant: e.merchant,
          category: e.category,
          notes: e.notes,
          tags: e.tags,
          hasReceipt: false,
        });
        lines.push(
          [
            e.date,
            e.type,
            escape(e.merchant),
            escape(e.category),
            escape(e.tags.join("; ")),
            amount.toFixed(2),
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
    } catch {
      setError("Network error while exporting.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3.5">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">Export data</p>
        <p className="text-[11px] leading-snug text-ink-soft">Download your full transaction history as a CSV.</p>
        {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
      </div>
      <button
        type="button"
        onClick={handleExport}
        disabled={exporting}
        className="shrink-0 rounded-full border border-line px-3.5 py-2 text-xs font-semibold text-foreground transition hover:bg-[var(--nav-hover-bg)] disabled:opacity-60"
      >
        {exporting ? "Exporting…" : "Export CSV"}
      </button>
    </div>
  );
}
