import { useSyncExternalStore } from "react";

// Which maps app "Open in Maps" hands a location to. Per device (Apple Maps
// only exists on Apple devices), stored in localStorage like the theme.
export type MapsAppPreference = "auto" | "apple" | "google";

const STORAGE_KEY = "tally-maps-app";
const CHANGE_EVENT = "tally-maps-app-change";

function readPreference(): MapsAppPreference {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "apple" || v === "google" ? v : "auto";
  } catch {
    return "auto";
  }
}

export function setMapsAppPreference(pref: MapsAppPreference) {
  try {
    if (pref === "auto") localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, pref);
  } catch {
    // Storage unavailable — the choice just won't persist.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function useMapsAppPreference(): MapsAppPreference {
  return useSyncExternalStore(subscribe, readPreference, () => "auto");
}

function isAppleDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  // iPadOS reports itself as a Mac, so "Macintosh" covers iPad too.
  return /iPhone|iPad|iPod|Macintosh/i.test(navigator.userAgent);
}

export function resolveMapsApp(pref: MapsAppPreference): "apple" | "google" {
  if (pref !== "auto") return pref;
  return isAppleDevice() ? "apple" : "google";
}

export function mapsUrl(
  app: "apple" | "google",
  place: { name?: string | null; latitude?: number | null; longitude?: number | null },
): string | null {
  const hasCoords = place.latitude != null && place.longitude != null;
  const name = place.name?.trim() || null;
  if (!hasCoords && !name) return null;
  if (app === "apple") {
    const params = new URLSearchParams();
    if (hasCoords) params.set("ll", `${place.latitude},${place.longitude}`);
    params.set("q", name ?? `${place.latitude},${place.longitude}`);
    return `https://maps.apple.com/?${params.toString()}`;
  }
  const query = hasCoords ? `${place.latitude},${place.longitude}` : encodeURIComponent(name!);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}
