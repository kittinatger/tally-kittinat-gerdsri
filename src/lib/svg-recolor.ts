// Lets a user recolor their own uploaded custom SVG background (see
// CardPhotoScanModal's SVG upload path — it applies the raw file as-is via
// `{ pattern: "photo", photoDataUrl }`, unlike the built-in illustration
// patterns in card-backgrounds.ts, which already carry a structured
// `colors` array). A custom SVG has no such structure — its colors are
// just whatever hex values happen to appear in the markup — so editing
// means: find them, let the user swap one for another, and re-serialize.

const HEX_COLOR_RE = /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g;

export function isSvgDataUrl(url: string): boolean {
  return url.startsWith("data:image/svg+xml");
}

// Handles both the URI-encoded form CardPhotoScanModal produces via
// FileReader.readAsDataURL for an SVG (`data:image/svg+xml;base64,...` —
// browsers base64-encode readAsDataURL output regardless of MIME type) and,
// defensively, a plain `data:image/svg+xml,<uri-encoded>` form.
export function decodeSvgDataUrl(url: string): string {
  const comma = url.indexOf(",");
  if (comma === -1) return "";
  const meta = url.slice(0, comma);
  const payload = url.slice(comma + 1);
  return meta.includes(";base64") ? atob(payload) : decodeURIComponent(payload);
}

export function encodeSvgDataUrl(markup: string): string {
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(markup)))}`;
}

// Every distinct hex color actually used in the markup, in first-seen
// order — deduped case-insensitively but returned in whatever case the
// file itself used, so a swatch's starting color matches what's on screen.
export function extractSvgColors(markup: string): string[] {
  const seen = new Set<string>();
  const colors: string[] = [];
  for (const match of markup.matchAll(HEX_COLOR_RE)) {
    const key = match[0].toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      colors.push(match[0]);
    }
  }
  return colors;
}

// Swaps every occurrence of one exact hex color for another, matching the
// full token only (not as a substring of a longer hex code — "#fff" must
// not match inside "#ffffff") and case-insensitively (an SVG author may
// have typed uppercase or lowercase inconsistently for the same color).
export function recolorSvg(markup: string, from: string, to: string): string {
  const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`${escaped}\\b(?![0-9a-fA-F])`, "gi");
  return markup.replace(re, to);
}
