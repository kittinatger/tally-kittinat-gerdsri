"use client";

import { Children, cloneElement, isValidElement, type ReactElement } from "react";

// The majority "list of things I manage" shape: one bordered/rounded card
// holding every row, each row separated from the next by a top border
// instead of each row being its own separately-rounded card. Takes each
// row as an ordinary keyed child (so callers keep keying by item id, not
// by position) and only adds the container and the divider — row content,
// including any per-row expand/collapse panel, is entirely up to the
// caller.
export default function ManagedList({ children }: { children: React.ReactNode }) {
  const rows = Children.toArray(children);
  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface">
      {rows.map((row, i) => {
        if (!isValidElement(row) || i === 0) return row;
        const el = row as ReactElement<{ className?: string }>;
        const existing = el.props.className ?? "";
        return cloneElement(el, { className: `${existing} border-t border-line`.trim() });
      })}
    </div>
  );
}
