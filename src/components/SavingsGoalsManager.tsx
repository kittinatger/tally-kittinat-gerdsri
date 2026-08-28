"use client";

import { describeFetchError } from "@/lib/fetch-error";
import { useCallback, useEffect, useState } from "react";
import { badgeClasses, dotClasses, colorDotStyle } from "@/lib/category-styles";
import { useCurrency } from "@/lib/currency-context";
import { formatCurrency } from "@/lib/format";
import { WIDGET_ACCENTS } from "@/lib/dashboard-widgets";
import { PlusIcon } from "@/lib/icons";
import CsvManagerButtons from "./CsvManagerButtons";
import ColorPicker from "./ColorPicker";
import { useT } from "@/lib/language-context";
import { mutateFetch } from "@/lib/offline/fetch-wrapper";

type SavingsGoal = { id: number; name: string; color: string; target_amount: string; current_amount: string };
type Contribution = { id: number; delta: string; created_at: string };

function TargetIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
      <circle cx="10" cy="10" r="7" />
      <circle cx="10" cy="10" r="3.5" />
      <circle cx="10" cy="10" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M4.5 5.5h11M8 5.5V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.5M14.5 5.5l-.6 9.4a1.5 1.5 0 0 1-1.5 1.4H7.6a1.5 1.5 0 0 1-1.5-1.4l-.6-9.4" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M4 10a6 6 0 1 0 1.8-4.3M4 4v3h3" />
      <path d="M10 6.5V10l2.3 2.3" />
    </svg>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-card border border-dashed border-line px-4 py-10 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-bg-soft text-ink-soft">{icon}</span>
      <p className="text-sm text-ink-soft">{text}</p>
    </div>
  );
}

export default function SavingsGoalsManager() {
  const t = useT();
  const currency = useCurrency();

  const [goals, setGoals] = useState<SavingsGoal[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [contributeAmount, setContributeAmount] = useState<Record<number, string>>({});
  const [historyOpenId, setHistoryOpenId] = useState<number | null>(null);
  const [historyByGoal, setHistoryByGoal] = useState<Record<number, Contribution[] | undefined>>({});

  function toggleHistory(goalId: number) {
    if (historyOpenId === goalId) {
      setHistoryOpenId(null);
      return;
    }
    setHistoryOpenId(goalId);
    if (!historyByGoal[goalId]) {
      fetch(`/api/savings-goals/${goalId}/contributions`)
        .then((res) => res.json())
        .then((data) => setHistoryByGoal((prev) => ({ ...prev, [goalId]: data.contributions ?? [] })))
        .catch(() => setHistoryByGoal((prev) => ({ ...prev, [goalId]: [] })));
    }
  }

  async function handleDeleteContribution(goalId: number, contributionId: number) {
    setBusyId(goalId);
    try {
      const res = await mutateFetch(`/api/savings-goals/${goalId}/contributions/${contributionId}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        // data.goal (with its recomputed current_amount) is absent when
        // queued offline — leave the goal's total as-is until the queue
        // syncs, but still drop the contribution from the visible history.
        if (data.goal) setGoals((prev) => (prev ?? []).map((g) => (g.id === goalId ? data.goal : g)));
        setHistoryByGoal((prev) => ({
          ...prev,
          [goalId]: (prev[goalId] ?? []).filter((c) => c.id !== contributionId),
        }));
      }
    } finally {
      setBusyId(null);
    }
  }

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
      const res = await mutateFetch("/api/savings-goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color, targetAmount: Number(target) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not save that goal.");
        return;
      }
      // data.goal is absent when queued offline — build the optimistic
      // version from the form values, with a placeholder negative id.
      const saved: SavingsGoal = data.goal ?? { id: -Date.now(), name, color, target_amount: String(Number(target)), current_amount: "0" };
      setGoals((prev) => [...(prev ?? []), saved]);
      setAdding(false);
      setName("");
      setTarget("");
    } catch (err) {
      setError(describeFetchError(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleContribute(goal: SavingsGoal, delta: number) {
    if (!delta) return;
    setBusyId(goal.id);
    try {
      const res = await mutateFetch(`/api/savings-goals/${goal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contributeDelta: delta }),
      });
      const data = await res.json();
      if (res.ok) {
        // data.goal is absent when queued offline — apply the delta
        // optimistically to the goal's current known total instead.
        const saved: SavingsGoal = data.goal ?? { ...goal, current_amount: String(Number(goal.current_amount) + delta) };
        setGoals((prev) => (prev ?? []).map((g) => (g.id === goal.id ? saved : g)));
        setContributeAmount((prev) => ({ ...prev, [goal.id]: "" }));
        // Invalidate the cached history so reopening it fetches the entry
        // that contribution just added.
        setHistoryByGoal((prev) => ({ ...prev, [goal.id]: undefined }));
      }
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: number) {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }
    setBusyId(id);
    try {
      const res = await mutateFetch(`/api/savings-goals/${id}`, { method: "DELETE" });
      if (res.ok) {
        setGoals((prev) => (prev ?? []).filter((g) => g.id !== id));
      }
    } finally {
      setBusyId(null);
      setConfirmDeleteId(null);
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
        <h3 className="font-display text-xl text-foreground">{t("savings.title")}</h3>
        <button
          onClick={() => setAdding((v) => !v)}
          aria-label={adding ? t("common.cancel") : t("common.add")}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy text-white shadow-soft transition hover:bg-navy-dark"
        >
          {adding ? (
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-3.5 w-3.5">
              <path d="M5 5l10 10M15 5L5 15" />
            </svg>
          ) : (
            <PlusIcon className="h-3.5 w-3.5 shrink-0" />
          )}
        </button>
      </div>
      <p className="mt-2 text-[11px] leading-snug text-ink-soft">
        {t("savings.desc")}
      </p>

      <div className="mt-3">
        <CsvManagerButtons exportHref="/api/savings-goals/export" importUrl="/api/savings-goals/import" onImported={refetch} />
      </div>

      {adding && (
        <form onSubmit={handleAdd} className="mt-4 space-y-3 rounded-card border border-line bg-surface p-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-foreground">{t("savings.name")}</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("savings.namePlaceholder")}
              className="w-full rounded-card border border-line bg-bg-soft px-3.5 py-2 text-sm text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-foreground">{t("savings.targetAmount")}</label>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              required
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-card border border-line bg-bg-soft px-3.5 py-2 text-sm text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-foreground">{t("savings.color")}</label>
            <ColorPicker value={color} onChange={setColor} palette={WIDGET_ACCENTS} />
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-navy-dark disabled:opacity-60"
            >
              {submitting ? t("common.saving") : t("savings.saveGoal")}
            </button>
          </div>
        </form>
      )}

      {loadError && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{loadError}</p>}

      {goals === null ? (
        <p className="mt-4 text-sm text-ink-soft">{t("common.loading")}</p>
      ) : goals.length === 0 ? (
        <div className="mt-4">
          <EmptyState icon={<TargetIcon />} text={t("savings.noGoalsYet")} />
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-card border border-line bg-surface">
          {goals.map((g, i) => {
            const current = Number(g.current_amount);
            const goalTarget = Number(g.target_amount);
            const percent = goalTarget > 0 ? Math.min(100, (current / goalTarget) * 100) : 0;
            const confirming = confirmDeleteId === g.id;
            return (
              <div key={g.id} className={`px-4 py-3 ${i === 0 ? "" : "border-t border-line"}`}>
                <div className="flex items-center gap-3">
                  <div className="flex shrink-0 flex-col">
                    <button
                      onClick={() => handleMove(g.id, "up")}
                      disabled={busyId === g.id || i === 0}
                      aria-label={`Move ${g.name} up`}
                      className="rounded p-0.5 text-ink-soft transition hover:text-foreground disabled:opacity-30"
                    >
                      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                        <path d="M5 12l5-5 5 5" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleMove(g.id, "down")}
                      disabled={busyId === g.id || i === goals.length - 1}
                      aria-label={`Move ${g.name} down`}
                      className="rounded p-0.5 text-ink-soft transition hover:text-foreground disabled:opacity-30"
                    >
                      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                        <path d="M5 8l5 5 5-5" />
                      </svg>
                    </button>
                  </div>

                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${badgeClasses(g.color)}`}
                    style={colorDotStyle(g.color)}
                  >
                    <TargetIcon />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">{g.name}</p>
                    <p className="text-xs text-ink-soft">
                      {formatCurrency(current, currency)} / {formatCurrency(goalTarget, currency)} ({percent.toFixed(0)}%)
                    </p>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-bg-soft">
                      <div
                        className={`h-full rounded-full ${dotClasses(g.color)}`}
                        style={{ width: `${Math.max(4, percent)}%`, ...colorDotStyle(g.color) }}
                      />
                    </div>
                  </div>

                  {confirming ? (
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        disabled={busyId === g.id}
                        className="rounded-full px-3 py-1.5 text-xs font-semibold text-ink-soft transition hover:bg-[var(--nav-hover-bg)] hover:text-foreground disabled:opacity-60"
                      >
                        {t("common.cancel")}
                      </button>
                      <button
                        onClick={() => handleDelete(g.id)}
                        disabled={busyId === g.id}
                        className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                      >
                        {busyId === g.id ? t("common.deleting") : t("common.confirmDelete")}
                      </button>
                    </div>
                  ) : (
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        onClick={() => toggleHistory(g.id)}
                        aria-label={historyOpenId === g.id ? "Hide history" : "Show history"}
                        className={`rounded-full p-2 transition hover:bg-[var(--nav-hover-bg)] hover:text-foreground ${
                          historyOpenId === g.id ? "text-foreground" : "text-ink-soft"
                        }`}
                      >
                        <HistoryIcon />
                      </button>
                      <button
                        onClick={() => handleDelete(g.id)}
                        aria-label={`Delete ${g.name}`}
                        className="rounded-full p-2 text-ink-soft transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-3 flex items-center gap-2 pl-[3.25rem]">
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    placeholder={t("form.amount")}
                    value={contributeAmount[g.id] ?? ""}
                    onChange={(e) => setContributeAmount((prev) => ({ ...prev, [g.id]: e.target.value }))}
                    className="w-28 rounded-card border border-line bg-bg-soft px-3 py-1.5 text-sm text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
                  />
                  <button
                    onClick={() => handleContribute(g, Number(contributeAmount[g.id] ?? 0))}
                    disabled={busyId === g.id || !contributeAmount[g.id]}
                    className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-[var(--nav-hover-bg)] disabled:opacity-60"
                  >
                    {t("common.add")}
                  </button>
                  <button
                    onClick={() => handleContribute(g, -Number(contributeAmount[g.id] ?? 0))}
                    disabled={busyId === g.id || !contributeAmount[g.id]}
                    className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-[var(--nav-hover-bg)] disabled:opacity-60"
                  >
                    {t("savings.withdraw")}
                  </button>
                </div>

                {historyOpenId === g.id && (
                  <div className="mt-3 ml-[3.25rem] overflow-hidden rounded-card border border-line bg-bg-soft">
                    {historyByGoal[g.id] === undefined ? (
                      <p className="px-3 py-3 text-xs text-ink-soft">{t("common.loading")}</p>
                    ) : historyByGoal[g.id]!.length === 0 ? (
                      <p className="px-3 py-3 text-xs text-ink-soft">{t("savings.noContributionsYet")}</p>
                    ) : (
                      historyByGoal[g.id]!.map((c, ci) => {
                        const delta = Number(c.delta);
                        return (
                          <div
                            key={c.id}
                            className={`flex items-center justify-between gap-3 px-3 py-2 text-xs ${ci === 0 ? "" : "border-t border-line"}`}
                          >
                            <span className={delta >= 0 ? "font-medium text-emerald-600 dark:text-emerald-400" : "font-medium text-red-600 dark:text-red-400"}>
                              {delta >= 0 ? "+" : ""}
                              {formatCurrency(delta, currency)}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-right text-ink-soft">{new Date(c.created_at).toLocaleString()}</span>
                            <button
                              onClick={() => handleDeleteContribution(g.id, c.id)}
                              disabled={busyId === g.id}
                              aria-label="Delete this contribution"
                              className="shrink-0 rounded-full p-1 text-ink-soft transition hover:bg-red-50 hover:text-red-600 disabled:opacity-60 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                            >
                              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-3 w-3">
                                <path d="M5 5l10 10M15 5L5 15" />
                              </svg>
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
