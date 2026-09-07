"use client";

// A manager panel's own title — the majority shape: a font-display title
// with an optional description directly beneath it, grouped in one column
// on the left, and an optional right-aligned action (the manager's own
// Add button) on the same row as the title. Several managers rolled a
// close-but-not-quite variant of this (title and action on one row,
// description as a separate full-width paragraph below instead of grouped
// with the title) — this is the cleaner of the two shapes, so every
// manager normalizes onto it.
export default function ManagerHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h3 className="font-display text-xl text-foreground">{title}</h3>
        {description && <p className="mt-0.5 text-sm text-ink-soft">{description}</p>}
      </div>
      {action}
    </div>
  );
}
