"use client";

import { useRef, useState } from "react";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
const MAX_BYTES = 8 * 1024 * 1024;
const MAX_FILES = 20;

export default function ReceiptDropzone({ onFilesSelected }: { onFilesSelected: (files: File[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList).slice(0, MAX_FILES);
    const valid: File[] = [];
    let skipped = 0;

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type) || file.size > MAX_BYTES) {
        skipped++;
        continue;
      }
      valid.push(file);
    }

    if (valid.length === 0) {
      setError("None of those files could be used. Use JPEG, PNG, WEBP, or HEIC images under 8MB.");
      return;
    }

    setError(
      skipped > 0 ? `${skipped} file${skipped === 1 ? "" : "s"} skipped (unsupported type or too large).` : null,
    );
    onFilesSelected(valid);
  }

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        role="button"
        tabIndex={0}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed px-6 py-10 text-center transition ${
          dragOver
            ? "border-surface-accent bg-[var(--surface-nav-hover)]"
            : "border-surface-line hover:border-surface-accent hover:bg-surface-soft"
        }`}
      >
        <span className="text-3xl">📷</span>
        <p className="text-sm font-semibold text-surface-foreground">
          Drop receipts or income documents here, or tap to choose
        </p>
        <p className="text-xs text-surface-foreground-soft">
          Select multiple to add them as a batch. Expense or income — we&apos;ll detect which. JPEG, PNG, WEBP, or
          HEIC, up to 8MB each
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
