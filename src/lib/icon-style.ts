// Which icon family renders app-wide (Settings > Icon style). Deliberately
// not a per-icon redraw — "Bold" is the same glyphs at a heavier stroke
// weight (see the [data-icon-style="bold"] rule in globals.css), the same
// relationship Phosphor's own Regular/Bold icon families have. Applied via
// a plain DOM attribute + CSS rather than React context, since icons
// render inside server components all over the app — a context hook would
// force every one of them into a client component.
export const ICON_STYLE_IDS = ["linear", "bold"] as const;
export type IconStyleId = (typeof ICON_STYLE_IDS)[number];

export const DEFAULT_ICON_STYLE: IconStyleId = "linear";

export function isIconStyleId(value: unknown): value is IconStyleId {
  return typeof value === "string" && (ICON_STYLE_IDS as readonly string[]).includes(value);
}
