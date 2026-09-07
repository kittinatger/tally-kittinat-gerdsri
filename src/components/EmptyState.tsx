"use client";

// The "nothing here yet" placeholder for a manager's list — was copy-
// pasted byte-for-byte into BudgetManager, SavingsGoalsManager,
// SplitBillManager, FriendsManager, ChallengesManager, and
// ApiTokensManager (six separate local definitions, all identical).
// Pulled out once here so it can't keep drifting — a caller only ever
// needs to control the icon and the message; margin/spacing above it is
// the caller's own layout concern (wrap in a spacing div, e.g.
// `<div className="mt-4"><EmptyState .../></div>`, same as most
// existing call sites already did).
export default function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-card border border-dashed border-line px-4 py-10 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-bg-soft text-ink-soft">{icon}</span>
      <p className="text-sm text-ink-soft">{text}</p>
    </div>
  );
}
