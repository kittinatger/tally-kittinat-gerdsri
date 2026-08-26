"use client";

import { useRef, useState } from "react";

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

// Phone camera photos routinely come in at several MB and thousands of
// pixels per side — stored and served as-is, that meant every place the
// avatar renders (Settings nav, Welcome widget, this uploader) had to
// download and decode a multi-megabyte image just to paint a 32-128px
// circle, with no caching (the profile-picture endpoint is deliberately
// no-store — see route.ts). Downscaling to a small square JPEG here, once,
// at upload time fixes it at the source without touching the server or
// adding an image-processing dependency.
const MAX_DIMENSION = 512;
const JPEG_QUALITY = 0.85;

// A picture uploaded before this resize step existed (or from a stale
// client) can still be sitting on the server at full camera resolution —
// this fix only shrinks pictures uploaded from now on, it doesn't
// retroactively touch what's already stored. A resized 512px JPEG avatar
// is well under this, so anything larger is worth offering to re-save.
const OPTIMIZE_THRESHOLD_BYTES = 150 * 1024;

function resizeImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
      const width = Math.round(img.width * scale);
      const height = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not process image"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Could not process image"))),
        "image/jpeg",
        JPEG_QUALITY,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read that image"));
    };
    img.src = objectUrl;
  });
}

export default function ProfilePictureUploader({
  onSuccess,
}: {
  onSuccess?: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pictureUrl, setPictureUrl] = useState<string | null>(null);
  const [pictureBlob, setPictureBlob] = useState<Blob | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing picture on mount
  useState(() => {
    loadProfilePicture();
  });

  async function loadProfilePicture() {
    try {
      const res = await fetch("/api/account/profile-picture", { cache: "no-store" });
      if (res.ok) {
        const blob = await res.blob();
        setPictureBlob(blob);
        setPictureUrl(URL.createObjectURL(blob));
      } else {
        setPictureBlob(null);
      }
    } catch (err) {
      console.error("Failed to load profile picture:", err);
    }
  }

  const canOptimize = (pictureBlob?.size ?? 0) > OPTIMIZE_THRESHOLD_BYTES;

  async function handleOptimize() {
    if (!pictureBlob) return;
    setIsLoading(true);
    setError(null);
    try {
      const file = new File([pictureBlob], "profile.jpg", { type: "image/jpeg" });
      const resized = await resizeImage(file);
      const formData = new FormData();
      formData.append("image", resized, "profile.jpg");

      const res = await fetch("/api/account/profile-picture", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Could not optimize picture");
      }
      await loadProfilePicture();
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not optimize picture");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.currentTarget.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const resized = await resizeImage(file);
      const formData = new FormData();
      formData.append("image", resized, "profile.jpg");

      const res = await fetch("/api/account/profile-picture", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      // Reload the picture
      await loadProfilePicture();
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRemove() {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/account/profile-picture", {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to remove picture");

      setPictureUrl(null);
      setPictureBlob(null);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove picture");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-4 rounded-card border border-surface-line bg-surface p-6">
        {pictureUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={pictureUrl}
            alt="Profile picture"
            className="h-32 w-32 rounded-full object-cover ring-4 ring-surface-accent"
          />
        ) : (
          <div className="flex h-32 w-32 items-center justify-center rounded-full bg-bg-soft text-surface-foreground-soft">
            <CameraIcon />
          </div>
        )}

        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleUpload}
            disabled={isLoading}
            className="sr-only"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-full bg-surface-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-surface-accent/90 disabled:opacity-50"
          >
            <CameraIcon />
            {pictureUrl ? "Change" : "Upload"}
          </button>

          {pictureUrl && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={isLoading}
              className="flex items-center gap-2 rounded-full border border-surface-line bg-surface px-4 py-2 text-sm font-semibold text-red-600 transition hover:border-red-400 dark:text-red-400 disabled:opacity-50"
            >
              <TrashIcon />
              Remove
            </button>
          )}
        </div>

        {canOptimize && (
          <div className="flex w-full items-center gap-2 rounded-card border border-line bg-bg-soft px-3.5 py-2.5 text-xs text-surface-foreground-soft">
            <span className="flex-1">This photo is larger than it needs to be, which can slow down loading.</span>
            <button
              type="button"
              onClick={handleOptimize}
              disabled={isLoading}
              className="shrink-0 font-semibold text-surface-accent transition hover:underline disabled:opacity-50"
            >
              {isLoading ? "Optimizing…" : "Optimize"}
            </button>
          </div>
        )}

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      </div>
    </div>
  );
}
