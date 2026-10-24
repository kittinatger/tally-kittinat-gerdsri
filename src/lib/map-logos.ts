// Logos for map providers that Simple Icons does not include, taken from
// open icon sets via Iconify (sources and licences noted per entry; see
// .github/ACKNOWLEDGMENTS.md). "color" logos keep their own colours and sit
// on a white tile; "mono" ones are line drawings shown in white on the
// brand colour (sampled from each company's own app icon or site).
import type { MapsProvider } from "@/lib/maps-app";

export type ExtraMapLogo = { viewBox: string; body: string; mode: "color" | "mono"; hex: string | null };

export const EXTRA_MAP_LOGOS: Partial<Record<MapsProvider, ExtraMapLogo>> = {
  // Maps.me logo from gilbarbara/logos (CC0)
  mapsme: {
    viewBox: "0 0 256 256",
    body: "<path fill=\"#4cd960\" d=\"M256 128c0 70.692-57.308 128-128 128S0 198.692 0 128S57.308 0 128 0s128 57.308 128 128\"/><path fill=\"#fff\" d=\"M81.354 154.734a1.287 1.287 0 0 0-1.827-.009l-21.211 21.201l1.372 6.51c2.152 11.202 13.079 18.949 24.282 16.797l32.5-6.245a1.124 1.124 0 0 0 .59-1.891zm-6.341-4.857a1.367 1.367 0 0 0 .01-1.927l-24.13-24.572c-.949-.966-2.574-.113-2.318 1.217l7.839 40.801c.207 1.076 1.532 1.484 2.308.711zm38.133-40.32a1.64 1.64 0 0 0 2.325.011l37.974-37.832c.896-.893.095-2.408-1.148-2.169L88.649 81.796a1.284 1.284 0 0 0-.673 2.161zm73.349 7.289l24.418 24.569c.8.805 2.159.09 1.949-1.025l-7.798-41.45a1.152 1.152 0 0 0-1.942-.606l-16.617 16.413a1.48 1.48 0 0 0-.01 2.099m-32.93-33.625l26.125 26.724a1.61 1.61 0 0 0 2.284.018l21.137-20.921l-1.333-7.933c-2.153-11.202-12.713-18.607-23.915-16.454l-9.493 1.715l-14.784 14.578a1.61 1.61 0 0 0-.021 2.273m-71.918 59.512l26.628-26.018a1.77 1.77 0 0 0 .025-2.51L78.608 84.006l-16.169 2.826c-10.572 2.031-17.757 11.318-16.724 21.835l33.429 34.04a1.773 1.773 0 0 0 2.503.026m66.703.96l27.125-26.896c.456-.452.46-1.188.009-1.645l-27.031-27.428a1.164 1.164 0 0 0-1.653-.005l-26.976 26.976a1.164 1.164 0 0 0-.007 1.64l26.883 27.347a1.163 1.163 0 0 0 1.65.011m-.024 11.174a1.3 1.3 0 0 0-1.85-.012l-27.037 26.967a1.3 1.3 0 0 0-.002 1.84l7.156 7.179l45.44-8.747a1.322 1.322 0 0 0 .696-2.222zM215.704 156l-33.794-34.296a1.49 1.49 0 0 0-2.122-.005l-26.467 26.604a1.494 1.494 0 0 0-.006 2.101l29.074 29.577l17.004-3.268c10.053-1.931 16.536-10.792 16.311-20.713m-101.778-14.444a7.555 7.555 0 1 0 0 15.111a7.555 7.555 0 0 0 7.555-7.556a7.554 7.554 0 0 0-7.555-7.555m-21.687-64.37l6.282-1.372a1.62 1.62 0 0 0 1.273-1.466l-.09-2.866c.17-2.265 1.318-4.591 2.789-6.321c1.728-2.033 3.741-3.625 6.293-4.14l15.186-3.111c3.425-.691 8.324.905 10.991 3.794a16.8 16.8 0 0 1 3.131 5.107c.231.598.85.95 1.481.835l6.158-1.125a1.32 1.32 0 0 0 1.057-1.583c-.364-1.622-1.478-4.672-4.864-9.012c-3.63-4.889-12.745-7.978-19.354-6.644L107.617 52.3c-7.441 1.502-14.061 6.959-15.839 14.589c-.997 3.043-1.028 7.09-.961 9.192a1.17 1.17 0 0 0 1.422 1.105\"/>",
    mode: "color",
    hex: null,
  },
  // Yandex logo from thesvg.org (MIT)
  yandex: {
    viewBox: "0 0 24 24",
    body: "<path fill=\"#fb3e1c\" fill-rule=\"evenodd\" d=\"M16.376 12.644L21 2h-3.842l-4.624 10.644zM13.915 24v-3.733c0-2.822-.352-3.64-1.407-5.988L6.933 2H3l7.124 15.709V24h3.79z\"/>",
    mode: "color",
    hex: null,
  },
  // Citymapper mark from Tabler Icons (MIT)
  citymapper: {
    viewBox: "0 0 24 24",
    body: "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M3 11a1 1 0 1 1-1 1.013a1 1 0 0 1 1-1zm18 0a1 1 0 1 1-1 1.013a1 1 0 0 1 1-1zM8 12h8m-3-3l3 3l-3 3\"/>",
    mode: "mono",
    hex: "36A52E",
  },
  // 2GIS app icon from Arcticons (CC BY-SA 4.0)
  dgis: {
    viewBox: "0 0 48 48",
    body: "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M38.5 5.5h-29c-2.2 0-4 1.8-4 4v29c0 2.2 1.8 4 4 4h29c2.2 0 4-1.8 4-4v-29c0-2.2-1.8-4-4-4\"/><path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M25.579 36.142c-.041-4.789 1.062-8.746 7.08-8.497c8.587-21.882-26.423-21.048-17.09-.131c2.829-.176 7.52 1.509 6.719 9.146M42.5 33.479l-37 5.824m0-28.263l12.345 2.29m14.51 2.2L42.5 17.011\"/>",
    mode: "mono",
    hex: "19AA1E",
  },
  // Mapy.com app icon from Arcticons (CC BY-SA 4.0)
  mapy: {
    viewBox: "0 0 48 48",
    body: "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M5.88 42.05c5.91-13.85 9.24-22.24 7.82-33c-.77-5.81 3.94-5.36 6.09-2.68c2.71 3.38 6.63 12.85 7.71 15.14a94 94 0 0 0 9.9-11.12c2.28-3 5 1.85 4.91 4.34l-.42 20.72c-.08 3.87-1.57 4.55-2.63 4.55c-1.75 0-2.69-1.13-3-4c-.56-4.62-.1-14.9-.1-14.9L27.33 29c-3.39 3-5.19-6.32-7.79-9.49c-1.8 7.71-3.33 16-6.75 21.07c-.73 1.07-8.42 5.02-6.91 1.47\"/>",
    mode: "mono",
    hex: "1EAE00",
  },
  // Moovit app icon from Arcticons (CC BY-SA 4.0)
  moovit: {
    viewBox: "0 0 48 48",
    body: "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M24 43.5s15.496-12.013 15.496-23.504a15.496 15.496 0 0 0-30.992 0C8.504 31.487 24 43.5 24 43.5\"/><circle cx=\"17.203\" cy=\"18.555\" r=\".75\" fill=\"currentColor\"/><path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M28.75 22.322A8 8 0 0 1 24 24a8 8 0 0 1-4.75-1.678\"/><circle cx=\"30.797\" cy=\"18.555\" r=\".75\" fill=\"currentColor\"/>",
    mode: "mono",
    hex: "FF6400",
  },
  // Amap (AutoNavi) app icon from Arcticons (CC BY-SA 4.0)
  amap: {
    viewBox: "0 0 48 48",
    body: "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M15.011 30.09L5.5 23.01l37-16.394l-8.736 34.768l-15.51-10.268L42.5 6.616Z\"/><path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"m15.011 30.09l.865 9.295l2.378-8.269\"/>",
    mode: "mono",
    hex: "0185FE",
  },
};
