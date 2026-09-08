// The 6 selectable layouts for the Settings-page content (Settings >
// Settings page design). Unlike nav-bar-styles.ts, each id maps to its
// own full presentational component (src/components/settings-home/*) —
// a whole page layout has more structural freedom than a small nav bar,
// so one config object isn't the right fit here. All 6 render the exact
// same section/row data (src/lib/settings-nav-data.tsx); only the
// header/section/row chrome differs between them.
export const SETTINGS_HOME_STYLE_IDS = [
  "groupedCards",
  "flatSections",
  "titleHeader",
  "squareIcons",
  "compactDense",
  "bannerHeader",
] as const;

export type SettingsHomeStyleId = (typeof SETTINGS_HOME_STYLE_IDS)[number];

export function isSettingsHomeStyleId(value: string): value is SettingsHomeStyleId {
  return (SETTINGS_HOME_STYLE_IDS as readonly string[]).includes(value);
}

export const DEFAULT_SETTINGS_HOME_STYLE: SettingsHomeStyleId = "groupedCards";
