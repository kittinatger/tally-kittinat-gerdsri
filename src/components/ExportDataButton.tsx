"use client";

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
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center text-ink-soft">
          <svg viewBox="0 0 22.4512 31.6895" fill="currentColor" className="h-5 w-5">
            <path d="M22.0898 13.8574L22.0898 23.4961C22.0898 26.8359 20.2344 28.7012 16.8848 28.7012L5.20508 28.7012C1.85547 28.7012 0 26.8359 0 23.4961L0 13.8574C0 10.5176 1.85547 8.66211 5.20508 8.66211L7.99805 8.66211L7.99805 10.3906L5.20508 10.3906C2.98828 10.3906 1.73828 11.6406 1.73828 13.8574L1.73828 23.4961C1.73828 25.7227 2.98828 26.9629 5.20508 26.9629L16.8848 26.9629C19.1113 26.9629 20.3613 25.7227 20.3613 23.4961L20.3613 13.8574C20.3613 11.6406 19.1113 10.3906 16.8848 10.3906L14.1113 10.3906L14.1113 8.66211L16.8848 8.66211C20.2344 8.66211 22.0898 10.5176 22.0898 13.8574Z" />
            <path d="M11.0547 2.19727C10.5859 2.19727 10.1953 2.57812 10.1953 3.03711L10.1953 16.1426L10.3223 19.2676C10.3418 19.6582 10.6543 19.9902 11.0547 19.9902C11.4453 19.9902 11.7578 19.6582 11.7773 19.2676L11.9043 16.1426L11.9043 3.03711C11.9043 2.57812 11.5137 2.19727 11.0547 2.19727ZM6.76758 14.707C6.31836 14.707 5.98633 15.0293 5.98633 15.459C5.98633 15.6934 6.08398 15.8691 6.25 16.0254L10.4297 20.0977C10.6445 20.3027 10.8301 20.3809 11.0547 20.3809C11.2695 20.3809 11.4551 20.3027 11.6699 20.0977L15.8496 16.0254C16.0156 15.8691 16.1035 15.6934 16.1035 15.459C16.1035 15.0293 15.7617 14.707 15.3223 14.707C15.1172 14.707 14.8926 14.7949 14.7363 14.9609L12.6074 17.1973L11.0547 18.8379L9.48242 17.1973L7.36328 14.9609C7.20703 14.7949 6.97266 14.707 6.76758 14.707Z" />
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
