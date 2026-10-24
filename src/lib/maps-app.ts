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

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent) || (/Macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
}

function isAndroid(): boolean {
  return typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);
}

/**
 * Opens a place in the chosen maps *app*. Plain https map links don't do
 * that from an installed (home-screen) web app — iOS opens them in an in-app
 * browser sheet showing the map website — so phones get each app's own URL
 * scheme instead: maps:// for Apple Maps, comgooglemaps:// for Google Maps on
 * iOS (falling back to the website if the app isn't installed), and a geo:
 * link on Android. Desktops open the website in a new tab.
 * Returns false when it didn't handle the click (caller follows the link).
 */
export function openInMapsApp(
  app: "apple" | "google",
  place: { name?: string | null; latitude?: number | null; longitude?: number | null },
): boolean {
  const hasCoords = place.latitude != null && place.longitude != null;
  const name = place.name?.trim() || null;
  if (!hasCoords && !name) return false;
  const coords = hasCoords ? `${place.latitude},${place.longitude}` : null;
  const webUrl = mapsUrl(app, place);

  if (app === "apple" && (isIOS() || /Macintosh/i.test(navigator.userAgent))) {
    const params = new URLSearchParams();
    if (coords) params.set("ll", coords);
    params.set("q", name ?? coords!);
    window.location.href = `maps://?${params.toString()}`;
    return true;
  }

  if (app === "google" && isIOS()) {
    const params = new URLSearchParams();
    params.set("q", coords ?? name!);
    if (coords) params.set("center", coords);
    // If the Google Maps app isn't installed the scheme does nothing and the
    // page stays visible — fall back to the website after a moment.
    const fallback = window.setTimeout(() => {
      if (!document.hidden && webUrl) window.location.href = webUrl;
    }, 1200);
    document.addEventListener("visibilitychange", () => window.clearTimeout(fallback), { once: true });
    window.location.href = `comgooglemaps://?${params.toString()}`;
    return true;
  }

  if (isAndroid()) {
    const label = name ? `(${encodeURIComponent(name)})` : "";
    window.location.href = coords ? `geo:${coords}?q=${coords}${label}` : `geo:0,0?q=${encodeURIComponent(name!)}`;
    return true;
  }

  return false;
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
