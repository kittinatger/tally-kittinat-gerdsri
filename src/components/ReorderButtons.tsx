"use client";

// The up/down chevron pair for manually reordering a manager's list —
// byte-for-byte duplicated (same SVG paths, same disabled-at-the-edge
// logic) across WalletManager, SavingsGoalsManager, and RecurringManager.
// Purely a de-duplication: no manager not already reorderable gains
// reordering from this.
export default function ReorderButtons({
  onMoveUp,
  onMoveDown,
  disableUp,
  disableDown,
  upLabel,
  downLabel,
  className = "",
}: {
  onMoveUp: () => void;
  onMoveDown: () => void;
  disableUp: boolean;
  disableDown: boolean;
  upLabel: string;
  downLabel: string;
  /** Extra classes merged onto the wrapping column — e.g. WalletManager's
   * `invisible` when the current user isn't the wallet's owner, keeping
   * the row's layout intact without letting a non-owner reorder it. */
  className?: string;
}) {
  return (
    <div className={`flex shrink-0 flex-col ${className}`.trim()}>
      <button
        type="button"
        onClick={onMoveUp}
        disabled={disableUp}
        aria-label={upLabel}
        className="rounded p-0.5 text-ink-soft transition hover:text-foreground disabled:opacity-30"
      >
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
          <path d="M5 12l5-5 5 5" />
        </svg>
      </button>
      <button
        type="button"
        onClick={onMoveDown}
        disabled={disableDown}
        aria-label={downLabel}
        className="rounded p-0.5 text-ink-soft transition hover:text-foreground disabled:opacity-30"
      >
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
          <path d="M5 8l5 5 5-5" />
        </svg>
      </button>
    </div>
  );
}
