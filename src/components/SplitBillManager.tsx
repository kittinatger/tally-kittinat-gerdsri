"use client";

import { describeFetchError } from "@/lib/fetch-error";
import { useEffect, useRef, useState } from "react";
import { badgeClasses } from "@/lib/category-styles";
import { WIDGET_ACCENTS } from "@/lib/dashboard-widgets";
import { useCurrency } from "@/lib/currency-context";
import { formatCurrency, todayInputValue } from "@/lib/format";
import { SPLIT_METHODS, SPLIT_PAYMENT_METHODS, type SplitMethod, type SplitPaymentMethod } from "@/lib/splits";
import { useT } from "@/lib/language-context";
import type { MessageKey } from "@/lib/i18n/messages";
import RecurringSplitsSection from "./RecurringSplitsSection";

type Split = {
  id: number;
  creator_id: number;
  title: string;
  total_amount: string;
  split_method: SplitMethod;
  date: string;
  participant_count: number;
  my_net: string;
  my_confirm_status: "pending" | "accepted" | "declined";
  my_settled: boolean;
};

type Participant = {
  id: number;
  user_id: number;
  username: string;
  owed_amount: string;
  paid_amount: string;
  confirm_status: "pending" | "accepted" | "declined";
  settled: boolean;
  is_me: boolean;
};

type SplitDetail = { split: Split; participants: Participant[] };
type Friend = { id: number; username: string };

const METHOD_KEYS: Record<SplitMethod, MessageKey> = {
  equal: "split.equalSplit",
  custom: "split.customSplit",
};

const PAYMENT_KEYS: Record<SplitPaymentMethod, MessageKey> = {
  single_payer: "split.iPaidWhole",
  itemized: "split.trackWhoPaid",
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

function ReceiptIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M5 2.5h10v15l-2-1.3-1.5 1.3-1.5-1.3-1.5 1.3-1.5-1.3-2 1.3v-15Z" />
      <path d="M7.5 6.5h5M7.5 9.5h5M7.5 12.5h3" />
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

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
      <path d="M4 10.5 8 14l8-8" />
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

function netLabel(
  net: number,
  currency: string,
  t: (key: MessageKey) => string,
): { text: string; className: string } {
  if (Math.abs(net) < 0.01) return { text: t("split.settledUp"), className: "text-ink-soft" };
  if (net > 0)
    return {
      text: `${t("split.youreOwedPrefix")} ${formatCurrency(net, currency)}`,
      className: "text-emerald-600 dark:text-emerald-400",
    };
  return {
    text: `${t("split.youOwePrefix")} ${formatCurrency(-net, currency)}`,
    className: "text-rose-600 dark:text-rose-400",
  };
}

export default function SplitBillManager() {
  const t = useT();
  const METHOD_LABELS: Record<SplitMethod, string> = Object.fromEntries(
    Object.entries(METHOD_KEYS).map(([k, v]) => [k, t(v)]),
  ) as Record<SplitMethod, string>;
  const PAYMENT_LABELS: Record<SplitPaymentMethod, string> = Object.fromEntries(
    Object.entries(PAYMENT_KEYS).map(([k, v]) => [k, t(v)]),
  ) as Record<SplitPaymentMethod, string>;
  const currency = useCurrency();
  const [myId, setMyId] = useState<number | null>(null);
  const [splits, setSplits] = useState<Split[] | null>(null);
  const [friends, setFriends] = useState<Friend[] | null>(null);
  const [requireConfirmation, setRequireConfirmation] = useState<boolean | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tab, setTab] = useState<"active" | "requests">("active");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<SplitDetail | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [copiedShareId, setCopiedShareId] = useState<number | null>(null);
  const detailReqId = useRef(0);

  const [title, setTitle] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [date, setDate] = useState(todayInputValue());
  const [splitMethod, setSplitMethod] = useState<SplitMethod>("equal");
  const [paymentMethod, setPaymentMethod] = useState<SplitPaymentMethod>("single_payer");
  const [participantIds, setParticipantIds] = useState<number[]>([]);
  const [customOwed, setCustomOwed] = useState<Record<number, string>>({});
  const [customPaid, setCustomPaid] = useState<Record<number, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function refresh() {
    const res = await fetch("/api/splits");
    const json = await res.json();
    setSplits(Array.isArray(json.splits) ? json.splits : []);
  }

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/splits").then((r) => r.json()),
      fetch("/api/friends").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
      fetch("/api/account").then((r) => r.json()),
    ])
      .then(([s, f, settings, account]) => {
        if (cancelled) return;
        setSplits(Array.isArray(s.splits) ? s.splits : []);
        setFriends(Array.isArray(f.friends) ? f.friends : []);
        setRequireConfirmation(Boolean(settings.requireSplitConfirmation));
        setMyId(typeof account.id === "number" ? account.id : null);
      })
      .catch(() => {
        if (!cancelled) setLoadError("Could not load split bills.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function loadDetail(id: number) {
    const reqId = ++detailReqId.current;
    setDetail(null);
    try {
      const res = await fetch(`/api/splits/${id}`);
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
    loadDetail(id);
  }

  async function toggleRequireConfirmation() {
    const next = !requireConfirmation;
    setRequireConfirmation(next);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requireSplitConfirmation: next }),
      });
      if (!res.ok) setRequireConfirmation(!next);
    } catch {
      setRequireConfirmation(!next);
    }
  }

  async function respond(id: number, accept: boolean) {
    setBusyId(`respond-${id}`);
    setError(null);
    try {
      const res = await fetch(`/api/splits/${id}/respond`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accept }),
      });
      if (!res.ok) {
        setError("Could not respond to that split.");
        return;
      }
      await refresh();
    } catch (err) {
      setError(describeFetchError(err));
    } finally {
      setBusyId(null);
    }
  }

  async function toggleSettled(id: number) {
    setBusyId(`settle-${id}`);
    setError(null);
    try {
      const res = await fetch(`/api/splits/${id}/settle`, { method: "PATCH" });
      if (!res.ok) {
        setError("Could not update that split.");
        return;
      }
      await refresh();
      if (expandedId === id) await loadDetail(id);
    } catch (err) {
      setError(describeFetchError(err));
    } finally {
      setBusyId(null);
    }
  }

  async function handleCopyShareLink(id: number) {
    setBusyId(`share-${id}`);
    try {
      const res = await fetch(`/api/splits/${id}/share`, { method: "POST" });
      const data = await res.json();
      if (res.ok && typeof data.token === "string") {
        await navigator.clipboard.writeText(`${window.location.origin}/splits/${data.token}`);
        setCopiedShareId(id);
        setTimeout(() => setCopiedShareId((prev) => (prev === id ? null : prev)), 2000);
      }
    } catch {
      // Best-effort — no error surfaced for a failed share-link copy, the
      // button just doesn't show the "Copied" confirmation.
    } finally {
      setBusyId(null);
    }
  }

  async function leaveOrDelete(id: number) {
    setBusyId(`leave-${id}`);
    setError(null);
    try {
      const res = await fetch(`/api/splits/${id}`, { method: "DELETE" });
      if (!res.ok) {
        setError("Could not remove that split.");
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

  function resetForm() {
    setTitle("");
    setTotalAmount("");
    setDate(todayInputValue());
    setSplitMethod("equal");
    setPaymentMethod("single_payer");
    setParticipantIds([]);
    setCustomOwed({});
    setCustomPaid({});
    setFormError(null);
  }

  function toggleParticipant(id: number) {
    setParticipantIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  }

  const allSelectedIds = myId !== null ? [myId, ...participantIds] : [];
  const owedSum = allSelectedIds.reduce((sum, id) => sum + (Number(customOwed[id]) || 0), 0);
  const paidSum = allSelectedIds.reduce((sum, id) => sum + (Number(customPaid[id]) || 0), 0);

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (myId === null) {
      setFormError("Could not determine your account — try reloading.");
      return;
    }
    const amount = Number(totalAmount);
    if (!title.trim()) {
      setFormError("Give the bill a name.");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setFormError("Enter a total amount.");
      return;
    }
    if (participantIds.length === 0) {
      setFormError("Pick at least one friend to split with.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/splits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          totalAmount: amount,
          splitMethod,
          paymentMethod,
          date,
          participantIds,
          customOwed:
            splitMethod === "custom"
              ? allSelectedIds.map((id) => ({ userId: id, amount: Number(customOwed[id]) || 0 }))
              : undefined,
          customPaid:
            paymentMethod === "itemized"
              ? allSelectedIds.map((id) => ({ userId: id, amount: Number(customPaid[id]) || 0 }))
              : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setFormError(typeof json.error === "string" ? json.error : "Could not create that split.");
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

  if (!splits || !friends || requireConfirmation === null) {
    return <p className="text-sm text-ink-soft">{t("common.loading")}</p>;
  }

  const active = splits.filter((s) => s.my_confirm_status !== "pending");
  const requests = splits.filter((s) => s.my_confirm_status === "pending");

  return (
    <div className="space-y-5">
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <label className="flex items-center justify-between gap-3 rounded-card border border-line bg-surface px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{t("split.requireConfirmation")}</p>
          <p className="text-xs text-ink-soft">{t("split.requireConfirmationDesc")}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={requireConfirmation}
          onClick={toggleRequireConfirmation}
          className={`relative h-5 w-9 shrink-0 rounded-full transition ${requireConfirmation ? "bg-navy" : "bg-bg-soft"}`}
        >
          <span
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${
              requireConfirmation ? "left-[18px]" : "left-0.5"
            }`}
          />
        </button>
      </label>

      <RecurringSplitsSection myId={myId} friends={friends} />

      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1 rounded-full bg-bg-soft p-1">
          {(
            [
              { id: "active" as const, label: t("split.splitsTab"), count: active.length },
              { id: "requests" as const, label: t("friends.requestsTab"), count: requests.length },
            ]
          ).map((tabDef) => (
            <button
              key={tabDef.id}
              type="button"
              onClick={() => setTab(tabDef.id)}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                tab === tabDef.id ? "bg-surface text-foreground shadow-sm" : "text-ink-soft"
              }`}
            >
              {tabDef.label}
              {tabDef.count > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    tab === tabDef.id ? "bg-navy/10 text-navy dark:text-blue-300" : "bg-[var(--nav-hover-bg)] text-ink-soft"
                  }`}
                >
                  {tabDef.count}
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
          aria-label={t("split.newSplit")}
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
            placeholder={t("split.whatsTheBillFor")}
            className="w-full rounded-card border border-line bg-bg-soft px-3.5 py-2 text-sm text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
          />

          <div className="grid grid-cols-2 gap-2.5">
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              placeholder={t("split.totalAmount")}
              className="rounded-card border border-line bg-bg-soft px-3.5 py-2 text-sm text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
            />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-card border border-line bg-bg-soft px-3.5 py-2 text-sm text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
            />
          </div>

          {friends.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-soft">{t("split.splitWith")}</p>
              <div className="flex flex-wrap gap-1.5">
                {friends.map((f) => {
                  const selected = participantIds.includes(f.id);
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => toggleParticipant(f.id)}
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

          <div className="grid grid-cols-2 gap-2.5">
            <select
              value={splitMethod}
              onChange={(e) => setSplitMethod(e.target.value as SplitMethod)}
              className="rounded-card border border-line bg-bg-soft px-3.5 py-2 text-sm text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
            >
              {SPLIT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {METHOD_LABELS[m]}
                </option>
              ))}
            </select>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as SplitPaymentMethod)}
              className="rounded-card border border-line bg-bg-soft px-3.5 py-2 text-sm text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
            >
              {SPLIT_PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {PAYMENT_LABELS[m]}
                </option>
              ))}
            </select>
          </div>

          {splitMethod === "custom" && participantIds.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                {t("split.whoOwesWhat")} {totalAmount && `(${owedSum.toFixed(2)} / ${Number(totalAmount).toFixed(2)} ${t("split.allocated")})`}
              </p>
              {allSelectedIds.map((id) => (
                <div key={id} className="flex items-center gap-2">
                  <span className="w-24 shrink-0 truncate text-sm text-foreground">
                    {id === myId ? t("split.you") : friends.find((f) => f.id === id)?.username}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={customOwed[id] ?? ""}
                    onChange={(e) => setCustomOwed((prev) => ({ ...prev, [id]: e.target.value }))}
                    className="flex-1 rounded-card border border-line bg-bg-soft px-3 py-1.5 text-sm text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
                  />
                </div>
              ))}
            </div>
          )}

          {paymentMethod === "itemized" && participantIds.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                {t("split.whoPaidWhat")} {totalAmount && `(${paidSum.toFixed(2)} / ${Number(totalAmount).toFixed(2)} ${t("split.allocated")})`}
              </p>
              {allSelectedIds.map((id) => (
                <div key={id} className="flex items-center gap-2">
                  <span className="w-24 shrink-0 truncate text-sm text-foreground">
                    {id === myId ? t("split.you") : friends.find((f) => f.id === id)?.username}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={customPaid[id] ?? ""}
                    onChange={(e) => setCustomPaid((prev) => ({ ...prev, [id]: e.target.value }))}
                    className="flex-1 rounded-card border border-line bg-bg-soft px-3 py-1.5 text-sm text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
                  />
                </div>
              ))}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-navy-dark disabled:opacity-60"
          >
            {submitting ? t("challenges.creating") : t("split.createSplit")}
          </button>
        </form>
      )}

      {tab === "active" &&
        (active.length === 0 ? (
          <EmptyState icon={<ReceiptIcon />} text={t("split.noSplitsYet")} />
        ) : (
          <div className="space-y-2.5">
            {active.map((s) => {
              const expanded = expandedId === s.id;
              const net = Number(s.my_net);
              const label = netLabel(net, currency, t);
              const isCreator = detail?.split.id === s.id && detail.split.creator_id === myId;
              return (
                <div key={s.id} className="overflow-hidden rounded-card border border-line bg-surface">
                  <button
                    type="button"
                    onClick={() => toggleExpand(s.id)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left"
                  >
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${badgeClasses("amber")}`}>
                      <ReceiptIcon />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">{s.title}</p>
                      <p className={`text-xs ${label.className}`}>{label.text}</p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-foreground">
                      {formatCurrency(Number(s.total_amount), currency)}
                    </span>
                  </button>

                  {expanded && (
                    <div className="border-t border-line px-4 py-3">
                      {!detail || detail.split.id !== s.id ? (
                        <p className="text-sm text-ink-soft">{t("common.loading")}</p>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-xs text-ink-soft">
                            {detail.split.date} · {METHOD_LABELS[detail.split.split_method]}
                          </p>

                          <div className="space-y-1.5">
                            {detail.participants.map((p) => {
                              const pNet = Number(p.paid_amount) - Number(p.owed_amount);
                              return (
                                <div key={p.id} className="flex items-center gap-2.5">
                                  <Avatar username={p.username} />
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2 text-sm">
                                      <span className="truncate font-medium text-foreground">
                                        {p.username}
                                        {p.is_me && <span className="text-ink-soft"> {t("challenges.you")}</span>}
                                        {p.confirm_status === "pending" && (
                                          <span className="ml-1.5 rounded-full bg-bg-soft px-1.5 py-0.5 text-[10px] font-bold text-ink-soft">
                                            {t("split.pending")}
                                          </span>
                                        )}
                                        {p.confirm_status === "declined" && (
                                          <span className="ml-1.5 rounded-full bg-red-500/10 px-1.5 py-0.5 text-[10px] font-bold text-red-600 dark:text-red-400">
                                            {t("split.declined")}
                                          </span>
                                        )}
                                      </span>
                                      <span className="shrink-0 text-ink-soft">
                                        {t("split.owesPrefix")} {formatCurrency(Number(p.owed_amount), currency)}, {t("split.paidPrefix")}{" "}
                                        {formatCurrency(Number(p.paid_amount), currency)}
                                      </span>
                                    </div>
                                  </div>
                                  {p.settled ? (
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                                      <CheckIcon />
                                    </span>
                                  ) : (
                                    Math.abs(pNet) >= 0.01 &&
                                    p.is_me && (
                                      <button
                                        type="button"
                                        onClick={() => toggleSettled(s.id)}
                                        disabled={busyId === `settle-${s.id}`}
                                        className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold text-ink-soft transition hover:bg-[var(--nav-hover-bg)] hover:text-foreground disabled:opacity-60"
                                      >
                                        {t("split.markSettled")}
                                      </button>
                                    )
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {confirmDeleteId === s.id ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                disabled={busyId === `leave-${s.id}`}
                                className="rounded-full px-3 py-1.5 text-xs font-semibold text-ink-soft transition hover:bg-[var(--nav-hover-bg)] hover:text-foreground disabled:opacity-60"
                              >
                                {t("common.cancel")}
                              </button>
                              <button
                                type="button"
                                onClick={() => leaveOrDelete(s.id)}
                                disabled={busyId === `leave-${s.id}`}
                                className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                              >
                                {busyId === `leave-${s.id}` ? t("challenges.removing") : isCreator ? t("challenges.confirmDelete") : t("challenges.confirmLeave")}
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-2">
                              <button
                                type="button"
                                onClick={() => handleCopyShareLink(s.id)}
                                disabled={busyId === `share-${s.id}`}
                                className="rounded-full px-3 py-1.5 text-xs font-semibold text-ink-soft transition hover:bg-[var(--nav-hover-bg)] hover:text-foreground disabled:opacity-60"
                              >
                                {copiedShareId === s.id ? t("split.linkCopied") : t("split.copyShareLink")}
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(s.id)}
                                aria-label={isCreator ? t("challenges.confirmDelete") : t("challenges.confirmLeave")}
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
        (requests.length === 0 ? (
          <EmptyState icon={<ReceiptIcon />} text={t("split.noPendingRequests")} />
        ) : (
          <div className="overflow-hidden rounded-card border border-line bg-surface">
            {requests.map((s, i) => (
              <div key={s.id} className={`flex items-center gap-3 px-4 py-3 ${i === 0 ? "" : "border-t border-line"}`}>
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${badgeClasses("amber")}`}>
                  <ReceiptIcon />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{s.title}</p>
                  <p className="text-xs text-ink-soft">
                    {formatCurrency(Number(s.total_amount), currency)} {t("split.total")} · {s.participant_count} {t("challenges.people")}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <button
                    type="button"
                    onClick={() => respond(s.id, true)}
                    disabled={busyId === `respond-${s.id}`}
                    className="rounded-full bg-navy px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-navy-dark disabled:opacity-60"
                  >
                    {t("friends.accept")}
                  </button>
                  <button
                    type="button"
                    onClick={() => respond(s.id, false)}
                    disabled={busyId === `respond-${s.id}`}
                    className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-[var(--nav-hover-bg)] disabled:opacity-60"
                  >
                    {t("friends.decline")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}
    </div>
  );
}
