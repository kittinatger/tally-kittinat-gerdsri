import { useSyncExternalStore } from "react";

// Which maps app "Open in Maps" hands a location to. Per device (most of these
// apps are installed per device, and Apple Maps only exists on Apple devices),
// stored in localStorage like the theme.
export const MAPS_PROVIDERS = [
  "apple",
  "google",
  "waze",
  "baidu",
  "amap",
  "naver",
  "kakao",
  "yandex",
  "dgis",
  "here",
  "mapy",
  "citymapper",
  "moovit",
  "mapsme",
  "organic",
  "osm",
] as const;

export type MapsProvider = (typeof MAPS_PROVIDERS)[number];
export type MapsAppPreference = "auto" | MapsProvider;

export type Place = { name?: string | null; latitude?: number | null; longitude?: number | null };

/** Brand names are never translated; Apple/Google use their localized names via i18n instead. */
export const MAPS_PROVIDER_NAMES: Record<Exclude<MapsProvider, "apple" | "google">, string> = {
  waze: "Waze",
  baidu: "Baidu Maps",
  amap: "Amap (Gaode)",
  naver: "Naver Map",
  kakao: "Kakao Map",
  yandex: "Yandex Maps",
  dgis: "2GIS",
  here: "HERE WeGo",
  mapy: "Mapy.com",
  citymapper: "Citymapper",
  moovit: "Moovit",
  mapsme: "Maps.me",
  organic: "Organic Maps",
  osm: "OpenStreetMap",
};

const STORAGE_KEY = "tally-maps-app";
const CHANGE_EVENT = "tally-maps-app-change";

function isMapsProvider(value: string | null): value is MapsProvider {
  return value !== null && (MAPS_PROVIDERS as readonly string[]).includes(value);
}

function readPreference(): MapsAppPreference {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return isMapsProvider(v) ? v : "auto";
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

function parts(place: Place) {
  const hasCoords = place.latitude != null && place.longitude != null;
  return {
    lat: place.latitude ?? null,
    lng: place.longitude ?? null,
    coords: hasCoords ? `${place.latitude},${place.longitude}` : null,
    name: place.name?.trim() || null,
  };
}

const enc = encodeURIComponent;

function appleMapsQuery(coords: string | null, name: string | null): string {
  const params = new URLSearchParams();
  if (coords) params.set("ll", coords);
  params.set("q", name ?? coords!);
  return params.toString();
}

/** The provider's website for a place — the link's href, and the fallback when its app isn't installed. */
export function mapsUrl(provider: MapsProvider, place: Place): string | null {
  const { lat, lng, coords, name } = parts(place);
  if (!coords && !name) return null;
  switch (provider) {
    case "apple":
      return `https://maps.apple.com/?${appleMapsQuery(coords, name)}`;
    case "google":
      return `https://www.google.com/maps/search/?api=1&query=${coords ?? enc(name!)}`;
    case "waze":
      return coords ? `https://waze.com/ul?ll=${coords}&navigate=yes` : `https://waze.com/ul?q=${enc(name!)}`;
    case "baidu":
      return coords
        ? `https://api.map.baidu.com/marker?location=${coords}&title=${enc(name ?? coords)}&content=${enc(name ?? coords)}&output=html&coord_type=wgs84&src=tally`
        : `https://api.map.baidu.com/geocoder?address=${enc(name!)}&output=html&src=tally`;
    case "amap":
      return coords
        ? `https://uri.amap.com/marker?position=${lng},${lat}&name=${enc(name ?? coords)}&coordinate=wgs84&src=tally`
        : `https://uri.amap.com/search?keyword=${enc(name!)}&src=tally`;
    case "yandex":
      return coords ? `https://yandex.com/maps/?pt=${lng},${lat}&z=16&l=map` : `https://yandex.com/maps/?text=${enc(name!)}`;
    case "here":
      return coords
        ? `https://share.here.com/l/${coords}${name ? `,${enc(name)}` : ""}`
        : `https://wego.here.com/search/${enc(name!)}`;
    case "naver":
      return `https://map.naver.com/p/search/${enc(name ?? coords!)}`;
    case "kakao":
      return coords
        ? `https://map.kakao.com/link/map/${enc(name ?? "Location")},${lat},${lng}`
        : `https://map.kakao.com/link/search/${enc(name!)}`;
    case "dgis":
      return coords ? `https://2gis.com/geo/${lng},${lat}` : `https://2gis.com/search/${enc(name!)}`;
    case "mapy":
      return coords
        ? `https://mapy.com/fnc/v1/showmap?mapset=basic&center=${lng},${lat}&zoom=17&marker=true`
        : `https://mapy.com/fnc/v1/search?query=${enc(name!)}`;
    case "citymapper":
      return coords
        ? `https://citymapper.com/directions?endcoord=${coords}${name ? `&endname=${enc(name)}` : ""}`
        : `https://citymapper.com/directions?endaddress=${enc(name!)}`;
    case "moovit":
      return coords
        ? `https://moovitapp.com/?to=${enc(name ?? coords)}&tll=${lat}_${lng}`
        : `https://moovitapp.com/?to=${enc(name!)}`;
    case "mapsme":
    case "organic":
    case "osm":
      // Maps.me and Organic Maps have no simple web link for a point, so their
      // website fallback is OpenStreetMap, the map data both are built on.
      return coords
        ? `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`
        : `https://www.openstreetmap.org/search?query=${enc(name!)}`;
  }
}

/** The provider's own app URL scheme, or null if it has none (website only). */
function appScheme(provider: MapsProvider, place: Place): string | null {
  const { lat, lng, coords, name } = parts(place);
  switch (provider) {
    case "waze":
      return coords ? `waze://?ll=${coords}&navigate=yes` : `waze://?q=${enc(name!)}`;
    case "baidu":
      return coords
        ? `baidumap://map/marker?location=${coords}&title=${enc(name ?? coords)}&content=${enc(name ?? coords)}&coord_type=wgs84&src=tally`
        : `baidumap://map/geocoder?address=${enc(name!)}&src=tally`;
    case "amap": {
      if (!coords) return null;
      // dev=1 marks the coordinates as WGS-84 so Amap converts them.
      const base = isIOS() ? "iosamap://viewMap" : "androidamap://viewMap";
      return `${base}?sourceApplication=tally&poiname=${enc(name ?? coords)}&lat=${lat}&lon=${lng}&dev=1`;
    }
    case "yandex":
      return coords ? `yandexmaps://maps.yandex.ru/?pt=${lng},${lat}&z=16` : `yandexmaps://maps.yandex.ru/?text=${enc(name!)}`;
    case "here":
      return coords ? `here-location://${coords}${name ? `,${enc(name)}` : ""}` : null;
    case "naver":
      return coords
        ? `nmap://place?lat=${lat}&lng=${lng}&name=${enc(name ?? coords)}&appname=app.tally`
        : `nmap://search?query=${enc(name!)}&appname=app.tally`;
    case "kakao":
      return coords ? `kakaomap://look?p=${coords}` : `kakaomap://search?q=${enc(name!)}`;
    case "dgis":
      return coords ? `dgis://2gis.ru/geo/${lng},${lat}` : `dgis://2gis.ru/search/${enc(name!)}`;
    case "citymapper":
      return coords ? `citymapper://directions?endcoord=${coords}${name ? `&endname=${enc(name)}` : ""}` : null;
    case "moovit":
      return coords
        ? `moovit://directions?dest_lat=${lat}&dest_lon=${lng}${name ? `&dest_name=${enc(name)}` : ""}&partner_id=tally`
        : null;
    case "mapsme":
      return coords ? `mapsme://map?ll=${coords}${name ? `&n=${enc(name)}` : ""}&v=1` : `mapsme://search?query=${enc(name!)}`;
    case "organic":
      return coords ? `om://map?ll=${coords}${name ? `&n=${enc(name)}` : ""}&v=1` : `om://search?query=${enc(name!)}`;
    default:
      return null;
  }
}

// Tries an app's URL scheme; if the app isn't installed the page simply stays
// in the foreground, so after a moment fall back to the provider's website.
function launchWithFallback(scheme: string, webUrl: string | null) {
  const fallback = window.setTimeout(() => {
    if (!document.hidden && webUrl) window.location.href = webUrl;
  }, 1200);
  document.addEventListener("visibilitychange", () => window.clearTimeout(fallback), { once: true });
  window.location.href = scheme;
}

export function resolveMapsApp(pref: MapsAppPreference): MapsProvider {
  if (pref !== "auto") return pref;
  return isAppleDevice() ? "apple" : "google";
}

/**
 * Opens a place in a maps *app*. Plain https map links don't do that from an
 * installed (home-screen) web app — iOS opens them in an in-app browser sheet
 * showing the map website — so phones get each app's own URL scheme instead,
 * falling back to that provider's website if the app isn't installed.
 *
 * "auto" follows the device: Android gets a geo: link, which opens the
 * system's default maps app (or asks which to use); Apple devices open the
 * system Maps app; desktops open the Google Maps website. Desktops always
 * just follow the link to the provider's website.
 * Returns false when it didn't handle the click (caller follows the link).
 */
export function openInMapsApp(pref: MapsAppPreference, place: Place): boolean {
  const { coords, name } = parts(place);
  if (!coords && !name) return false;

  if (pref === "auto") {
    if (isAndroid()) {
      const label = name ? `(${enc(name)})` : "";
      window.location.href = coords ? `geo:${coords}?q=${coords}${label}` : `geo:0,0?q=${enc(name!)}`;
      return true;
    }
    if (isAppleDevice()) {
      window.location.href = `maps://?${appleMapsQuery(coords, name)}`;
      return true;
    }
    return false;
  }

  if (pref === "apple") {
    if (!isAppleDevice()) return false;
    window.location.href = `maps://?${appleMapsQuery(coords, name)}`;
    return true;
  }

  if (pref === "google") {
    if (isIOS()) {
      const params = new URLSearchParams({ q: coords ?? name! });
      if (coords) params.set("center", coords);
      launchWithFallback(`comgooglemaps://?${params.toString()}`, mapsUrl("google", place));
      return true;
    }
    if (isAndroid()) {
      // An intent pinned to the Google Maps package, with the website as the
      // browser's own fallback if the app isn't installed.
      window.location.href =
        `intent://maps.google.com/maps?q=${enc(coords ?? name!)}#Intent;scheme=https;package=com.google.android.apps.maps;` +
        `S.browser_fallback_url=${enc(mapsUrl("google", place)!)};end`;
      return true;
    }
    return false;
  }

  const scheme = appScheme(pref, place);
  if ((isIOS() || isAndroid()) && scheme) {
    launchWithFallback(scheme, mapsUrl(pref, place));
    return true;
  }
  return false;
}
