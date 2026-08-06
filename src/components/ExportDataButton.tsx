"use client";

import { describeFetchError } from "@/lib/fetch-error";
import { useState } from "react";
import { normalizeExpenseType, normalizeDirection, signedAmount } from "@/types/expense";
import { todayInputValue } from "@/lib/format";

type ApiExpense = {
  id: number;
  type: string;
  direction: string | null;
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
          type: normalizeExpenseType(e.type),
          direction: normalizeDirection(e.direction),
          date: e.date,
          amount: Number(e.amount),
          merchant: e.merchant,
          category: e.category,
          notes: e.notes,
          tags: e.tags,
          hasReceipt: false,
          walletId: null,
          walletName: null,
          splitGroupId: null,
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
    } catch (err) {
      setError(describeFetchError(err));
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3.5">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center text-ink-soft">
          <svg viewBox="0 0 23.2715 22.9004" fill="currentColor" className="h-5 w-5">
            <path d="M21.1523 1.74805C22.3145 2.90039 22.9102 4.60938 22.9102 6.81641L22.9102 16.084C22.9102 18.291 22.3047 20.0098 21.1523 21.1523C20.0293 22.2754 18.3105 22.9004 16.0938 22.9004L6.81641 22.9004C4.59961 22.9004 2.89062 22.2852 1.75781 21.1523C0.595703 20 0 18.291 0 16.084L0 6.81641C0 4.60938 0.605469 2.89062 1.75781 1.74805C2.88086 0.625 4.59961 0 6.81641 0L16.0938 0C18.3105 0 20.0195 0.605469 21.1523 1.74805ZM10.5664 5.83984L10.5664 13.5449L10.6247 15.4391L9.79492 14.5703L7.67578 12.3535C7.51953 12.168 7.27539 12.0801 7.06055 12.0801C6.60156 12.0801 6.25977 12.4121 6.25977 12.8613C6.25977 13.0957 6.35742 13.2812 6.52344 13.4473L10.8105 17.6074C11.0352 17.832 11.2207 17.9102 11.4551 17.9102C11.6797 17.9102 11.875 17.832 12.0898 17.6074L16.3672 13.4473C16.543 13.2812 16.6309 13.0957 16.6309 12.8613C16.6309 12.4121 16.2793 12.0801 15.8301 12.0801C15.6152 12.0801 15.3809 12.168 15.2246 12.3535L13.1055 14.5703L12.2831 15.4365L12.334 13.5449L12.334 5.83984C12.334 5.37109 11.9336 4.98047 11.4551 4.98047C10.9668 4.98047 10.5664 5.37109 10.5664 5.83984Z" />
          </svg>
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">Export data</p>
          <p className="text-[11px] leading-snug text-ink-soft">Download your full transaction history as a CSV.</p>
          {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
        </div>
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
