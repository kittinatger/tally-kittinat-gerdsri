"use client";

// Bits every selectable Settings-page layout reuses as-is — only each
// layout's own header/section/row chrome differs, never these.
import { useEffect, useState } from "react";
import { SunMoonIcon } from "@/lib/icons";
import { type Panel } from "@/lib/settings-panels";
import { ADMIN_EMAIL } from "@/lib/admin-constants";
import type { SettingsRowData } from "@/lib/settings-nav-data";
import type { MessageKey } from "@/lib/i18n/messages";
import SettingsListItem from "../SettingsListItem";
import ExportDataButton from "../ExportDataButton";
import ImportDataButton from "../ImportDataButton";
import ReportExportButton from "../ReportExportButton";

export type PanelItemProps =
  | { mode: "panel"; panel: Panel | null; onSelectPanel: (panel: Panel) => void }
  | { mode: "link" };

export function isAdminEmail(email: string | null): boolean {
  return Boolean(email) && email!.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

/** `mode: "panel"` rows switch the in-app panel via state, no navigation.
 * `mode: "link"` (the standalone Support pages) rows link to
 * `/settings?panel=X` instead, since those pages don't have panel state
 * of their own. */
export function makePanelItemProps(panelProps: PanelItemProps) {
  return function panelItemProps(panel: Panel) {
    if (panelProps.mode === "panel") {
      return { onClick: () => panelProps.onSelectPanel(panel), selected: panelProps.panel === panel };
    }
    return { href: `/settings?panel=${panel}` };
  };
}

// Renders one row's actual content — a normal SettingsListItem for
// "panel"/"href" rows, or one of the three bespoke non-SettingsListItem
// components for "special" rows. Every layout renderer calls this instead
// of re-deciding how to render a row, so the row content itself (as
// opposed to its section/container chrome) can never drift between
// layouts.
export function renderSettingsRow(
  row: SettingsRowData,
  key: string | number,
  t: (key: MessageKey) => string,
  pathname: string,
  panelItemProps: (panel: Panel) => { onClick: () => void; selected: boolean } | { href: string },
  rowStyle?: { iconShape?: "circle" | "square"; compact?: boolean },
) {
  if (row.kind === "special") {
    if (row.special === "export") return <ExportDataButton key={key} />;
    if (row.special === "import") return <ImportDataButton key={key} />;
    return <ReportExportButton key={key} />;
  }
  if (row.kind === "href") {
    return (
      <SettingsListItem
        key={key}
        icon={row.icon}
        label={t(row.labelKey)}
        accent={row.accent}
        href={row.href}
        selected={pathname === row.href}
        iconShape={rowStyle?.iconShape}
        compact={rowStyle?.compact}
      />
    );
  }
  return (
    <SettingsListItem
      key={key}
      icon={row.icon}
      label={t(row.labelKey)}
      accent={row.accent}
      iconShape={rowStyle?.iconShape}
      compact={rowStyle?.compact}
      {...panelItemProps(row.panel)}
    />
  );
}

export function ThemeToggleButton() {
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    typeof document !== "undefined" && document.documentElement.getAttribute("data-theme") === "dark"
      ? "dark"
      : "light",
  );

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("tally-theme", next);
    } catch {
      // Storage can be unavailable (private browsing, etc.) — the toggle
      // still works for the current session either way.
    }
  }

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle dark mode"
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-bg-soft text-ink-soft transition hover:text-foreground"
    >
      <SunMoonIcon />
    </button>
  );
}

// Anchors the top of the Settings list with the same profile picture used
// on the Dashboard's Welcome widget, so Settings reads as "your account"
// rather than a bare list of links.
export function ProfileAvatar({
  username,
  className = "h-12 w-12",
  shape = "circle",
}: {
  username: string;
  className?: string;
  shape?: "circle" | "square";
}) {
  const shapeClass = shape === "square" ? "rounded-2xl" : "rounded-full";
  const [pictureUrl, setPictureUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/account/profile-picture", { cache: "no-store" })
      .then((res) => (res.ok ? res.blob() : null))
      .then((blob) => {
        if (!cancelled && blob) setPictureUrl(URL.createObjectURL(blob));
      })
      .catch(() => {
        // Leave it blank — the initial-letter fallback below still works.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (pictureUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- fetched as a blob URL, not a build-time asset
      <img src={pictureUrl} alt="" className={`${className} shrink-0 ${shapeClass} object-cover ring-2 ring-surface-accent`} />
    );
  }
  return (
    <div className={`flex ${className} shrink-0 items-center justify-center ${shapeClass} bg-surface-accent/10`}>
      <span className="text-lg font-bold text-surface-accent">{username.charAt(0).toUpperCase()}</span>
    </div>
  );
}
