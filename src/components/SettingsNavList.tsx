"use client";

import GroupedCards from "./settings-home/GroupedCards";
import type { PanelItemProps } from "./settings-home/shared";

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
 * design) — this just dispatches to the chosen one. Currently always
 * GroupedCards (today's original look); the style-switching dispatch
 * lands in a later commit alongside the other 5 layouts.
 */
export default function SettingsNavList({
  username,
  email,
  ...panelProps
}: { username: string; email: string | null } & PanelItemProps) {
  return <GroupedCards username={username} email={email} {...panelProps} />;
}
