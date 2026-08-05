"use client";

import { useRef, useState } from "react";

export default function CsvManagerButtons({
  exportHref,
  importUrl,
  onImported,
}: {
  exportHref: string;
  importUrl: string;
  onImported: () => void;
}) {
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
      const res = await fetch(importUrl, {
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
      if (data.imported > 0) onImported();
    } catch {
      setError("Network error while importing.");
    } finally {
      setImporting(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <a
          href={exportHref}
          className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-bg-soft"
        >
          Export CSV
        </a>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={importing}
          className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-bg-soft disabled:opacity-60"
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
          Imported {result.imported}
          {result.skipped > 0 ? `, skipped ${result.skipped}` : ""}.
          {result.errors.length > 0 && ` First issue: ${result.errors[0]}`}
        </p>
      )}
    </div>
  );
}
