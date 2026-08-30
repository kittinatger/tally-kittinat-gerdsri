"use client";

import { describeFetchError } from "@/lib/fetch-error";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadIcon } from "@/lib/icons";
import { badgeClasses } from "@/lib/category-styles";

export default function ImportDataButton() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setImporting(true);
    setError(null);
    setResult(null);
    try {
      const csv = await file.text();
      const res = await fetch("/api/expenses/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not import that file.");
        return;
      }
      setResult(data);
      if (data.imported > 0) router.refresh();
    } catch (err) {
      setError(describeFetchError(err));
    } finally {
      setImporting(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-1 px-4 py-3.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${badgeClasses("blue")}`}>
            <UploadIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">Import data</p>
            <p className="text-[11px] leading-snug text-ink-soft">
              Add transactions from a CSV file (date, type, amount, merchant, category, ...).
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={importing}
          className="shrink-0 rounded-full border border-line px-3.5 py-2 text-xs font-semibold text-foreground transition hover:bg-[var(--nav-hover-bg)] disabled:opacity-60"
        >
          {importing ? "Importing…" : "Import CSV"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      {result && (
        <p className="text-xs text-ink-soft">
          Imported {result.imported} transaction{result.imported === 1 ? "" : "s"}
          {result.skipped > 0 ? `, skipped ${result.skipped}` : ""}.
          {result.errors.length > 0 && ` First issue: ${result.errors[0]}`}
        </p>
      )}
    </div>
  );
}
