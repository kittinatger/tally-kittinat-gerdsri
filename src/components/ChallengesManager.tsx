"use client";

import { describeFetchError } from "@/lib/fetch-error";
import { useEffect, useRef, useState } from "react";
import { badgeClasses, dotClasses } from "@/lib/category-styles";
import { WIDGET_ACCENTS } from "@/lib/dashboard-widgets";
import { useCurrency } from "@/lib/currency-context";
import { formatCurrency, todayInputValue } from "@/lib/format";
import { CHALLENGE_TYPES, CHALLENGE_MODES, type ChallengeType, type ChallengeMode } from "@/lib/challenges";

type Challenge = {
  id: number;
  creator_id: number;
  title: string;
  type: ChallengeType;
  mode: ChallengeMode;
  target_amount: string;
  category: string | null;
  start_date: string;
  end_date: string;
  participant_count: number;
  my_status: "invited" | "accepted" | "declined";
};

type Participant = {
  id: number;
  user_id: number;
  username: string;
  status: "invited" | "accepted" | "declined";
  progress_amount: string;
  is_me: boolean;
  revealed_to_me: boolean;
};

type ChallengeDetail = { challenge: Challenge; participants: Participant[] };
type RevealRequest = { id: number; challenge_id: number; challenge_title: string; requester_username: string };
type Friend = { id: number; username: string };

const TYPE_LABELS: Record<ChallengeType, string> = {
  savings: "Savings race",
  spending_limit: "Spending limit",
  no_spend_days: "No-spend days",
};

const MODE_LABELS: Record<ChallengeMode, string> = {
  collaborative: "Together",
  competitive: "Against each other",
};

function colorForUsername(username: string): string {
  let hash = 0;
  for (let i = 0; i < username.length; i++) hash = (hash * 31 + username.charCodeAt(i)) >>> 0;
  return WIDGET_ACCENTS[hash % WIDGET_ACCENTS.length];
}

function Avatar({ username }: { username: string }) {
  return (
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${badgeClasses(colorForUsername(username))}`}
    >
      {username.charAt(0).toUpperCase()}
    </span>
  );
}

function TrophyIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M6 3h8v4a4 4 0 0 1-8 0V3Z" />
      <path d="M6 4H3.5a1 1 0 0 0-1 1.2l.4 1.6A2 2 0 0 0 4.85 8.3H6M14 4h2.5a1 1 0 0 1 1 1.2l-.4 1.6a2 2 0 0 1-1.95 1.5H14" />
      <path d="M8 12v2a2 2 0 0 0 2 2 2 2 0 0 0 2-2v-2M7 17h6" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M4 5.5h12M8 5.5V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.5M5.5 5.5 6 16a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l.5-10.5" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
      <path d="M1.5 10S4.5 4.5 10 4.5 18.5 10 18.5 10 15.5 15.5 10 15.5 1.5 10 1.5 10Z" />
      <circle cx="10" cy="10" r="2.25" />
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

function formatProgress(type: ChallengeType, amount: number, currency: string): string {
  if (type === "no_spend_days") return `${amount} day${amount === 1 ? "" : "s"}`;
  return formatCurrency(amount, currency);
}

// Higher progress is better for savings/no_spend_days; lower is better for
// a spending cap you're trying to stay under.
function rankParticipants(type: ChallengeType, participants: Participant[]): Participant[] {
  const sorted = [...participants].sort((a, b) => Number(a.progress_amount) - Number(b.progress_amount));
  return type === "spending_limit" ? sorted : sorted.reverse();
}

export default function ChallengesManager() {
  const currency = useCurrency();
  const [challenges, setChallenges] = useState<Challenge[] | null>(null);
  const [reveals, setReveals] = useState<RevealRequest[] | null>(null);
  const [friends, setFriends] = useState<Friend[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tab, setTab] = useState<"active" | "requests">("active");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<ChallengeDetail | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [contributionDrafts, setContributionDrafts] = useState<Record<number, string>>({});
  const [revealedIds, setRevealedIds] = useState<Set<number>>(new Set());

  const [title, setTitle] = useState("");
  const [type, setType] = useState<ChallengeType>("savings");
  const [mode, setMode] = useState<ChallengeMode>("competitive");
  const [targetAmount, setTargetAmount] = useState("");
  const [category, setCategory] = useState("");
  const [startDate, setStartDate] = useState(todayInputValue());
  const [endDate, setEndDate] = useState("");
  const [inviteeIds, setInviteeIds] = useState<number[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const detailReqId = useRef(0);

  async function refresh() {
    const [challengesRes, revealsRes] = await Promise.all([fetch("/api/challenges"), fetch("/api/challenge-reveals")]);
    const [challengesJson, revealsJson] = await Promise.all([challengesRes.json(), revealsRes.json()]);
    setChallenges(Array.isArray(challengesJson.challenges) ? challengesJson.challenges : []);
    setReveals(Array.isArray(revealsJson.requests) ? revealsJson.requests : []);
  }

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/challenges").then((r) => r.json()),
      fetch("/api/challenge-reveals").then((r) => r.json()),
      fetch("/api/friends").then((r) => r.json()),
    ])
      .then(([c, r, f]) => {
        if (cancelled) return;
        setChallenges(Array.isArray(c.challenges) ? c.challenges : []);
        setReveals(Array.isArray(r.requests) ? r.requests : []);
        setFriends(Array.isArray(f.friends) ? f.friends : []);
      })
      .catch(() => {
        if (!cancelled) setLoadError("Could not load challenges.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function loadDetail(id: number) {
    const reqId = ++detailReqId.current;
    setDetail(null);
    try {
      const res = await fetch(`/api/challenges/${id}`);
      const json = await res.json();
      if (reqId === detailReqId.current && res.ok) setDetail(json);
    } catch {
      // Leave detail null; the row stays expanded with a loading state.
    }
  }

  function toggleExpand(id: number) {
    if (expandedId === id) {
      setExpandedId(null);
      setDetail(null);
      return;
    }
    setExpandedId(id);
    setRevealedIds(new Set());
    loadDetail(id);
  }

  async function respondToInvite(id: number, accept: boolean) {
    setBusyId(`invite-${id}`);
    setError(null);
    try {
      const res = await fetch(`/api/challenges/${id}/respond`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accept }),
      });
      if (!res.ok) {
        setError("Could not respond to that invite.");
        return;
      }
      await refresh();
    } catch (err) {
      setError(describeFetchError(err));
    } finally {
      setBusyId(null);
    }
  }

  async function leaveOrDelete(id: number) {
    setBusyId(`leave-${id}`);
    setError(null);
    try {
      const res = await fetch(`/api/challenges/${id}`, { method: "DELETE" });
      if (!res.ok) {
        setError("Could not remove that challenge.");
        return;
      }
      setConfirmDeleteId(null);
      if (expandedId === id) {
        setExpandedId(null);
        setDetail(null);
      }
      await refresh();
    } catch (err) {
      setError(describeFetchError(err));
    } finally {
      setBusyId(null);
    }
  }

  async function submitContribution(id: number) {
    const raw = contributionDrafts[id];
    const amount = Number(raw);
    if (!raw || !Number.isFinite(amount) || amount <= 0) return;
    setBusyId(`contribute-${id}`);
    setError(null);
    try {
      const res = await fetch(`/api/challenges/${id}/contribute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof json.error === "string" ? json.error : "Could not add that contribution.");
        return;
      }
      setContributionDrafts((prev) => ({ ...prev, [id]: "" }));
      await loadDetail(id);
    } catch (err) {
      setError(describeFetchError(err));
    } finally {
      setBusyId(null);
    }
  }

  async function askToReveal(challengeId: number, targetUserId: number) {
    setBusyId(`reveal-${targetUserId}`);
    setError(null);
    try {
      const res = await fetch(`/api/challenges/${challengeId}/reveal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId }),
      });
      if (!res.ok) {
        setError("Could not send that request.");
        return;
      }
      setRevealedIds((prev) => new Set(prev).add(targetUserId));
    } catch (err) {
      setError(describeFetchError(err));
    } finally {
      setBusyId(null);
    }
  }

  async function respondToReveal(id: number, accept: boolean) {
    setBusyId(`reveal-resp-${id}`);
    setError(null);
    try {
      const res = await fetch(`/api/challenge-reveals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accept }),
      });
      if (!res.ok) {
        setError("Could not respond to that request.");
        return;
      }
      await refresh();
    } catch (err) {
      setError(describeFetchError(err));
    } finally {
      setBusyId(null);
    }
  }

  function resetForm() {
    setTitle("");
    setType("savings");
    setMode("competitive");
    setTargetAmount("");
    setCategory("");
    setStartDate(todayInputValue());
    setEndDate("");
    setInviteeIds([]);
    setFormError(null);
  }

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const amount = Number(targetAmount);
    if (!title.trim()) {
      setFormError("Give the challenge a name.");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setFormError("Enter a target amount.");
      return;
    }
    if (!endDate) {
      setFormError("Pick an end date.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          type,
          mode,
          targetAmount: amount,
          category: type === "spending_limit" && category.trim() ? category.trim() : null,
          startDate,
          endDate,
          inviteeIds,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setFormError(typeof json.error === "string" ? json.error : "Could not create that challenge.");
        return;
      }
      resetForm();
      setCreating(false);
      await refresh();
    } catch (err) {
      setFormError(describeFetchError(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (loadError) {
    return <p className="text-sm text-red-600 dark:text-red-400">{loadError}</p>;
  }

  if (!challenges || !reveals || !friends) {
    return <p className="text-sm text-ink-soft">Loading…</p>;
  }

  const active = challenges.filter((c) => c.my_status === "accepted");
  const invites = challenges.filter((c) => c.my_status === "invited");
  const requestCount = invites.length + reveals.length;

  return (
    <div className="space-y-5">
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1 rounded-full bg-bg-soft p-1">
          {(
            [
              { id: "active" as const, label: "Challenges", count: active.length },
              { id: "requests" as const, label: "Requests", count: requestCount },
            ]
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                tab === t.id ? "bg-surface text-foreground shadow-sm" : "text-ink-soft"
              }`}
            >
              {t.label}
              {t.count > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    tab === t.id ? "bg-navy/10 text-navy dark:text-blue-300" : "bg-[var(--nav-hover-bg)] text-ink-soft"
                  }`}
                >
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            setCreating((v) => !v);
            if (creating) resetForm();
          }}
          aria-label="New challenge"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy text-white shadow-soft transition hover:bg-navy-dark"
        >
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4">
            {creating ? <path d="M5 5l10 10M15 5 5 15" /> : <path d="M10 4v12M4 10h12" />}
          </svg>
        </button>
      </div>

      {creating && (
        <form onSubmit={submitCreate} className="space-y-3 rounded-card border border-line bg-surface p-4">
          {formError && <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Challenge name"
            className="w-full rounded-card border border-line bg-bg-soft px-3.5 py-2 text-sm text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
          />

          <div className="grid grid-cols-2 gap-2.5">
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ChallengeType)}
              className="rounded-card border border-line bg-bg-soft px-3.5 py-2 text-sm text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
            >
              {CHALLENGE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABELS[t]}
                </option>
              ))}
            </select>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as ChallengeMode)}
              className="rounded-card border border-line bg-bg-soft px-3.5 py-2 text-sm text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
            >
              {CHALLENGE_MODES.map((m) => (
                <option key={m} value={m}>
                  {MODE_LABELS[m]}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              placeholder={type === "no_spend_days" ? "Target days" : "Target amount"}
              className="rounded-card border border-line bg-bg-soft px-3.5 py-2 text-sm text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
            />
            {type === "spending_limit" ? (
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Category (optional)"
                className="rounded-card border border-line bg-bg-soft px-3.5 py-2 text-sm text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
              />
            ) : (
              <div />
            )}
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-card border border-line bg-bg-soft px-3.5 py-2 text-sm text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-card border border-line bg-bg-soft px-3.5 py-2 text-sm text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
            />
          </div>

          {friends.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-soft">Invite</p>
              <div className="flex flex-wrap gap-1.5">
                {friends.map((f) => {
                  const selected = inviteeIds.includes(f.id);
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() =>
                        setInviteeIds((prev) => (selected ? prev.filter((id) => id !== f.id) : [...prev, f.id]))
                      }
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                        selected ? "bg-navy text-white" : "bg-bg-soft text-ink-soft hover:text-foreground"
                      }`}
                    >
                      {f.username}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-navy-dark disabled:opacity-60"
          >
            {submitting ? "Creating…" : "Create challenge"}
          </button>
        </form>
      )}

      {tab === "active" &&
        (active.length === 0 ? (
          <EmptyState icon={<TrophyIcon />} text="No challenges yet — create one and invite friends or family." />
        ) : (
          <div className="space-y-2.5">
            {active.map((c) => {
              const expanded = expandedId === c.id;
              const isCreator = detail?.challenge.id === c.id && detail.challenge.creator_id === detail.participants.find((p) => p.is_me)?.user_id;
              return (
                <div key={c.id} className="overflow-hidden rounded-card border border-line bg-surface">
                  <button
                    type="button"
                    onClick={() => toggleExpand(c.id)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left"
                  >
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${badgeClasses("violet")}`}>
                      <TrophyIcon />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">{c.title}</p>
                      <p className="text-xs text-ink-soft">
                        {TYPE_LABELS[c.type]} · {MODE_LABELS[c.mode]} · {c.participant_count} people
                      </p>
                    </div>
                    <svg
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`h-4 w-4 shrink-0 text-ink-soft transition ${expanded ? "rotate-180" : ""}`}
                    >
                      <path d="m5 7.5 5 5 5-5" />
                    </svg>
                  </button>

                  {expanded && (
                    <div className="border-t border-line px-4 py-3">
                      {!detail || detail.challenge.id !== c.id ? (
                        <p className="text-sm text-ink-soft">Loading…</p>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-xs text-ink-soft">
                            {detail.challenge.start_date} – {detail.challenge.end_date}
                            {detail.challenge.category ? ` · ${detail.challenge.category}` : ""}
                          </p>

                          {detail.challenge.mode === "collaborative" &&
                            (() => {
                              const target = Number(detail.challenge.target_amount);
                              const combined = detail.participants.reduce((sum, p) => sum + Number(p.progress_amount), 0);
                              const pct = target > 0 ? Math.min(100, Math.round((combined / target) * 100)) : 0;
                              return (
                                <div className="rounded-card border border-line bg-bg-soft p-3">
                                  <div className="mb-1 flex items-center justify-between text-sm">
                                    <span className="font-medium text-foreground">Combined progress</span>
                                    <span className="text-ink-soft">
                                      {formatProgress(detail.challenge.type, combined, currency)} / {formatProgress(detail.challenge.type, target, currency)}
                                    </span>
                                  </div>
                                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface">
                                    <div className={`h-full rounded-full ${dotClasses("violet")}`} style={{ width: `${Math.max(2, pct)}%` }} />
                                  </div>
                                </div>
                              );
                            })()}

                          <div className="space-y-1.5">
                            {rankParticipants(detail.challenge.type, detail.participants).map((p, i) => {
                              const target = Number(detail.challenge.target_amount);
                              const amt = Number(p.progress_amount);
                              const pct = target > 0 ? Math.min(100, Math.round((amt / target) * 100)) : 0;
                              const canAskReveal =
                                !p.is_me && !p.revealed_to_me && !revealedIds.has(p.user_id) && detail.challenge.mode === "competitive";
                              return (
                                <div key={p.id} className="flex items-center gap-2.5">
                                  {detail.challenge.mode === "competitive" && (
                                    <span className="w-4 shrink-0 text-center text-xs font-bold text-ink-soft">{i + 1}</span>
                                  )}
                                  <Avatar username={p.username} />
                                  <div className="min-w-0 flex-1">
                                    <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                                      <span className="truncate font-medium text-foreground">
                                        {p.username}
                                        {p.is_me && <span className="text-ink-soft"> (you)</span>}
                                      </span>
                                      <span className="shrink-0 text-ink-soft">
                                        {p.is_me || p.revealed_to_me || detail.challenge.mode === "collaborative"
                                          ? formatProgress(detail.challenge.type, amt, currency)
                                          : `${pct}%`}
                                      </span>
                                    </div>
                                    <div className={`h-1.5 w-full overflow-hidden rounded-full bg-bg-soft`}>
                                      <div className={`h-full rounded-full ${dotClasses("violet")}`} style={{ width: `${Math.max(2, pct)}%` }} />
                                    </div>
                                  </div>
                                  {canAskReveal && (
                                    <button
                                      type="button"
                                      onClick={() => askToReveal(detail.challenge.id, p.user_id)}
                                      disabled={busyId === `reveal-${p.user_id}`}
                                      aria-label={`Ask ${p.username} to reveal their amount`}
                                      className="shrink-0 rounded-full p-1.5 text-ink-soft transition hover:bg-[var(--nav-hover-bg)] hover:text-foreground disabled:opacity-60"
                                    >
                                      <EyeIcon />
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {detail.challenge.type === "savings" &&
                            detail.participants.find((p) => p.is_me)?.status === "accepted" && (
                              <div className="flex gap-1.5">
                                <input
                                  type="number"
                                  min="0.01"
                                  step="0.01"
                                  value={contributionDrafts[c.id] ?? ""}
                                  onChange={(e) => setContributionDrafts((prev) => ({ ...prev, [c.id]: e.target.value }))}
                                  placeholder="Add contribution"
                                  className="flex-1 rounded-card border border-line bg-bg-soft px-3 py-1.5 text-sm text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
                                />
                                <button
                                  type="button"
                                  onClick={() => submitContribution(c.id)}
                                  disabled={busyId === `contribute-${c.id}`}
                                  className="rounded-full bg-navy px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-navy-dark disabled:opacity-60"
                                >
                                  Add
                                </button>
                              </div>
                            )}

                          {confirmDeleteId === c.id ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                disabled={busyId === `leave-${c.id}`}
                                className="rounded-full px-3 py-1.5 text-xs font-semibold text-ink-soft transition hover:bg-[var(--nav-hover-bg)] hover:text-foreground disabled:opacity-60"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => leaveOrDelete(c.id)}
                                disabled={busyId === `leave-${c.id}`}
                                className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                              >
                                {busyId === `leave-${c.id}` ? "Removing…" : isCreator ? "Confirm delete" : "Confirm leave"}
                              </button>
                            </div>
                          ) : (
                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(c.id)}
                                aria-label={isCreator ? "Delete challenge" : "Leave challenge"}
                                className="rounded-full p-2 text-ink-soft transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                              >
                                <TrashIcon />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}

      {tab === "requests" &&
        (requestCount === 0 ? (
          <EmptyState icon={<TrophyIcon />} text="No pending invites or reveal requests." />
        ) : (
          <div className="space-y-5">
            {invites.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">Challenge invites</h3>
                <div className="overflow-hidden rounded-card border border-line bg-surface">
                  {invites.map((c, i) => (
                    <div key={c.id} className={`flex items-center gap-3 px-4 py-3 ${i === 0 ? "" : "border-t border-line"}`}>
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${badgeClasses("violet")}`}>
                        <TrophyIcon />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-foreground">{c.title}</p>
                        <p className="text-xs text-ink-soft">
                          {TYPE_LABELS[c.type]} · {MODE_LABELS[c.mode]}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-1.5">
                        <button
                          type="button"
                          onClick={() => respondToInvite(c.id, true)}
                          disabled={busyId === `invite-${c.id}`}
                          className="rounded-full bg-navy px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-navy-dark disabled:opacity-60"
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => respondToInvite(c.id, false)}
                          disabled={busyId === `invite-${c.id}`}
                          className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-[var(--nav-hover-bg)] disabled:opacity-60"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {reveals.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">Wants to see your amount</h3>
                <div className="overflow-hidden rounded-card border border-line bg-surface">
                  {reveals.map((r, i) => (
                    <div key={r.id} className={`flex items-center gap-3 px-4 py-3 ${i === 0 ? "" : "border-t border-line"}`}>
                      <Avatar username={r.requester_username} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-foreground">{r.requester_username}</p>
                        <p className="truncate text-xs text-ink-soft">in “{r.challenge_title}”</p>
                      </div>
                      <div className="flex shrink-0 gap-1.5">
                        <button
                          type="button"
                          onClick={() => respondToReveal(r.id, true)}
                          disabled={busyId === `reveal-resp-${r.id}`}
                          className="rounded-full bg-navy px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-navy-dark disabled:opacity-60"
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => respondToReveal(r.id, false)}
                          disabled={busyId === `reveal-resp-${r.id}`}
                          className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-[var(--nav-hover-bg)] disabled:opacity-60"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
    </div>
  );
}
