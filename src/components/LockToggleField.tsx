"use client";

// A single on/off "lock" row — label, one-line description, and a switch —
// used everywhere a premade template can lock one aspect of the pick it
// produces (text color, logo, banner, field layout, ...). Previously this
// exact markup was hand-duplicated per lock (see git history on
// MembershipCardModal's lockTextColor toggle); pulled out once new locks
// (logo/banner/fields) needed the identical row rather than a fourth copy.
export default function LockToggleField({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded-card border border-line bg-bg-soft px-3.5 py-2.5 text-left transition"
    >
      <span>
        <span className="block text-sm font-medium text-foreground">{label}</span>
        <span className="block text-xs text-ink-soft">{description}</span>
      </span>
      <span
        role="switch"
        aria-checked={checked}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${checked ? "bg-navy" : "bg-line"}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </span>
    </button>
  );
}
