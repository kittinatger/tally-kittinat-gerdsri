"use client";

import { describeFetchError } from "@/lib/fetch-error";
import { useState } from "react";
import { jsPDF } from "jspdf";
import { normalizeExpenseType, normalizeDirection, signedAmount } from "@/types/expense";
import { formatCurrency, todayInputValue } from "@/lib/format";
import { DownloadIcon } from "@/lib/icons";
import { useCurrency } from "@/lib/currency-context";
import { useT } from "@/lib/language-context";

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

const PAGE_HEIGHT = 297; // A4, mm
const MARGIN = 15;
const ROW_HEIGHT = 6;

// No PDF library was in use anywhere in the app before this — jsPDF is a
// pure client-side, no-headless-browser-needed generator, matching how
// ExportDataButton already builds its CSV in-browser from data already
// fetched, just producing a formatted document instead of raw text. No
// table plugin (jspdf-autotable): the layout here is simple enough
// (fixed columns, manual page-break check per row) that hand-laying it
// out avoids a second new dependency.
export default function ReportExportButton() {
  const currency = useCurrency();
  const t = useT();
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
      const now = new Date();
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
      const monthLabel = now.toLocaleDateString(undefined, { month: "long", year: "numeric" });

      const all: ApiExpense[] = data.expenses ?? [];
      const thisMonth = all.filter((e) => e.date >= monthStart && e.date <= todayInputValue());

      const expenses = thisMonth.filter((e) => normalizeExpenseType(e.type) === "expense");
      const income = thisMonth.filter((e) => normalizeExpenseType(e.type) === "income");
      const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
      const totalIncome = income.reduce((sum, e) => sum + Number(e.amount), 0);

      const byCategory = new Map<string, number>();
      for (const e of expenses) {
        byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + Number(e.amount));
      }
      const categoryRows = [...byCategory.entries()].sort((a, b) => b[1] - a[1]);

      const doc = new jsPDF();
      let y = MARGIN;

      doc.setFontSize(18);
      doc.text("Tally — Monthly Report", MARGIN, y);
      y += 8;
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(monthLabel, MARGIN, y);
      doc.setTextColor(0);
      y += 10;

      doc.setFontSize(13);
      doc.text("Summary", MARGIN, y);
      y += 7;
      doc.setFontSize(10);
      doc.text(`Income: ${formatCurrency(totalIncome, currency)}`, MARGIN, y);
      y += ROW_HEIGHT;
      doc.text(`Expenses: ${formatCurrency(totalExpenses, currency)}`, MARGIN, y);
      y += ROW_HEIGHT;
      doc.text(`Net: ${formatCurrency(totalIncome - totalExpenses, currency)}`, MARGIN, y);
      y += 10;

      if (categoryRows.length > 0) {
        doc.setFontSize(13);
        doc.text("Spending by category", MARGIN, y);
        y += 7;
        doc.setFontSize(10);
        for (const [category, amount] of categoryRows) {
          if (y > PAGE_HEIGHT - MARGIN) {
            doc.addPage();
            y = MARGIN;
          }
          doc.text(category, MARGIN, y);
          doc.text(formatCurrency(amount, currency), 160, y, { align: "right" });
          y += ROW_HEIGHT;
        }
        y += 6;
      }

      const transactions = [...thisMonth].sort((a, b) => (a.date < b.date ? 1 : -1));
      if (transactions.length > 0) {
        if (y > PAGE_HEIGHT - MARGIN - 20) {
          doc.addPage();
          y = MARGIN;
        }
        doc.setFontSize(13);
        doc.text("Transactions", MARGIN, y);
        y += 7;
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text("Date", MARGIN, y);
        doc.text("Merchant", 40, y);
        doc.text("Category", 110, y);
        doc.text("Amount", 190, y, { align: "right" });
        doc.setTextColor(0);
        y += ROW_HEIGHT;
        for (const e of transactions) {
          if (y > PAGE_HEIGHT - MARGIN) {
            doc.addPage();
            y = MARGIN;
          }
          const type = normalizeExpenseType(e.type);
          const amount = signedAmount({
            id: e.id,
            type,
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
          doc.text(e.date, MARGIN, y);
          doc.text(e.merchant.slice(0, 30), 40, y);
          doc.text(e.category.slice(0, 20), 110, y);
          doc.text(formatCurrency(amount, currency), 190, y, { align: "right" });
          y += ROW_HEIGHT;
        }
      }

      doc.save(`tally-report-${todayInputValue()}.pdf`);
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
          <DownloadIcon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{t("reports.title")}</p>
          <p className="text-[11px] leading-snug text-ink-soft">{t("reports.description")}</p>
          {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
        </div>
      </div>
      <button
        type="button"
        onClick={handleExport}
        disabled={exporting}
        className="shrink-0 rounded-full border border-line px-3.5 py-2 text-xs font-semibold text-foreground transition hover:bg-[var(--nav-hover-bg)] disabled:opacity-60"
      >
        {exporting ? t("reports.exporting") : t("reports.download")}
      </button>
    </div>
  );
}
