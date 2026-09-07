"use client";

// A small "pick zero or more of these" pill button — the same shape was
// independently reimplemented as a bordered/tinted chip (WalletModal,
// MembershipCardModal, CodeGeneratorPanel, CategoryModal, ...) and as a
// filled-on-select chip (SplitBillManager's participant picker,
// ChallengesManager's invitee picker). Both variants live here so a
// caller picks by shape rather than re-typing the class string.
export default function SelectorChip({
  active,
  onClick,
  children,
  variant = "tinted",
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  /** "tinted" (default) is the bordered pill used for a small fixed set
   * of options (kind/format/category pickers). "filled" is the denser
   * pill used for picking people out of a longer list (friends,
   * invitees). */
  variant?: "tinted" | "filled";
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        variant === "filled"
          ? `rounded-full px-2.5 py-1 text-[11px] font-semibold transition disabled:opacity-60 ${
              active ? "bg-navy text-white" : "bg-bg-soft text-ink-soft hover:text-foreground"
            }`
          : `rounded-full border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-60 ${
              active
                ? "border-navy bg-navy/10 text-navy dark:text-blue-300"
                : "border-line text-ink-soft hover:bg-[var(--nav-hover-bg)]"
            }`
      }
    >
      {children}
    </button>
  );
}
