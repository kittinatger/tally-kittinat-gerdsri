"use client";

import { useEffect, useRef, useState } from "react";

type PermissionStatus = "granted" | "denied" | "prompt" | "unsupported";

export default function PermissionsSettings() {
  const [micStatus, setMicStatus] = useState<PermissionStatus>("unsupported");
  const [cameraStatus, setCameraStatus] = useState<PermissionStatus>("unsupported");
  const [photosStatus, setPhotosStatus] = useState<PermissionStatus>("prompt");
  const [micError, setMicError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const photosInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.permissions?.query) return;

    let cancelled = false;

    async function watch(name: "microphone" | "camera", setStatus: (s: PermissionStatus) => void) {
      try {
        const result = await navigator.permissions.query({ name: name as PermissionName });
        if (cancelled) return;
        setStatus(result.state as PermissionStatus);
        result.onchange = () => setStatus(result.state as PermissionStatus);
      } catch {
        // Some browsers (Safari) don't support querying 'microphone'/'camera' —
        // leave status as "unsupported" so the Request button is still offered.
      }
    }

    watch("microphone", setMicStatus);
    watch("camera", setCameraStatus);
    return () => {
      cancelled = true;
    };
  }, []);

  async function requestMicAccess() {
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setMicStatus("granted");
    } catch {
      setMicStatus("denied");
      setMicError("Microphone access was denied. Enable it for this site in your browser settings.");
    }
  }

  async function requestCameraAccess() {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((t) => t.stop());
      setCameraStatus("granted");
    } catch {
      setCameraStatus("denied");
      setCameraError("Camera access was denied. Enable it for this site in your browser settings.");
    }
  }

  function requestPhotosAccess() {
    // Browsers don't expose a queryable "photo library" permission the way
    // they do camera/microphone — picking a file is how consent happens, and
    // some mobile browsers show their own native photo-access prompt at this
    // point. A cancelled dialog isn't distinguishable from a denied one, so
    // this only ever moves forward to "granted", never to "denied".
    photosInputRef.current?.click();
  }

  return (
    <div className="rounded-card border border-line bg-surface p-5">
      <h3 className="mb-3.5 font-display text-xl text-foreground">Permissions</h3>
      <div className="space-y-2.5">
      <PermissionRow
        label="Microphone"
        description="Needed for voice entry."
        status={micStatus}
        onRequest={requestMicAccess}
      />
      {micError && <p className="text-xs text-red-600 dark:text-red-400">{micError}</p>}
      <PermissionRow
        label="Camera"
        description="Needed to take a photo of a receipt."
        status={cameraStatus}
        onRequest={requestCameraAccess}
      />
      {cameraError && <p className="text-xs text-red-600 dark:text-red-400">{cameraError}</p>}
      <PermissionRow
        label="Photos"
        description="Needed to attach a receipt image from your gallery."
        status={photosStatus}
        onRequest={requestPhotosAccess}
      />
      <input
        ref={photosInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) setPhotosStatus("granted");
          e.target.value = "";
        }}
      />
      </div>
    </div>
  );
}

function PermissionRow({
  label,
  description,
  status,
  onRequest,
}: {
  label: string;
  description: string;
  status: PermissionStatus;
  onRequest: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-[11px] leading-snug text-ink-soft">{description}</p>
      </div>
      {status === "granted" ? (
        <span className="shrink-0 rounded-full bg-navy/10 px-3 py-1.5 text-xs font-semibold text-navy">Granted</span>
      ) : (
        <button
          type="button"
          onClick={onRequest}
          className="shrink-0 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-[var(--nav-hover-bg)]"
        >
          {status === "denied" ? "Blocked — retry" : "Request access"}
        </button>
      )}
    </div>
  );
}
