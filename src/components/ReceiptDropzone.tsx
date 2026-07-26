"use client";

import { useRef, useState } from "react";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
const MAX_BYTES = 8 * 1024 * 1024;

export default function ReceiptDropzone({ onFileSelected }: { onFileSelected: (file: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Unsupported file type. Use JPEG, PNG, WEBP, or HEIC.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Image is too large (max 8MB).");
      return;
    }
    setError(null);
    onFileSelected(file);
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
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${
          dragOver
            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
            : "border-neutral-300 hover:border-emerald-400 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800/50"
        }`}
      >
        <span className="text-3xl">📷</span>
        <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Drop a receipt photo here, or tap to choose
        </p>
        <p className="text-xs text-neutral-400 dark:text-neutral-500">JPEG, PNG, WEBP, or HEIC — up to 8MB</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
