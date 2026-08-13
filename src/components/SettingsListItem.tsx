import Link from "next/link";
import { badgeClasses } from "@/lib/category-styles";

export function ChevronRight() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0 text-ink-soft">
      <path d="M7.5 4.5l6 5.5-6 5.5" />
    </svg>
  );
}

const rowClass = "flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-[var(--surface-nav-hover)]";

function RowContent({
  icon,
  label,
  badge,
  accent,
  selected,
}: {
  icon: React.ReactNode;
  label: string;
  badge?: string;
  accent?: string;
  selected?: boolean;
}) {
  return (
    <>
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
          accent ? badgeClasses(accent) : "text-ink-soft"
        }`}
      >
        {icon}
      </span>
      <span className={`flex-1 text-sm font-medium ${selected ? "text-surface-accent" : "text-foreground"}`}>
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
}) {
  if (href && !disabled) {
    return (
      <Link href={href} className={rowClass}>
        <RowContent icon={icon} label={label} badge={badge} accent={accent} />
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || !onClick}
      className={`${rowClass} ${disabled || !onClick ? "opacity-60" : ""} ${selected ? "bg-surface-accent/10" : ""}`}
    >
      <RowContent icon={icon} label={label} badge={badge} accent={accent} selected={selected} />
    </button>
  );
}
