"use client";

import { PlusIcon, CloseIcon } from "@/lib/icons";

// The manager panel "add a new item" affordance — a round icon-only
// button that swaps between Plus and Close depending on whether the
// add form/inline editor it controls is currently open. Several
// managers reimplemented this with a hand-rolled inline SVG instead of
// the app's own shared PlusIcon/CloseIcon, and a few others used a
// wider text-pill ("Add rule" ↔ "Cancel") instead of the icon toggle —
// this is the single shape every "toggle an inline add form" manager
// now shares. CategoryManager/WalletManager/LoanManager already used
// this exact shape for their own (non-toggling — they open a Modal, so
// there's no "open" state to reflect) Add button and aren't affected.
export default function AddItemButton({
  open,
  onToggle,
  label,
}: {
  open: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy text-white shadow-soft transition hover:bg-navy-dark active:scale-[0.97]"
    >
      {open ? <CloseIcon className="h-3.5 w-3.5" /> : <PlusIcon className="h-3.5 w-3.5" />}
    </button>
  );
}
