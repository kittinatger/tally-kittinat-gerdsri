// The 24 selectable looks for the mobile bottom nav bar (Settings > Nav
// bar style). Deliberately data, not 24 components — BottomNavBar.tsx is
// the one renderer that reads a NavBarStyleConfig and switches on each
// small axis below. Kept language-agnostic on purpose (no English strings
// here) — display name/description come from translated i18n keys
// (`navStyle.<id>.name` / `navStyle.<id>.description`) looked up by
// NavStyleSettings.tsx, the same convention as ACTIVITIES_TYPE_FILTERS/
// ACTIVITIES_SORTS in activities-prefs.ts.

export const NAV_BAR_STYLE_IDS = [
  "floating",
  "classic",
  "minimalClean",
  "activeText",
  "pillHighlight",
  "bubble",
  "dotIndicator",
  "topBar",
  "iconOnly",
  "outline",
  "glassGradient",
  "gradientBold",
  "neumorphic",
  "elevatedShadow",
  "segmentedTrack",
  "compactFloating",
  "circleCta",
  "diamondCta",
  "centerFab",
  "curvedCta",
  "dock",
  "underlineTrack",
  "twoTone",
  "softColor",
] as const;

export type NavBarStyleId = (typeof NAV_BAR_STYLE_IDS)[number];

export function isNavBarStyleId(value: string): value is NavBarStyleId {
  return (NAV_BAR_STYLE_IDS as readonly string[]).includes(value);
}

export const DEFAULT_NAV_BAR_STYLE: NavBarStyleId = "floating";

export type NavBarStyleConfig = {
  /** Floating: inset from the screen edge with margin + its own shadow
   * (today's look). Attached: sits flush along the bottom edge. */
  attach: "floating" | "attached";
  background:
    | "glass" // frosted blur, neutral (today's look)
    | "glassGradient" // frosted blur over a colorful gradient tint
    | "solid" // plain bg-surface card
    | "gradient" // opaque vivid navy→violet gradient fill
    | "neumorphic" // soft off-white with a gentle dual shadow, no border
    | "outline" // border only, transparent fill
    | "trackSoft" // bg-soft track (the app's own SegmentedControl look)
    | "twoTone"; // solid, with a subtle secondary tint under the active half
  shape: "pill" | "rounded" | "dock";
  /** How the active tab is set apart from the rest. */
  indicator:
    | "fill" // filled pill behind the active icon(+label)
    | "color" // active icon/label simply tinted navy (or accent), no shape
    | "underline" // short bar directly under the active icon
    | "trackUnderline" // full-width baseline track, highlight slides under the active tab
    | "topbar" // short bar above the active icon
    | "dot" // small dot under the active icon
    | "bubble" // active icon lifts into a small solid circle above the row
    | "scale" // active icon scales up slightly and tints
    | "circleIcon" // active icon sits on a small white/light circle
    | "softChip"; // light tinted chip behind just the active icon
  labels: "all" | "activeOnly" | "none";
  /** How the Add button (only shown on pages that pass onAddClick) is
   * placed. "external" matches today's behavior — every style keeps Add
   * fully functional, just repositioned. */
  cta: "external" | "overlapCircle" | "overlapDiamond" | "inlineCircle" | "inlineCircleLight";
  /** Text/icon/pill color to contrast the background — "white" for dark
   * or colorful (gradient) backgrounds, "navy" everywhere else. */
  accent: "navy" | "white";
  /** A more pronounced drop shadow than the attach mode's own default. */
  elevated?: boolean;
};

export const NAV_BAR_STYLES: Record<NavBarStyleId, NavBarStyleConfig> = {
  floating: { attach: "floating", background: "glass", shape: "pill", indicator: "fill", labels: "activeOnly", cta: "external", accent: "navy" },
  classic: { attach: "attached", background: "solid", shape: "rounded", indicator: "color", labels: "all", cta: "external", accent: "navy" },
  minimalClean: { attach: "attached", background: "solid", shape: "rounded", indicator: "underline", labels: "all", cta: "external", accent: "navy" },
  activeText: { attach: "attached", background: "solid", shape: "rounded", indicator: "color", labels: "activeOnly", cta: "external", accent: "navy" },
  pillHighlight: { attach: "attached", background: "solid", shape: "rounded", indicator: "fill", labels: "activeOnly", cta: "external", accent: "navy" },
  bubble: { attach: "attached", background: "solid", shape: "rounded", indicator: "bubble", labels: "all", cta: "external", accent: "navy" },
  dotIndicator: { attach: "attached", background: "solid", shape: "rounded", indicator: "dot", labels: "all", cta: "external", accent: "navy" },
  topBar: { attach: "attached", background: "solid", shape: "rounded", indicator: "topbar", labels: "all", cta: "external", accent: "navy" },
  iconOnly: { attach: "attached", background: "solid", shape: "rounded", indicator: "color", labels: "none", cta: "external", accent: "navy" },
  outline: { attach: "attached", background: "outline", shape: "rounded", indicator: "color", labels: "all", cta: "external", accent: "navy" },
  glassGradient: { attach: "floating", background: "glassGradient", shape: "pill", indicator: "fill", labels: "activeOnly", cta: "external", accent: "white" },
  gradientBold: { attach: "attached", background: "gradient", shape: "rounded", indicator: "circleIcon", labels: "all", cta: "external", accent: "white" },
  neumorphic: { attach: "attached", background: "neumorphic", shape: "rounded", indicator: "scale", labels: "all", cta: "external", accent: "navy" },
  elevatedShadow: { attach: "floating", background: "solid", shape: "rounded", indicator: "fill", labels: "activeOnly", cta: "external", accent: "navy", elevated: true },
  segmentedTrack: { attach: "attached", background: "trackSoft", shape: "pill", indicator: "fill", labels: "all", cta: "external", accent: "navy" },
  compactFloating: { attach: "floating", background: "glass", shape: "pill", indicator: "color", labels: "none", cta: "external", accent: "navy" },
  circleCta: { attach: "attached", background: "solid", shape: "rounded", indicator: "color", labels: "all", cta: "overlapCircle", accent: "navy" },
  diamondCta: { attach: "attached", background: "solid", shape: "rounded", indicator: "color", labels: "all", cta: "overlapDiamond", accent: "navy" },
  centerFab: { attach: "attached", background: "solid", shape: "rounded", indicator: "color", labels: "all", cta: "inlineCircle", accent: "navy" },
  curvedCta: { attach: "attached", background: "gradient", shape: "pill", indicator: "color", labels: "all", cta: "inlineCircleLight", accent: "white" },
  dock: { attach: "floating", background: "glass", shape: "dock", indicator: "color", labels: "none", cta: "external", accent: "navy" },
  underlineTrack: { attach: "attached", background: "solid", shape: "rounded", indicator: "trackUnderline", labels: "all", cta: "external", accent: "navy" },
  twoTone: { attach: "attached", background: "twoTone", shape: "rounded", indicator: "color", labels: "all", cta: "external", accent: "navy" },
  softColor: { attach: "attached", background: "solid", shape: "rounded", indicator: "softChip", labels: "all", cta: "external", accent: "navy" },
};
