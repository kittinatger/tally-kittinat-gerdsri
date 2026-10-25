"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowsClockwiseIcon, CopySimpleIcon, DotsThreeIcon, TrashIcon } from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";
import type { Expense } from "@/types/expense";
import { todayInputValue } from "@/lib/format";
import { createExpense } from "@/lib/transaction-api";
import { markOpenedFromList } from "@/lib/transaction-nav";

type Frequency = "weekly" | "monthly" | "yearly";

// The first run of a new recurring rule: one period after this transaction.
function nextRunAfter(date: string, frequency: Frequency): string {
  const d = new Date(`${date}T00:00:00`);
  if (frequency === "weekly") d.setDate(d.getDate() + 7);
  else if (frequency === "monthly") d.setMonth(d.getMonth() + 1);
  else d.setFullYear(d.getFullYear() + 1);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

// The "⋯" button beside Edit/Share on a transaction's page: Duplicate (a copy
// dated today), Make recurring (a rule starting one period later) and Delete.
export default function TransactionMoreMenu({ expense, onDeleted }: { expense: Expense; onDeleted: () => void }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<"recurring" | "delete" | null>(null);
  const [frequency, setFrequency] = useState<Frequency>("monthly");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; link?: { href: string; label: string }; error?: boolean } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open && !panel) return;
    function close(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setPanel(null);
      }
    }
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open, panel]);

  async function duplicate() {
    setOpen(false);
    setBusy(true);
    try {
      const copy = await createExpense(
        {
          type: expense.type,
          direction: expense.direction ?? "out",
          date: todayInputValue(),
          amount: String(expense.amount),
          merchant: expense.merchant,
          category: expense.category,
          notes: expense.notes ?? "",
          tags: expense.tags,
          walletId: expense.walletId,
          locationName: expense.locationName ?? "",
          latitude: expense.latitude ?? null,
          longitude: expense.longitude ?? null,
        },
        true,
      );
      if (copy.id > 0) {
        markOpenedFromList();
        router.push(`/transactions/${copy.id}`);
      } else {
        setMessage({ text: "Copy saved — it'll appear once you're back online." });
      }
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : "Couldn't duplicate it.", error: true });
    } finally {
      setBusy(false);
    }
  }

  async function makeRecurring() {
    setBusy(true);
    try {
      const res = await fetch("/api/recurring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: expense.type,
          direction: expense.type === "transfer" ? (expense.direction ?? "out") : undefined,
          amount: expense.amount,
          merchant: expense.merchant,
          category: expense.category,
          notes: expense.notes,
          walletId: expense.walletId,
          frequency,
          startDate: nextRunAfter(expense.date, frequency),
        }),
      });
      if (!res.ok) throw new Error();
      setPanel(null);
      setMessage({ text: `Repeats ${frequency} from ${nextRunAfter(expense.date, frequency)}.`, link: { href: "/settings?panel=recurring", label: "Recurring" } });
    } catch {
      setMessage({ text: "Couldn't create the recurring rule.", error: true });
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      const res = await fetch(`/api/expenses/${expense.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      onDeleted();
    } catch {
      setMessage({ text: "Couldn't delete it.", error: true });
      setBusy(false);
    }
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setPanel(null);
          setMessage(null);
        }}
        disabled={busy}
        aria-label="More actions"
        aria-expanded={open}
        className="flex h-full w-11 shrink-0 items-center justify-center rounded-lg border border-surface-line text-surface-foreground-soft transition hover:border-surface-accent hover:text-surface-accent disabled:opacity-50"
      >
        <DotsThreeIcon weight="fill" aria-hidden="true" className="h-5 w-5" />
      </button>

      {(open || panel || message) && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-20 w-64 overflow-hidden rounded-2xl border border-surface-line bg-surface p-1.5 text-left shadow-soft">
          {message ? (
            <div className="px-3 py-2.5 text-sm">
              <p className={message.error ? "text-red-600 dark:text-red-400" : "text-surface-foreground"}>{message.text}</p>
              <div className="mt-2 flex gap-3 text-xs font-semibold">
                {message.link && (
                  <Link href={message.link.href} className="text-surface-accent hover:underline">
                    {message.link.label}
                  </Link>
                )}
                <button type="button" onClick={() => setMessage(null)} className="text-surface-foreground-soft hover:text-surface-foreground">
                  Close
                </button>
              </div>
            </div>
          ) : panel === "recurring" ? (
            <div className="p-2">
              <p className="px-1 text-sm font-semibold text-surface-foreground">Repeat this transaction</p>
              <div className="mt-2 flex rounded-full bg-surface-soft p-1">
                {(["weekly", "monthly", "yearly"] as Frequency[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFrequency(f)}
                    aria-pressed={frequency === f}
                    className={`flex-1 rounded-full py-1.5 text-xs font-semibold capitalize transition ${frequency === f ? "bg-surface text-surface-foreground shadow-sm" : "text-surface-foreground-soft"}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <p className="mt-2 px-1 text-xs text-surface-foreground-soft">First one on {nextRunAfter(expense.date, frequency)}, logged automatically.</p>
              <button
                type="button"
                onClick={makeRecurring}
                disabled={busy}
                className="mt-3 w-full rounded-lg bg-navy px-3 py-2 text-sm font-semibold text-white transition hover:bg-navy-dark disabled:opacity-60"
              >
                {busy ? "Saving…" : "Make recurring"}
              </button>
            </div>
          ) : panel === "delete" ? (
            <div className="p-2">
              <p className="px-1 text-sm font-semibold text-surface-foreground">Delete this transaction?</p>
              <p className="mt-1 px-1 text-xs text-surface-foreground-soft">This can&apos;t be undone.</p>
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={() => setPanel(null)} className="flex-1 rounded-lg border border-surface-line px-3 py-2 text-sm font-semibold text-surface-foreground">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={remove}
                  disabled={busy}
                  className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                >
                  {busy ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          ) : (
            <>
              <MenuItem icon={CopySimpleIcon} onClick={duplicate}>
                Duplicate (dated today)
              </MenuItem>
              <MenuItem icon={ArrowsClockwiseIcon} onClick={() => (setOpen(false), setPanel("recurring"))}>
                Make recurring…
              </MenuItem>
              <MenuItem icon={TrashIcon} danger onClick={() => (setOpen(false), setPanel("delete"))}>
                Delete
              </MenuItem>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon: ItemIcon, danger, onClick, children }: { icon: Icon; danger?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium transition hover:bg-[var(--surface-nav-hover)] ${
        danger ? "text-red-600 dark:text-red-400" : "text-surface-foreground"
      }`}
    >
      <ItemIcon weight="fill" aria-hidden="true" className="h-4 w-4 shrink-0" />
      {children}
    </button>
  );
}
