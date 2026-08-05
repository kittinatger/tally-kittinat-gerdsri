"use client";

import { useCallback, useEffect, useState } from "react";
import { dotClasses } from "@/lib/category-styles";
import { useCurrency } from "@/lib/currency-context";
import { formatCurrency } from "@/lib/format";
import { WIDGET_ACCENTS } from "@/lib/dashboard-widgets";
import CsvManagerButtons from "./CsvManagerButtons";

type SavingsGoal = { id: number; name: string; color: string; target_amount: string; current_amount: string };

export default function SavingsGoalsManager() {
  const currency = useCurrency();

  const [goals, setGoals] = useState<SavingsGoal[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [contributeAmount, setContributeAmount] = useState<Record<number, string>>({});

  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [color, setColor] = useState<string>(WIDGET_ACCENTS[0]);

  const refetch = useCallback(() => {
    return fetch("/api/savings-goals")
      .then((res) => res.json())
      .then((data) => setGoals(data.goals ?? []))
      .catch(() => setLoadError("Could not load your savings goals."));
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/savings-goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color, targetAmount: Number(target) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not save that goal.");
        return;
      }
      setGoals((prev) => [...(prev ?? []), data.goal]);
      setAdding(false);
      setName("");
      setTarget("");
    } catch {
      setError("Network error while saving.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleContribute(goal: SavingsGoal, delta: number) {
    if (!delta) return;
    setBusyId(goal.id);
    try {
      const res = await fetch(`/api/savings-goals/${goal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contributeDelta: delta }),
      });
      const data = await res.json();
      if (res.ok) {
        setGoals((prev) => (prev ?? []).map((g) => (g.id === goal.id ? data.goal : g)));
        setContributeAmount((prev) => ({ ...prev, [goal.id]: "" }));
      }
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: number) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/savings-goals/${id}`, { method: "DELETE" });
      if (res.ok) {
        setGoals((prev) => (prev ?? []).filter((g) => g.id !== id));
      }
    } finally {
      setBusyId(null);
    }
  }

  async function handleMove(id: number, move: "up" | "down") {
    setBusyId(id);
    try {
      const res = await fetch(`/api/savings-goals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ move }),
      });
      const data = await res.json();
      if (res.ok) setGoals(data.goals);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-xl text-foreground">Savings goals</h3>
        <button
          onClick={() => setAdding((v) => !v)}
          className="flex items-center gap-1.5 rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-navy-dark"
        >
          {adding ? "Cancel" : "Add goal"}
        </button>
      </div>
      <p className="mt-2 text-[11px] leading-snug text-ink-soft">
        Track progress toward something you&apos;re saving for. Add contributions manually as you set money aside.
      </p>

      <div className="mt-3">
        <CsvManagerButtons exportHref="/api/savings-goals/export" importUrl="/api/savings-goals/import" onImported={refetch} />
      </div>

      {adding && (
        <form onSubmit={handleAdd} className="mt-4 space-y-3 rounded-card border border-line bg-surface p-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-surface-foreground-soft">Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. New laptop"
              className="w-full rounded-card border border-surface-line bg-surface-soft px-3.5 py-2.5 text-base text-surface-foreground outline-none transition focus:border-surface-accent focus:ring-2 focus:ring-surface-accent/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-surface-foreground-soft">Target amount</label>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              required
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-card border border-surface-line bg-surface-soft px-3.5 py-2.5 text-base text-surface-foreground outline-none transition focus:border-surface-accent focus:ring-2 focus:ring-surface-accent/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-surface-foreground-soft">Color</label>
            <div className="flex flex-wrap gap-2">
              {WIDGET_ACCENTS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-label={c}
                  className={`h-7 w-7 rounded-full ${dotClasses(c)} ${color === c ? "ring-2 ring-offset-2 ring-surface-accent ring-offset-surface" : ""}`}
                />
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-navy-dark disabled:opacity-60"
            >
              {submitting ? "Saving..." : "Save goal"}
            </button>
          </div>
        </form>
      )}

      {loadError && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{loadError}</p>}

      {goals === null ? (
        <p className="mt-4 text-sm text-ink-soft">Loading…</p>
      ) : goals.length === 0 ? (
        <p className="mt-4 text-sm text-ink-soft">No savings goals yet.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {goals.map((g, i) => {
            const current = Number(g.current_amount);
            const goalTarget = Number(g.target_amount);
            const percent = goalTarget > 0 ? Math.min(100, (current / goalTarget) * 100) : 0;
            return (
              <div key={g.id} className="rounded-card border border-line bg-surface p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className={`h-3 w-3 shrink-0 rounded-full ${dotClasses(g.color)}`} />
                    <p className="truncate font-medium text-foreground">{g.name}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <div className="flex flex-col">
                      <button
                        onClick={() => handleMove(g.id, "up")}
                        disabled={busyId === g.id || i === 0}
                        aria-label="Move up"
                        className="rounded p-0.5 text-ink-soft transition hover:text-foreground disabled:opacity-30"
                      >
                        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                          <path d="M5 12l5-5 5 5" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleMove(g.id, "down")}
                        disabled={busyId === g.id || i === goals.length - 1}
                        aria-label="Move down"
                        className="rounded p-0.5 text-ink-soft transition hover:text-foreground disabled:opacity-30"
                      >
                        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                          <path d="M5 8l5 5 5-5" />
                        </svg>
                      </button>
                    </div>
                    <button
                      onClick={() => handleDelete(g.id)}
                      disabled={busyId === g.id}
                      className="rounded-full px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p className="mt-1 text-xs text-ink-soft">
                  {formatCurrency(current, currency)} / {formatCurrency(goalTarget, currency)} ({percent.toFixed(0)}%)
                </p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-bg-soft">
                  <div className={`h-full rounded-full ${dotClasses(g.color)}`} style={{ width: `${Math.max(4, percent)}%` }} />
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    placeholder="Amount"
                    value={contributeAmount[g.id] ?? ""}
                    onChange={(e) => setContributeAmount((prev) => ({ ...prev, [g.id]: e.target.value }))}
                    className="w-28 rounded-card border border-surface-line bg-surface-soft px-3 py-1.5 text-sm text-surface-foreground outline-none transition focus:border-surface-accent focus:ring-2 focus:ring-surface-accent/20"
                  />
                  <button
                    onClick={() => handleContribute(g, Number(contributeAmount[g.id] ?? 0))}
                    disabled={busyId === g.id || !contributeAmount[g.id]}
                    className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-[var(--nav-hover-bg)] disabled:opacity-60"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => handleContribute(g, -Number(contributeAmount[g.id] ?? 0))}
                    disabled={busyId === g.id || !contributeAmount[g.id]}
                    className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-[var(--nav-hover-bg)] disabled:opacity-60"
                  >
                    Withdraw
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
