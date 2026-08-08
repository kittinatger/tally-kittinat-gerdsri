"use client";

import { describeFetchError } from "@/lib/fetch-error";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

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
          <span className="flex h-8 w-8 shrink-0 items-center justify-center text-ink-soft">
            <svg viewBox="0 0 20.2832 27.1875" fill="currentColor" className="h-5 w-5">
              <path d="M19.9219 25.6201C19.9219 24.7412 19.2578 24.0527 18.3789 24.0527L1.5625 24.0527C0.673828 24.0527 0 24.7412 0 25.6201C0 26.499 0.673828 27.1875 1.5625 27.1875L18.3789 27.1875C19.2578 27.1875 19.9219 26.499 19.9219 25.6201ZM1.53809 12.5684C0.65918 12.5684 0 13.2178 0 14.1309C0 14.5605 0.166016 14.9561 0.50293 15.293L8.76953 23.5645C9.07227 23.877 9.52637 24.0576 9.96582 24.0576C10.4053 24.0576 10.8545 23.877 11.1621 23.5645L19.4238 15.293C19.7559 14.9561 19.9219 14.5605 19.9219 14.1309C19.9219 13.2178 19.2627 12.5684 18.3887 12.5684C17.9102 12.5684 17.5195 12.7734 17.2314 13.0713L14.1748 16.1084L9.96582 20.9131L5.75195 16.1084L2.69043 13.0713C2.40723 12.7734 2.0166 12.5684 1.53809 12.5684ZM11.3916 21.1328L11.582 16.4453L11.582 1.7041C11.582 0.708008 10.9277 0.0341797 9.96582 0.0341797C8.99902 0.0341797 8.34961 0.708008 8.34961 1.7041L8.34961 16.4453L8.53516 21.1328C8.57422 21.9189 9.17969 22.5586 9.96582 22.5586C10.752 22.5586 11.3574 21.9189 11.3916 21.1328Z" />
            </svg>
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
