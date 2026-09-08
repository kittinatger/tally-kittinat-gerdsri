"use client";

// Settings-page layout id "flatSections" — a borderless profile row and
// tinted (not bordered/shadowed) section blocks with thin row dividers,
// instead of every section living in its own bordered card.
import { usePathname } from "next/navigation";
import { SETTINGS_SECTIONS } from "@/lib/settings-nav-data";
import { useT } from "@/lib/language-context";
import { ProfileAvatar, ThemeToggleButton, isAdminEmail, makePanelItemProps, renderSettingsRow, type PanelItemProps } from "./shared";

export default function FlatSections({
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
      <div className="mb-6 flex items-center gap-3 px-1 py-1">
        <ProfileAvatar username={username} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-lg text-foreground">{username}</p>
          <p className="truncate text-xs text-ink-soft">{email ?? "No email on file"}</p>
        </div>
        <ThemeToggleButton />
      </div>

      {SETTINGS_SECTIONS.filter((section) => !section.adminOnly || isAdmin).map((section) => (
        <div key={section.titleKey} className="mb-6">
          <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-ink-soft">{t(section.titleKey)}</h3>
          <div className="divide-y divide-line/60 overflow-hidden rounded-2xl bg-bg-soft">
            {section.rows.map((row, i) => renderSettingsRow(row, i, t, pathname, panelItemProps))}
          </div>
        </div>
      ))}
    </div>
  );
}
