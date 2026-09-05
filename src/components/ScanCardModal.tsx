"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";
import { describeMediaError } from "@/lib/media-error";
import { decodePassImage, toMembershipFormat } from "@/lib/decode-pass-image";
import { CloseIcon, ImageIcon } from "@/lib/icons";
import { useT } from "@/lib/language-context";
import type { MembershipCodeFormat } from "@/lib/memberships";

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
    const result = await decodePassImage(file);
    if (result) {
      onScanned(result);
    } else {
      setPhotoError(t("membership.scanPhotoError"));
    }
    setDecodingPhoto(false);
  }

  // Portaled to document.body — see Modal.tsx/ImageCropModal.tsx's own
  // comments for why. This one in particular is now routinely opened
  // *on top of* an already-open MembershipCardModal (which is itself
  // portaled) rather than replacing it, so that pass's fields survive a
  // rescan — without its own portal, this rendered inside WalletPageView's
  // normal DOM position, and any ancestor establishing a stacking context
  // there (even with the same z-50) could put it visually *behind* the
  // body-level modal it was supposed to be covering.
  return createPortal(
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
    </div>,
    document.body,
  );
}
