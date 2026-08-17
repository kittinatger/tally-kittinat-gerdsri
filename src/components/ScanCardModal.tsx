"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, BarcodeFormat, type IScannerControls } from "@zxing/browser";
import { describeMediaError } from "@/lib/media-error";
import { CloseIcon, ImageIcon } from "@/lib/icons";
import { useT } from "@/lib/language-context";
import type { MembershipCodeFormat } from "@/lib/memberships";

// Anything the multi-format reader can decode that isn't one of our four
// supported symbologies (Code 39, ITF, Codabar, EAN-8, UPC-E, ...) still
// gets treated as a usable linear-barcode value — rendered back as
// CODE128, which is the most broadly compatible fallback — rather than
// rejecting a successful scan outright.
function toMembershipFormat(format: BarcodeFormat): MembershipCodeFormat {
  switch (format) {
    case BarcodeFormat.QR_CODE:
      return "qr";
    case BarcodeFormat.EAN_13:
      return "ean13";
    case BarcodeFormat.UPC_A:
      return "upc";
    default:
      return "code128";
  }
}

export default function ScanCardModal({
  onClose,
  onScanned,
}: {
  onClose: () => void;
  onScanned: (result: { value: string; format: MembershipCodeFormat }) => void;
}) {
  const t = useT();
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [decodingPhoto, setDecodingPhoto] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // Deferred by a microtask so the unsupported-browser setError below
    // doesn't run synchronously in the effect body (same pattern used
    // elsewhere in this app to avoid the cascading-render lint rule).
    Promise.resolve().then(() => {
      if (cancelled) return;
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        setCameraError(t("membership.scanUnsupported"));
        return;
      }
      const reader = new BrowserMultiFormatReader();
      reader
        .decodeFromConstraints({ video: { facingMode: "environment" } }, videoRef.current ?? undefined, (result, err, controls) => {
          controlsRef.current = controls;
          if (cancelled || !result) return;
          controls.stop();
          onScanned({ value: result.getText(), format: toMembershipFormat(result.getBarcodeFormat()) });
        })
        .catch((err) => {
          if (!cancelled) setCameraError(describeMediaError(err, "camera"));
        });
    });
    return () => {
      cancelled = true;
      controlsRef.current?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onScanned intentionally not re-run on every parent render
  }, [t]);

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow picking the same file again after a failed decode
    if (!file) return;
    setPhotoError(null);
    setDecodingPhoto(true);
    const url = URL.createObjectURL(file);
    try {
      const reader = new BrowserMultiFormatReader();
      const result = await reader.decodeFromImageUrl(url);
      onScanned({ value: result.getText(), format: toMembershipFormat(result.getBarcodeFormat()) });
    } catch {
      setPhotoError(t("membership.scanPhotoError"));
    } finally {
      URL.revokeObjectURL(url);
      setDecodingPhoto(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex items-center justify-between px-4 py-3">
        <p className="text-sm font-semibold text-white">{t("membership.scanTitle")}</p>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("common.cancel")}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
        >
          <CloseIcon />
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        {cameraError ? (
          <div className="max-w-xs px-6 text-center">
            <p className="text-sm text-white">{cameraError}</p>
          </div>
        ) : (
          <>
            <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
            <div className="pointer-events-none absolute inset-8 rounded-2xl border-2 border-white/70" />
          </>
        )}
        {decodingPhoto && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <p className="text-sm text-white">{t("membership.decodingPhoto")}</p>
          </div>
        )}
      </div>

      <div className="mx-4 mb-6 space-y-2">
        {photoError && <p className="text-center text-sm text-red-400">{photoError}</p>}
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelected} className="hidden" />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={decodingPhoto}
          className="flex w-full items-center justify-center gap-1.5 rounded-full border border-white/30 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-60"
        >
          <ImageIcon className="h-4 w-4" />
          {t("membership.choosePhoto")}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-black"
        >
          {t("membership.typeItInstead")}
        </button>
      </div>
    </div>
  );
}
