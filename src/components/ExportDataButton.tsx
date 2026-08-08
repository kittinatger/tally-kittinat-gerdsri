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
          <svg viewBox="0 0 20.2832 27.1875" fill="currentColor" className="h-5 w-5">
            <path d="M19.9219 1.60156C19.9219 0.722656 19.2578 0.0341797 18.3789 0.0341797L1.5625 0.0341797C0.673828 0.0341797 0 0.722656 0 1.60156C0 2.48047 0.673828 3.16895 1.5625 3.16895L18.3789 3.16895C19.2578 3.16895 19.9219 2.48047 19.9219 1.60156ZM1.53809 14.6533C2.0166 14.6533 2.40723 14.4482 2.69043 14.1553L5.75195 11.1084L9.96582 6.31348L14.1748 11.1084L17.2314 14.1553C17.5195 14.4482 17.9102 14.6533 18.3887 14.6533C19.2627 14.6533 19.9219 14.0039 19.9219 13.0859C19.9219 12.6611 19.7559 12.2705 19.4238 11.9287L11.1621 3.65723C10.8545 3.34473 10.4053 3.16406 9.96582 3.16406C9.52637 3.16406 9.07227 3.34473 8.76953 3.65723L0.50293 11.9287C0.166016 12.2705 0 12.6611 0 13.0859C0 14.0039 0.65918 14.6533 1.53809 14.6533ZM11.3916 6.08887C11.3574 5.30273 10.752 4.66309 9.96582 4.66309C9.17969 4.66309 8.57422 5.30273 8.53516 6.08887L8.34961 10.7812L8.34961 25.5176C8.34961 26.5137 8.99902 27.1875 9.96582 27.1875C10.9277 27.1875 11.582 26.5137 11.582 25.5176L11.582 10.7812Z" />
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
