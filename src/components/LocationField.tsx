"use client";

import { useState } from "react";
import { CrosshairIcon, MapPinIcon, XIcon } from "@phosphor-icons/react/dist/ssr";
import { useT } from "@/lib/language-context";

const inputClass =
  "w-full rounded-card border border-surface-line bg-surface-soft px-3.5 py-2.5 text-base text-surface-foreground outline-none transition focus:border-surface-accent focus:ring-2 focus:ring-surface-accent/20";

export type LocationValue = { locationName: string; latitude: number | null; longitude: number | null };

// Optional "where was this" for a transaction: a free-text place and/or a
// pinned position from the device's location. Coordinates are only ever
// read on an explicit tap — never in the background.
export default function LocationField({
  value,
  onChange,
  labelClass,
}: {
  value: LocationValue;
  onChange: (value: LocationValue) => void;
  labelClass: string;
}) {
  const t = useT();
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pinned = value.latitude != null && value.longitude != null;

  function useCurrentLocation() {
    if (!("geolocation" in navigator)) {
      setError(t("form.locationUnavailable"));
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        onChange({
          ...value,
          latitude: Number(pos.coords.latitude.toFixed(6)),
          longitude: Number(pos.coords.longitude.toFixed(6)),
        });
      },
      (err) => {
        setLocating(false);
        setError(err.code === err.PERMISSION_DENIED ? t("form.locationDenied") : t("form.locationUnavailable"));
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  }

  return (
    <div>
      <label className={labelClass} htmlFor="location">
        {t("form.location")}
      </label>
      <div className="flex gap-2">
        <input
          id="location"
          value={value.locationName}
          onChange={(e) => onChange({ ...value, locationName: e.target.value })}
          placeholder={t("form.locationPlaceholder")}
          maxLength={200}
          autoComplete="off"
          className={inputClass}
        />
        <button
          type="button"
          onClick={useCurrentLocation}
          disabled={locating}
          aria-label={t("form.useCurrentLocation")}
          title={t("form.useCurrentLocation")}
          className="flex w-11 shrink-0 items-center justify-center rounded-card border border-surface-line bg-surface-soft text-surface-foreground-soft transition hover:border-surface-accent hover:text-surface-accent disabled:opacity-60"
        >
          <CrosshairIcon weight="fill" aria-hidden="true" className={`h-5 w-5 ${locating ? "animate-pulse" : ""}`} />
        </button>
      </div>
      {pinned && (
        <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-surface-accent/10 py-1 pl-2.5 pr-1 text-xs font-semibold text-surface-accent">
          <MapPinIcon weight="fill" aria-hidden="true" className="h-3.5 w-3.5" />
          {t("form.locationPinned")}
          <button
            type="button"
            onClick={() => onChange({ ...value, latitude: null, longitude: null })}
            aria-label={t("form.locationRemovePin")}
            className="flex h-5 w-5 items-center justify-center rounded-full transition hover:bg-surface-accent/15"
          >
            <XIcon weight="bold" aria-hidden="true" className="h-3 w-3" />
          </button>
        </div>
      )}
      {error && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
