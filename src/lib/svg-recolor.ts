// Lets a user recolor their own uploaded custom SVG background (see
// CardPhotoScanModal's SVG upload path — it applies the raw file as-is via
// `{ pattern: "photo", photoDataUrl }`, unlike the built-in illustration
// patterns in card-backgrounds.ts, which already carry a structured
// `colors` array). A custom SVG has no such structure, so this walks the
// actual DOM (not just regex over the raw text) to find every shape's true
// *effective* fill color — including one that's never written down
// anywhere because it's relying on inheritance or SVG's own "unpainted
// means black" default — and makes each one independently editable.

const HEX_COLOR_RE = /^#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})$/;
const RGB_FUNC_RE = /^rgba?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*(?:,\s*[\d.]+\s*)?\)$/i;

// The full CSS Color Module Level 4 named-color list — an SVG author can
// (and, especially for plain black/white fills, often does) write
// fill="white" instead of a hex/rgb value.
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

// Elements a fill actually paints — text/tspan included since a logo's
// wordmark is drawn the same way as its shapes.
const PAINTABLE_TAGS = new Set(["path", "rect", "circle", "ellipse", "polygon", "polyline", "line", "text", "tspan", "use"]);
// Never-rendered-directly containers — their contents only ever appear via
// a <use> reference elsewhere, so recoloring them here would either do
// nothing or double up with whatever recolors the <use> itself.
const NON_RENDERING_TAGS = new Set(["defs", "clippath", "mask", "symbol", "pattern"]);

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

// Normalizes whatever a fill value's raw text says (hex, rgb()/rgba(),
// or a named color) into a plain #rrggbb ColorPicker can display — or
// null for a value with no discrete color to edit (none/transparent/
// currentColor/a gradient or pattern reference).
function toHex(raw: string): string | null {
  const value = raw.trim();
  if (!value || value === "none" || value === "transparent" || value === "currentColor" || value.startsWith("url(")) return null;
  if (HEX_COLOR_RE.test(value)) {
    const digits = value.slice(1);
    const full =
      digits.length === 3 || digits.length === 4
        ? digits
            .slice(0, 3)
            .split("")
            .map((c) => c + c)
            .join("")
        : digits.slice(0, 6);
    return `#${full}`.toLowerCase();
  }
  const rgbMatch = value.match(RGB_FUNC_RE);
  if (rgbMatch) {
    return `#${componentToHex(Number(rgbMatch[1]))}${componentToHex(Number(rgbMatch[2]))}${componentToHex(Number(rgbMatch[3]))}`;
  }
  const named = NAMED_COLOR_HEX[value.toLowerCase()];
  return named ?? null;
}

// A shape's own fill, read directly off it — the `style="fill:...;"`
// attribute wins over the plain `fill="..."` attribute, matching real CSS
// cascade rules (presentation attributes are the lowest-priority source).
// Returns null when this element sets no fill of its own at all (as
// opposed to explicitly "none"), so the caller knows to keep looking up
// the tree.
function ownFill(el: Element): string | null {
  const style = el.getAttribute("style");
  if (style) {
    const match = style.match(/(?:^|;)\s*fill\s*:\s*([^;]+)/i);
    if (match) return match[1].trim();
  }
  return el.getAttribute("fill");
}

// The color this element actually renders with: its own fill if it sets
// one, otherwise whatever the nearest ancestor sets, otherwise SVG's own
// spec default (black) — the exact case a plain regex scan can never
// catch, since there's no literal color text anywhere in the file for it.
function effectiveFill(el: Element): string {
  let node: Element | null = el;
  while (node) {
    const fill = ownFill(node);
    if (fill !== null) return fill;
    node = node.parentElement;
  }
  return "black";
}

function isRenderable(el: Element): boolean {
  let node: Element | null = el;
  while (node) {
    if (NON_RENDERING_TAGS.has(node.tagName.toLowerCase())) return false;
    node = node.parentElement;
  }
  return true;
}

// One editable color — `hex` is what ColorPicker shows/edits; recoloring
// happens by hex match, not by remembering which elements contributed it
// (see recolorSvg), so two shapes that already share a color stay linked
// exactly like they visually already are.
export type SvgColorMatch = { hex: string };

// Parses the markup, finds every paintable shape's true effective fill
// (explicit or inherited/defaulted), and returns the distinct colors
// among them in first-seen document order. A shape whose fill is only
// ever inherited/defaulted (no literal color text anywhere for it) still
// shows up here — recolorSvg is what actually writes an explicit `fill`
// onto it the first time it's edited.
export function extractSvgColors(markup: string): SvgColorMatch[] {
  const doc = new DOMParser().parseFromString(markup, "image/svg+xml");
  if (doc.querySelector("parsererror")) return [];

  const seen = new Set<string>();
  const colors: SvgColorMatch[] = [];
  for (const el of doc.querySelectorAll("*")) {
    if (!PAINTABLE_TAGS.has(el.tagName.toLowerCase()) || !isRenderable(el)) continue;
    const hex = toHex(effectiveFill(el));
    if (hex && !seen.has(hex)) {
      seen.add(hex);
      colors.push({ hex });
    }
  }
  return colors;
}

// Re-parses the markup, finds every paintable shape whose *effective*
// fill currently resolves to `from`, and sets an explicit `fill="to"`
// directly on each such shape (never on a shared ancestor — that could
// silently also recolor sibling shapes that happen to inherit the same
// default but aren't meant to be linked). This also handles a shape that
// had no literal fill anywhere before now: the very act of editing it is
// what gives it its first explicit color.
export function recolorSvg(markup: string, from: string, to: string): string {
  const doc = new DOMParser().parseFromString(markup, "image/svg+xml");
  if (doc.querySelector("parsererror")) return markup;

  for (const el of doc.querySelectorAll("*")) {
    if (!PAINTABLE_TAGS.has(el.tagName.toLowerCase()) || !isRenderable(el)) continue;
    if (toHex(effectiveFill(el)) !== from) continue;
    el.setAttribute("fill", to);
    // The presentation attribute above is what actually takes effect now,
    // but a leftover `fill` inside this same element's own `style`
    // attribute would still outrank it per CSS cascade rules — clear that
    // one specifically (never touching color/stroke/etc. in the same
    // style string) so the edit isn't silently overridden.
    const style = el.getAttribute("style");
    if (style && /(?:^|;)\s*fill\s*:/i.test(style)) {
      const cleaned = style.replace(/(?:^|;)\s*fill\s*:[^;]+;?/gi, "").trim();
      if (cleaned) el.setAttribute("style", cleaned);
      else el.removeAttribute("style");
    }
  }
  return new XMLSerializer().serializeToString(doc);
}
