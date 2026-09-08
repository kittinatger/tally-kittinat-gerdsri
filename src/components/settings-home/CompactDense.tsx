"use client";

// Settings-page layout id "compactDense" — the default's bordered-card
// grouping, but with smaller row height/icon size and tighter spacing so
// more rows are visible per screen at once.
import { usePathname } from "next/navigation";
import { SETTINGS_SECTIONS } from "@/lib/settings-nav-data";
import { useT } from "@/lib/language-context";
import SettingsSection from "../SettingsSection";
import { ProfileAvatar, ThemeToggleButton, isAdminEmail, makePanelItemProps, renderSettingsRow, type PanelItemProps } from "./shared";

export default function CompactDense({
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
      <div className="mb-4 flex items-center gap-2.5 rounded-card border border-line bg-surface p-3">
        <ProfileAvatar username={username} className="h-9 w-9" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{username}</p>
          <p className="truncate text-[11px] text-ink-soft">{email ?? "No email on file"}</p>
        </div>
        <ThemeToggleButton />
      </div>

      {SETTINGS_SECTIONS.filter((section) => !section.adminOnly || isAdmin).map((section) => (
        <SettingsSection key={section.titleKey} title={t(section.titleKey)}>
          {section.rows.map((row, i) => renderSettingsRow(row, i, t, pathname, panelItemProps, { compact: true }))}
        </SettingsSection>
      ))}
    </div>
  );
}
