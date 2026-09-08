"use client";

// Settings-page layout id "squareIcons" — a minimal flat list: no section
// card backgrounds at all, just full-bleed divider lines and small
// uppercase captions, with rounded-square icon badges instead of circles.
import { usePathname } from "next/navigation";
import { SETTINGS_SECTIONS } from "@/lib/settings-nav-data";
import { useT } from "@/lib/language-context";
import { ProfileAvatar, ThemeToggleButton, isAdminEmail, makePanelItemProps, renderSettingsRow, type PanelItemProps } from "./shared";

export default function SquareIcons({
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
      <div className="mb-6 flex items-center gap-3 border-b border-line pb-5">
        <ProfileAvatar username={username} shape="square" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-lg text-foreground">{username}</p>
          <p className="truncate text-xs text-ink-soft">{email ?? "No email on file"}</p>
        </div>
        <ThemeToggleButton />
      </div>

      {SETTINGS_SECTIONS.filter((section) => !section.adminOnly || isAdmin).map((section) => (
        <div key={section.titleKey} className="mb-5">
          <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-soft">{t(section.titleKey)}</h3>
          <div className="divide-y divide-line">
            {section.rows.map((row, i) => renderSettingsRow(row, i, t, pathname, panelItemProps, { iconShape: "square" }))}
          </div>
        </div>
      ))}
    </div>
  );
}
