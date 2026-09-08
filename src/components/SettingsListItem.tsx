import Link from "next/link";
import { badgeClasses } from "@/lib/category-styles";

export function ChevronRight() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0 text-ink-soft">
      <path d="M7.5 4.5l6 5.5-6 5.5" />
    </svg>
  );
}

function rowClass(compact?: boolean) {
  return `flex w-full items-center gap-3 text-left transition hover:bg-[var(--surface-nav-hover)] ${
    compact ? "px-3 py-2" : "px-4 py-3.5"
  }`;
}

function RowContent({
  icon,
  label,
  badge,
  accent,
  selected,
  iconShape = "circle",
  compact,
}: {
  icon: React.ReactNode;
  label: string;
  badge?: string;
  accent?: string;
  selected?: boolean;
  iconShape?: "circle" | "square";
  compact?: boolean;
}) {
  return (
    <>
      <span
        className={`flex shrink-0 items-center justify-center ${compact ? "h-7 w-7" : "h-9 w-9"} ${
          iconShape === "square" ? "rounded-xl" : "rounded-full"
        } ${accent ? badgeClasses(accent) : "text-ink-soft"}`}
      >
        {icon}
      </span>
      <span className={`flex-1 font-medium ${compact ? "text-[13px]" : "text-sm"} ${selected ? "text-surface-accent" : "text-foreground"}`}>
        {label}
      </span>
      {badge ? (
        <span className="shrink-0 rounded-full bg-bg-soft px-3 py-1.5 text-xs font-semibold text-ink-soft">{badge}</span>
      ) : (
        <ChevronRight />
      )}
    </>
  );
}

export default function SettingsListItem({
  icon,
  label,
  onClick,
  href,
  disabled,
  badge,
  accent,
  selected,
  iconShape,
  compact,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  badge?: string;
  /** One of the shared category-color tokens (e.g. "sky", "violet", "amber") — tints the icon's circular badge, same palette used across the rest of the app. Omit for a plain neutral icon. */
  accent?: string;
  /** Highlights the row — used by the lg:+ two-pane Settings layout so the
   * persistent left list shows which panel the right pane is showing. */
  selected?: boolean;
  /** "circle" (default) or "square" icon badge — lets a Settings-page
   * layout (see src/components/settings-home/) restyle the icon shape
   * without forking the row's click/link/selected-state behavior. */
  iconShape?: "circle" | "square";
  /** Tighter padding/icon/text size, for the "Compact dense" Settings-page
   * layout. */
  compact?: boolean;
}) {
  if (href && !disabled) {
    return (
      <Link href={href} className={`${rowClass(compact)} ${selected ? "bg-surface-accent/10" : ""}`}>
        <RowContent icon={icon} label={label} badge={badge} accent={accent} selected={selected} iconShape={iconShape} compact={compact} />
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || !onClick}
      className={`${rowClass(compact)} ${disabled || !onClick ? "opacity-60" : ""} ${selected ? "bg-surface-accent/10" : ""}`}
    >
      <RowContent icon={icon} label={label} badge={badge} accent={accent} selected={selected} iconShape={iconShape} compact={compact} />
    </button>
  );
}
