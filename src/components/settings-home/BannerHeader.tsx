"use client";

// Settings-page layout id "bannerHeader" — the profile card becomes a
// bold navy→violet gradient banner instead of a plain bordered card;
// sections below are unchanged from the default layout.
import { usePathname } from "next/navigation";
import { SETTINGS_SECTIONS } from "@/lib/settings-nav-data";
import { useT } from "@/lib/language-context";
import { SunMoonIcon } from "@/lib/icons";
import SettingsSection from "../SettingsSection";
import { ProfileAvatar, isAdminEmail, makePanelItemProps, renderSettingsRow, type PanelItemProps } from "./shared";

export default function BannerHeader({
  username,
  email,
  ...panelProps
}: { username: string; email: string | null } & PanelItemProps) {
  const pathname = usePathname();
  const t = useT();
  const isAdmin = isAdminEmail(email);
  const panelItemProps = makePanelItemProps(panelProps);

  function toggleTheme() {
    const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("tally-theme", next);
    } catch {
      // Storage can be unavailable (private browsing, etc.) — the toggle
      // still works for the current session either way.
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-3 overflow-hidden rounded-card bg-gradient-to-br from-navy to-violet-600 p-4 shadow-soft">
        <ProfileAvatar username={username} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-lg text-white">{username}</p>
          <p className="truncate text-xs text-white/70">{email ?? "No email on file"}</p>
        </div>
        <button
          onClick={toggleTheme}
          aria-label="Toggle dark mode"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
        >
          <SunMoonIcon />
        </button>
      </div>

      {SETTINGS_SECTIONS.filter((section) => !section.adminOnly || isAdmin).map((section) => (
        <SettingsSection key={section.titleKey} title={t(section.titleKey)}>
          {section.rows.map((row, i) => renderSettingsRow(row, i, t, pathname, panelItemProps))}
        </SettingsSection>
      ))}
    </div>
  );
}
