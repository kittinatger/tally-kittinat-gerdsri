"use client";

import { useSettingsHomeStyle } from "@/lib/settings-home-style-context";
import GroupedCards from "./settings-home/GroupedCards";
import FlatSections from "./settings-home/FlatSections";
import TitleHeader from "./settings-home/TitleHeader";
import SquareIcons from "./settings-home/SquareIcons";
import CompactDense from "./settings-home/CompactDense";
import BannerHeader from "./settings-home/BannerHeader";
import type { PanelItemProps } from "./settings-home/shared";

const LAYOUTS = {
  groupedCards: GroupedCards,
  flatSections: FlatSections,
  titleHeader: TitleHeader,
  squareIcons: SquareIcons,
  compactDense: CompactDense,
  bannerHeader: BannerHeader,
};

/**
 * The persistent Settings nav list — the same profile banner + grouped
 * sections everywhere it's used, but the panel-switching rows behave
 * differently depending on where it's mounted:
 * - `mode="panel"` (inside SettingsView, at /settings): rows switch the
 *   in-app panel via state, no navigation.
 * - `mode="link"` (the standalone Support pages — FAQs, Usage guide, etc.):
 *   those pages don't have panel state of their own (they don't fetch the
 *   heavy data those panels need), so rows link to `/settings?panel=X`
 *   instead. href-based rows (Usage guide, FAQs, ...) highlight themselves
 *   via the current pathname instead.
 *
 * The actual visual layout is user-selectable (Settings > Settings page
 * design) — this just dispatches to the chosen one. All 6 render the
 * exact same data (src/lib/settings-nav-data.tsx); only their header/
 * section/row chrome differs.
 */
export default function SettingsNavList({
  username,
  email,
  ...panelProps
}: { username: string; email: string | null } & PanelItemProps) {
  const styleId = useSettingsHomeStyle();
  const Layout = LAYOUTS[styleId];
  return <Layout username={username} email={email} {...panelProps} />;
}
