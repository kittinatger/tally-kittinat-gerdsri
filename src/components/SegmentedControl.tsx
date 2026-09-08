"use client";

// The "pick one of a few options" pill-track — a `bg-bg-soft` rounded
// track with the active option becoming its own filled `bg-surface`
// pill. Was independently reimplemented in FriendsManager's tab switch,
// WalletModal's Cash/Digital toggle, MembershipCardModal's mode toggle,
// and (twice) RecurringManager's type/direction toggles — the latter's
// own copy had drifted onto a *different* color-token family for its
// active state (`bg-surface-soft text-surface-foreground`, mixing two
// separate token systems in one class string) instead of this pattern's
// actual `bg-surface text-foreground`, which this component fixes as a
// side effect of sharing one implementation.
export default function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  size = "default",
}: {
  value: T;
  onChange: (value: T) => void;
  /** `label` is a ReactNode (not just a string) so a caller can include
   * something like a trailing count badge — see FriendsManager's tab
   * switch. */
  options: { value: T; label: React.ReactNode }[];
  /** "default" fills the available width, one row, each option
   * flex-1 — the common case (a dedicated toggle/tab row). "compact"
   * sizes to content instead, for when this sits inside a tight space
   * like a FormSection header's action slot (see MembershipCardModal's
   * guided/custom editor-mode switch). */
  size?: "default" | "compact";
}) {
  return (
    <div className="flex gap-1 rounded-full bg-bg-soft p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`flex items-center justify-center gap-1.5 rounded-full font-semibold transition ${
            size === "compact" ? "px-2.5 py-1 text-xs" : "flex-1 px-3.5 py-2 text-sm"
          } ${value === opt.value ? "bg-surface text-foreground shadow-sm" : "text-ink-soft"}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
