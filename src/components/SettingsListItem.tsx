import Link from "next/link";

export function ChevronRight() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0 text-ink-soft">
      <path d="M7.5 4.5l6 5.5-6 5.5" />
    </svg>
  );
}

const rowClass = "flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-[var(--surface-nav-hover)]";

function RowContent({ icon, label, badge }: { icon: React.ReactNode; label: string; badge?: string }) {
  return (
    <>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center text-ink-soft">{icon}</span>
      <span className="flex-1 text-sm font-medium text-foreground">{label}</span>
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
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  badge?: string;
}) {
  if (href && !disabled) {
    return (
      <Link href={href} className={rowClass}>
        <RowContent icon={icon} label={label} badge={badge} />
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || !onClick}
      className={`${rowClass} ${disabled || !onClick ? "opacity-60" : ""}`}
    >
      <RowContent icon={icon} label={label} badge={badge} />
    </button>
  );
}
