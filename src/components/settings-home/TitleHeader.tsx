"use client";

// Settings-page layout id "titleHeader" — adds a large page title above
// the profile card (today's default doesn't show one of its own; the
// page it's embedded in — SettingsView, or one of the standalone Support
// pages — doesn't always show "Settings" either). Sections keep the same
// bordered-card treatment as the default layout.
import { usePathname } from "next/navigation";
import { SETTINGS_SECTIONS } from "@/lib/settings-nav-data";
import { useT } from "@/lib/language-context";
import SettingsSection from "../SettingsSection";
import { ProfileAvatar, ThemeToggleButton, isAdminEmail, makePanelItemProps, renderSettingsRow, type PanelItemProps } from "./shared";

export default function TitleHeader({
  username,
  email,
  ...panelProps
}: { username: string; email: string | null } & PanelItemProps) {
  const pathname = usePathname();
  const t = useT();
  const isAdmin = isAdminEmail(email);
  const panelItemProps = makePanelItemProps(panelProps);

  return (
    <div>
      <h2 className="mb-4 font-display text-2xl text-foreground">{t("nav.settings")}</h2>

      <div className="mb-6 flex items-center gap-3 rounded-card border border-line bg-surface p-4">
        <ProfileAvatar username={username} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-lg text-foreground">{username}</p>
          <p className="truncate text-xs text-ink-soft">{email ?? "No email on file"}</p>
        </div>
        <ThemeToggleButton />
      </div>

      {SETTINGS_SECTIONS.filter((section) => !section.adminOnly || isAdmin).map((section) => (
        <SettingsSection key={section.titleKey} title={t(section.titleKey)}>
          {section.rows.map((row, i) => renderSettingsRow(row, i, t, pathname, panelItemProps))}
        </SettingsSection>
      ))}
    </div>
  );
}
