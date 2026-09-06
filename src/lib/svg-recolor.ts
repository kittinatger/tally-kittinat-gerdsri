// Lets a user recolor their own uploaded custom SVG background (see
// CardPhotoScanModal's SVG upload path — it applies the raw file as-is via
// `{ pattern: "photo", photoDataUrl }`, unlike the built-in illustration
// patterns in card-backgrounds.ts, which already carry a structured
// `colors` array). A custom SVG has no such structure — its colors are
// just whatever color values happen to appear in the markup — so editing
// means: find them, let the user swap one for another, and re-serialize.

// Longest-first so the alternation's own \b check doesn't have to fall
// back through shorter matches first — an 8-digit hex (RGBA) or 4-digit
// hex (RGBA shorthand) is tried whole before any shorter prefix of it is.
const HEX_COLOR_RE = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})\b/g;
// rgb()/rgba() functional notation — common in design-tool SVG exports
// (Illustrator/Figma) that don't hex-encode fills.
const RGB_FUNC_RE = /rgba?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*(?:,\s*[\d.]+\s*)?\)/gi;
// The full CSS Color Module Level 4 named-color list — an SVG author can
// (and, especially for plain black/white fills, often does) write
// fill="white" instead of a hex/rgb value. Scoped to only match right
// after fill/stroke/stop-color (as an attribute or a CSS declaration) so
// a bare word match doesn't fire on unrelated text elsewhere in the file
// (an id="whiteboard", say).
const NAMED_COLOR_HEX: Record<string, string> = {
  aliceblue: "#f0f8ff", antiquewhite: "#faebd7", aqua: "#00ffff", aquamarine: "#7fffd4", azure: "#f0ffff",
  beige: "#f5f5dc", bisque: "#ffe4c4", black: "#000000", blanchedalmond: "#ffebcd", blue: "#0000ff",
  blueviolet: "#8a2be2", brown: "#a52a2a", burlywood: "#deb887", cadetblue: "#5f9ea0", chartreuse: "#7fff00",
  chocolate: "#d2691e", coral: "#ff7f50", cornflowerblue: "#6495ed", cornsilk: "#fff8dc", crimson: "#dc143c",
  cyan: "#00ffff", darkblue: "#00008b", darkcyan: "#008b8b", darkgoldenrod: "#b8860b", darkgray: "#a9a9a9",
  darkgreen: "#006400", darkgrey: "#a9a9a9", darkkhaki: "#bdb76b", darkmagenta: "#8b008b", darkolivegreen: "#556b2f",
  darkorange: "#ff8c00", darkorchid: "#9932cc", darkred: "#8b0000", darksalmon: "#e9967a", darkseagreen: "#8fbc8f",
  darkslateblue: "#483d8b", darkslategray: "#2f4f4f", darkslategrey: "#2f4f4f", darkturquoise: "#00ced1", darkviolet: "#9400d3",
  deeppink: "#ff1493", deepskyblue: "#00bfff", dimgray: "#696969", dimgrey: "#696969", dodgerblue: "#1e90ff",
  firebrick: "#b22222", floralwhite: "#fffaf0", forestgreen: "#228b22", fuchsia: "#ff00ff", gainsboro: "#dcdcdc",
  ghostwhite: "#f8f8ff", gold: "#ffd700", goldenrod: "#daa520", gray: "#808080", green: "#008000",
  greenyellow: "#adff2f", grey: "#808080", honeydew: "#f0fff0", hotpink: "#ff69b4", indianred: "#cd5c5c",
  indigo: "#4b0082", ivory: "#fffff0", khaki: "#f0e68c", lavender: "#e6e6fa", lavenderblush: "#fff0f5",
  lawngreen: "#7cfc00", lemonchiffon: "#fffacd", lightblue: "#add8e6", lightcoral: "#f08080", lightcyan: "#e0ffff",
  lightgoldenrodyellow: "#fafad2", lightgray: "#d3d3d3", lightgreen: "#90ee90", lightgrey: "#d3d3d3", lightpink: "#ffb6c1",
  lightsalmon: "#ffa07a", lightseagreen: "#20b2aa", lightskyblue: "#87cefa", lightslategray: "#778899", lightslategrey: "#778899",
  lightsteelblue: "#b0c4de", lightyellow: "#ffffe0", lime: "#00ff00", limegreen: "#32cd32", linen: "#faf0e6",
  magenta: "#ff00ff", maroon: "#800000", mediumaquamarine: "#66cdaa", mediumblue: "#0000cd", mediumorchid: "#ba55d3",
  mediumpurple: "#9370db", mediumseagreen: "#3cb371", mediumslateblue: "#7b68ee", mediumspringgreen: "#00fa9a", mediumturquoise: "#48d1cc",
  mediumvioletred: "#c71585", midnightblue: "#191970", mintcream: "#f5fffa", mistyrose: "#ffe4e1", moccasin: "#ffe4b5",
  navajowhite: "#ffdead", navy: "#000080", oldlace: "#fdf5e6", olive: "#808000", olivedrab: "#6b8e23",
  orange: "#ffa500", orangered: "#ff4500", orchid: "#da70d6", palegoldenrod: "#eee8aa", palegreen: "#98fb98",
  paleturquoise: "#afeeee", palevioletred: "#db7093", papayawhip: "#ffefd5", peachpuff: "#ffdab9", peru: "#cd853f",
  pink: "#ffc0cb", plum: "#dda0dd", powderblue: "#b0e0e6", purple: "#800080", rebeccapurple: "#663399",
  red: "#ff0000", rosybrown: "#bc8f8f", royalblue: "#4169e1", saddlebrown: "#8b4513", salmon: "#fa8072",
  sandybrown: "#f4a460", seagreen: "#2e8b57", seashell: "#fff5ee", sienna: "#a0522d", silver: "#c0c0c0",
  skyblue: "#87ceeb", slateblue: "#6a5acd", slategray: "#708090", slategrey: "#708090", snow: "#fffafa",
  springgreen: "#00ff7f", steelblue: "#4682b4", tan: "#d2b48c", teal: "#008080", thistle: "#d8bfd8",
  tomato: "#ff6347", turquoise: "#40e0d0", violet: "#ee82ee", wheat: "#f5deb3", white: "#ffffff",
  whitesmoke: "#f5f5f5", yellow: "#ffff00", yellowgreen: "#9acd32",
};
const NAMED_COLOR_RE = new RegExp(`\\b(?:fill|stroke|stop-color)\\s*[:=]\\s*["']?(${Object.keys(NAMED_COLOR_HEX).join("|")})\\b`, "gi");

export function isSvgDataUrl(url: string): boolean {
  return url.startsWith("data:image/svg+xml");
}

// Handles both the base64 form FileReader.readAsDataURL always produces
// (`data:image/svg+xml;base64,...`) and, defensively, a plain
// `data:image/svg+xml,<uri-encoded>` form. Uses TextDecoder rather than a
// bare atob() — atob only ever returns a Latin1 byte-string, so an SVG
// with any non-ASCII byte in it (a name, a generator comment, degree
// symbols in a gradient angle, ...) would come back as mojibake, and
// worse, re-encoding that mangled string later would corrupt the file
// further. TextDecoder turns the same raw bytes into a proper JS string.
export function decodeSvgDataUrl(url: string): string {
  const comma = url.indexOf(",");
  if (comma === -1) return "";
  const meta = url.slice(0, comma);
  const payload = url.slice(comma + 1);
  if (!meta.includes(";base64")) return decodeURIComponent(payload);
  const binary = atob(payload);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder("utf-8").decode(bytes);
}

// The encode side of the same fix — TextEncoder to real UTF-8 bytes, then
// a byte-by-byte binary string btoa() actually accepts, rather than the
// unescape(encodeURIComponent(...)) trick (which corrupts anything that
// went through decodeSvgDataUrl's TextDecoder, since that already
// produced proper Unicode text, not the Latin1 byte-string that trick
// expects).
export function encodeSvgDataUrl(markup: string): string {
  const bytes = new TextEncoder().encode(markup);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return `data:image/svg+xml;base64,${btoa(binary)}`;
}

function componentToHex(n: number): string {
  return Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
}

// One color found in the markup — `raw` is the exact original text (what
// recolorSvg needs to find and replace), `hex` is always a plain #rrggbb
// (what ColorPicker, which only understands hex, needs to display and let
// the user pick a replacement from).
export type SvgColorMatch = { raw: string; hex: string };

// Every distinct color actually used in the markup — hex (3/4/6/8-digit,
// alpha channel dropped for display/editing since ColorPicker has no
// concept of one) and rgb()/rgba() functional notation — in first-seen
// order, deduped case-insensitively.
export function extractSvgColors(markup: string): SvgColorMatch[] {
  const seen = new Set<string>();
  const colors: SvgColorMatch[] = [];

  function add(raw: string, hex: string) {
    const key = raw.toLowerCase().replace(/\s+/g, "");
    if (seen.has(key)) return;
    seen.add(key);
    colors.push({ raw, hex: hex.toLowerCase() });
  }

  for (const match of markup.matchAll(HEX_COLOR_RE)) {
    const digits = match[0].slice(1);
    // Expand shorthand (3/4-digit) to full 6-digit for display; an alpha
    // channel (4th pair of an 8-digit, or 4th nibble of a 4-digit) has no
    // ColorPicker equivalent, so it's dropped for editing purposes only —
    // recolorSvg still matches/replaces the original `raw` token whole.
    const full =
      digits.length === 3 || digits.length === 4
        ? digits
            .slice(0, 3)
            .split("")
            .map((c) => c + c)
            .join("")
        : digits.slice(0, 6);
    add(match[0], `#${full}`);
  }

  for (const match of markup.matchAll(RGB_FUNC_RE)) {
    add(match[0], `#${componentToHex(Number(match[1]))}${componentToHex(Number(match[2]))}${componentToHex(Number(match[3]))}`);
  }

  for (const match of markup.matchAll(NAMED_COLOR_RE)) {
    // match[1] (the color word itself, e.g. "white") is what actually
    // needs finding/replacing later — recolorSvg's non-hex branch does a
    // plain substring replace, and the full match[0] also includes
    // "fill=" or similar, which must stay untouched.
    add(match[1], NAMED_COLOR_HEX[match[1].toLowerCase()]);
  }

  return colors;
}

// Swaps every occurrence of one exact color for another — three cases,
// matching how extractSvgColors found it in the first place:
//   - hex: full token only (not as a substring of a longer hex code —
//     "#fff" must not match inside "#ffffff"), case-insensitively (an SVG
//     author may have typed the same color in different cases in
//     different places).
//   - rgb()/rgba() functional: unlikely to collide as a substring of
//     anything else, so matched and replaced literally.
//   - a bare named color (e.g. "white"): only ever extracted when it
//     immediately followed fill/stroke/stop-color, so replacement is
//     scoped the same way — a plain substring/word replace here would
//     also corrupt an unrelated id="whiteBox" or similar.
export function recolorSvg(markup: string, from: string, to: string): string {
  if (from.startsWith("#")) {
    const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`${escaped}\\b(?![0-9a-fA-F])`, "gi");
    return markup.replace(re, to);
  }
  if (from.includes("(")) {
    return markup.split(from).join(to);
  }
  const escapedWord = from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(fill|stroke|stop-color)(\\s*[:=]\\s*["']?)${escapedWord}\\b`, "gi");
  return markup.replace(re, (_match, prop: string, sep: string) => `${prop}${sep}${to}`);
}
