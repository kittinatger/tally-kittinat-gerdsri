"use client";

import { useT } from "@/lib/language-context";

// The "are you sure?" Cancel + red Confirm button pair shown in place of
// a row's normal actions once its delete has been armed (tap once to
// arm, this is what tap-again shows) — was the exact same className
// pair, verbatim, in CategoryManager/WalletManager/BudgetManager/
// SavingsGoalsManager/RecurringManager/ApiTokensManager/SplitBillManager/
// ChallengesManager. Returns a fragment (no wrapping div) rather than
// its own container, since callers already wrap it in their own layout
// (justify-end vs plain, different gaps) — this only owns the two
// buttons themselves.
export default function ConfirmDeleteButtons({
  busy,
  onCancel,
  onConfirm,
  /** Overrides the confirm button's own label — e.g. "Leave" instead of
   * "Confirm Delete" for a split/challenge member who isn't its creator.
   * Defaults to common.confirmDelete. */
  confirmLabel,
  /** Overrides the label shown while `busy` — e.g. ApiTokensManager's
   * "Revoking…"/tokens.revoking, or a "Removing…" wording for a
   * leave-not-delete action. Defaults to common.deleting. */
  busyLabel,
}: {
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
  busyLabel?: string;
}) {
  const t = useT();
  return (
    <>
      <button
        type="button"
        onClick={onCancel}
        disabled={busy}
        className="rounded-full px-3 py-1.5 text-xs font-semibold text-ink-soft transition hover:bg-[var(--nav-hover-bg)] hover:text-foreground disabled:opacity-60"
      >
        {t("common.cancel")}
      </button>
      <button
        type="button"
        onClick={onConfirm}
        disabled={busy}
        className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 active:scale-[0.97] disabled:opacity-60"
      >
        {busy ? (busyLabel ?? t("common.deleting")) : (confirmLabel ?? t("common.confirmDelete"))}
      </button>
    </>
  );
}
