"use client";

import { useRef, useState } from "react";
import { UploadIcon } from "@/lib/icons";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
const MAX_BYTES = 8 * 1024 * 1024;
const MAX_FILES = 20;

export default function ReceiptDropzone({ onFilesSelected }: { onFilesSelected: (files: File[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    const overflow = Math.max(0, files.length - MAX_FILES);
    const limited = files.slice(0, MAX_FILES);
    const valid: File[] = [];
    let wrongType = 0;
    let tooLarge = 0;

    for (const file of limited) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        wrongType++;
        continue;
      }
      if (file.size > MAX_BYTES) {
        tooLarge++;
        continue;
      }
      valid.push(file);
    }

    if (valid.length === 0) {
      setError(
        wrongType > 0 && tooLarge > 0
          ? "None of those files could be used — unsupported type and too large. Use JPEG, PNG, WEBP, or HEIC images under 8MB."
          : wrongType > 0
            ? "None of those files could be used — unsupported type. Use JPEG, PNG, WEBP, or HEIC images."
            : "None of those files could be used — all over the 8MB limit."
      );
      return;
    }

    // Reports each skip reason separately (rather than one combined count)
    // so it's clear which fix applies — re-export as JPEG vs. pick fewer/
    // smaller files.
    const notes: string[] = [];
    if (wrongType > 0) notes.push(`${wrongType} unsupported type`);
    if (tooLarge > 0) notes.push(`${tooLarge} over 8MB`);
    if (overflow > 0) notes.push(`${overflow} over the ${MAX_FILES}-file limit`);
    setError(notes.length > 0 ? `Skipped: ${notes.join(", ")}.` : null);
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
            ? "border-amber-400 bg-amber-500/10"
            : "border-surface-line hover:border-amber-400 hover:bg-amber-500/5"
        }`}
      >
        <span className="mb-1 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
          <UploadIcon className="h-7 w-7" />
        </span>
        <p className="text-sm font-semibold text-surface-foreground">
          Drop receipts or income documents here, or tap to choose
        </p>
        <p className="text-xs text-surface-foreground-soft">
          Select multiple to add them as a batch. Expense or income — we&apos;ll detect which. JPEG, PNG, WEBP, or
          HEIC, up to 8MB each
        </p>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            cameraInputRef.current?.click();
          }}
          className="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-amber-600"
        >
          Take Photo
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {/* Separate single-file input with `capture` — on some browsers
            (notably Samsung Internet) the default file picker doesn't
            surface a camera option unless this attribute is set, and
            combining `capture` with `multiple` isn't reliably supported. */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
