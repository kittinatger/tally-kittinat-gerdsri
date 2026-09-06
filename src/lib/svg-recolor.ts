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

  return colors;
}

// Swaps every occurrence of one exact color for another. Hex colors match
// the full token only (not as a substring of a longer hex code — "#fff"
// must not match inside "#ffffff") and case-insensitively (an SVG author
// may have typed the same color in different cases in different places);
// an rgb()/rgba() functional string is unlikely to collide as a substring
// of anything else, so it's matched (and replaced) literally instead.
export function recolorSvg(markup: string, from: string, to: string): string {
  if (from.startsWith("#")) {
    const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`${escaped}\\b(?![0-9a-fA-F])`, "gi");
    return markup.replace(re, to);
  }
  return markup.split(from).join(to);
}
