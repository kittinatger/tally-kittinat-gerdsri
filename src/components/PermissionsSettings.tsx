"use client";

import { useEffect, useRef, useState } from "react";
import NotificationSettings from "./NotificationSettings";
import { describeMediaError } from "@/lib/media-error";
import { badgeClasses } from "@/lib/category-styles";
import { MicIcon } from "@/lib/icons";
import { useT } from "@/lib/language-context";
import { CameraIcon as PhCameraIcon, ImagesIcon as PhImagesIcon } from "@phosphor-icons/react/dist/ssr";

type PermissionStatus = "granted" | "denied" | "prompt" | "unsupported";

function CameraIcon() {
  return <PhCameraIcon weight="fill" aria-hidden="true" className="h-4.5 w-4.5" />;
}

function PhotosIcon() {
  return <PhImagesIcon weight="fill" aria-hidden="true" className="h-4.5 w-4.5" />;
}

export default function PermissionsSettings({ hasEmail }: { hasEmail: boolean }) {
  const t = useT();
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
    } catch (err) {
      setMicStatus("denied");
      setMicError(describeMediaError(err, "microphone"));
    }
  }

  async function requestCameraAccess() {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((t) => t.stop());
      setCameraStatus("granted");
    } catch (err) {
      setCameraStatus("denied");
      setCameraError(describeMediaError(err, "camera"));
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
    <div className="space-y-6">
      <div>
        <h3 className="mb-1 px-1 text-xs font-semibold uppercase tracking-wide text-ink-soft">{t("permissions.deviceAccess")}</h3>
        <p className="mb-3 px-1 text-[11px] leading-snug text-ink-soft">
          {t("permissions.deviceAccessDesc")}
        </p>
        <div className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
          <PermissionRow
            icon={<MicIcon className="h-4.5 w-4.5" />}
            label={t("permissions.microphone")}
            description={t("permissions.microphoneDesc")}
            status={micStatus}
            onRequest={requestMicAccess}
            error={micError}
          />
          <PermissionRow
            icon={<CameraIcon />}
            label={t("permissions.camera")}
            description={t("permissions.cameraDesc")}
            status={cameraStatus}
            onRequest={requestCameraAccess}
            error={cameraError}
          />
          <PermissionRow
            icon={<PhotosIcon />}
            label={t("permissions.photos")}
            description={t("permissions.photosDesc")}
            status={photosStatus}
            onRequest={requestPhotosAccess}
          />
        </div>
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

      <div>
        <h3 className="mb-1 px-1 text-xs font-semibold uppercase tracking-wide text-ink-soft">{t("permissions.notifications")}</h3>
        <div className="overflow-hidden rounded-card border border-line bg-surface p-4">
          <NotificationSettings hasEmail={hasEmail} />
        </div>
      </div>
    </div>
  );
}

function PermissionRow({
  icon,
  label,
  description,
  status,
  onRequest,
  error,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  status: PermissionStatus;
  onRequest: () => void;
  error?: string | null;
}) {
  const t = useT();
  return (
    <div className="p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
              status === "granted"
                ? badgeClasses("emerald")
                : status === "denied"
                  ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                  : badgeClasses("slate")
            }`}
          >
            {icon}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">{label}</p>
            <p className="text-[11px] leading-snug text-ink-soft">{description}</p>
          </div>
        </div>
        {status === "granted" ? (
          <span className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${badgeClasses("emerald")}`}>
            {t("permissions.granted")}
          </span>
        ) : (
          <button
            type="button"
            onClick={onRequest}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              status === "denied"
                ? "border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20"
                : "border-line text-foreground hover:bg-[var(--nav-hover-bg)]"
            }`}
          >
            {status === "denied" ? t("permissions.blockedRetry") : t("permissions.requestAccess")}
          </button>
        )}
      </div>
      {error && <p className="mt-1.5 pl-12 text-xs text-red-600 dark:text-red-400 animate-[fade-in_0.15s_ease-out] motion-reduce:animate-none">{error}</p>}
    </div>
  );
}
