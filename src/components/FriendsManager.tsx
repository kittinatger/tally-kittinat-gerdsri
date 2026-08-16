"use client";

import { describeFetchError } from "@/lib/fetch-error";
import { useEffect, useRef, useState } from "react";
import { badgeClasses } from "@/lib/category-styles";
import { WIDGET_ACCENTS } from "@/lib/dashboard-widgets";
import { useT } from "@/lib/language-context";

type Friend = { id: number; username: string; is_family: boolean };
type FriendRequest = { id: number; username: string; created_at: string };
type SearchResult = { id: number; username: string };

type FriendsData = {
  friends: Friend[];
  family: Friend[];
  incoming: FriendRequest[];
  outgoing: FriendRequest[];
};

type Tab = "friends" | "family" | "requests";

// Deterministic per-username color so the same person always gets the same
// avatar color across sessions, without storing anything extra.
function colorForUsername(username: string): string {
  let hash = 0;
  for (let i = 0; i < username.length; i++) hash = (hash * 31 + username.charCodeAt(i)) >>> 0;
  return WIDGET_ACCENTS[hash % WIDGET_ACCENTS.length];
}

function Avatar({ username }: { username: string }) {
  return (
    <span
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${badgeClasses(colorForUsername(username))}`}
    >
      {username.charAt(0).toUpperCase()}
    </span>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <circle cx="8.5" cy="8.5" r="6" />
      <path d="M17 17l-4-4" />
    </svg>
  );
}

function PersonPlusIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
      <circle cx="7.5" cy="6.5" r="3" />
      <path d="M1.5 17c0-3 2.7-5 6-5s6 2 6 5M15.5 6.5v5M13 9h5" />
    </svg>
  );
}

function HomeHeartIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
      <path d="M3 9.5 10 3l7 6.5V17a1 1 0 0 1-1 1h-3v-5H7v5H4a1 1 0 0 1-1-1Z" />
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

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-card border border-dashed border-line px-4 py-10 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-bg-soft text-ink-soft">{icon}</span>
      <p className="text-sm text-ink-soft">{text}</p>
    </div>
  );
}

export default function FriendsManager() {
  const t = useT();
  const [data, setData] = useState<FriendsData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("friends");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/friends")
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        setData(json);
      })
      .catch(() => {
        if (!cancelled) setLoadError(t("friends.couldNotLoad"));
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetch once on mount; t() re-runs on every render regardless
  }, []);

  function scheduleSearch(q: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q) {
      setResults(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/friends/search?q=${encodeURIComponent(q)}`);
        const json = await res.json();
        setResults(Array.isArray(json.results) ? json.results : []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  }

  async function refresh() {
    const res = await fetch("/api/friends");
    setData(await res.json());
  }

  async function sendRequest(targetUserId: number) {
    setBusyId(`search-${targetUserId}`);
    setError(null);
    try {
      const res = await fetch("/api/friends/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(typeof json.error === "string" ? json.error : "Could not send friend request.");
        return;
      }
      await refresh();
    } catch (err) {
      setError(describeFetchError(err));
    } finally {
      setBusyId(null);
    }
  }

  async function acceptRequest(id: number) {
    setBusyId(`accept-${id}`);
    setError(null);
    try {
      const res = await fetch(`/api/friends/requests/${id}`, { method: "PATCH" });
      if (!res.ok) {
        setError("Could not accept that request.");
        return;
      }
      await refresh();
    } catch (err) {
      setError(describeFetchError(err));
    } finally {
      setBusyId(null);
    }
  }

  async function declineOrCancelRequest(id: number) {
    setBusyId(`decline-${id}`);
    setError(null);
    try {
      const res = await fetch(`/api/friends/requests/${id}`, { method: "DELETE" });
      if (!res.ok) {
        setError("Could not remove that request.");
        return;
      }
      await refresh();
    } catch (err) {
      setError(describeFetchError(err));
    } finally {
      setBusyId(null);
    }
  }

  async function removeFriend(id: number) {
    setBusyId(`remove-${id}`);
    setError(null);
    try {
      const res = await fetch(`/api/friends/${id}`, { method: "DELETE" });
      if (!res.ok) {
        setError("Could not remove that friend.");
        return;
      }
      await refresh();
    } catch (err) {
      setError(describeFetchError(err));
    } finally {
      setBusyId(null);
    }
  }

  async function toggleFamily(id: number, isFamily: boolean) {
    setBusyId(`family-${id}`);
    setError(null);
    try {
      const res = await fetch(`/api/friends/${id}/family`, { method: isFamily ? "DELETE" : "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof json.error === "string" ? json.error : "Could not update Family.");
        return;
      }
      await refresh();
    } catch (err) {
      setError(describeFetchError(err));
    } finally {
      setBusyId(null);
    }
  }

  if (loadError) {
    return <p className="text-sm text-red-600 dark:text-red-400">{loadError}</p>;
  }

  if (!data) {
    return <p className="text-sm text-ink-soft">{t("common.loading")}</p>;
  }

  const friendIds = new Set(data.friends.map((f) => f.id));
  const requestCount = data.incoming.length + data.outgoing.length;

  const TABS: { id: Tab; label: string; count: number }[] = [
    { id: "friends", label: t("friends.friendsTab"), count: data.friends.length },
    { id: "family", label: t("friends.familyTab"), count: data.family.length },
    { id: "requests", label: t("friends.requestsTab"), count: requestCount },
  ];

  return (
    <div className="space-y-5">
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft">
          <SearchIcon />
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            const value = e.target.value;
            setQuery(value);
            scheduleSearch(value.trim());
          }}
          placeholder={t("friends.searchPlaceholder")}
          className="w-full rounded-card border border-line bg-bg-soft py-2.5 pl-10 pr-3.5 text-sm text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
        />

        {query.trim() && (
          <div className="mt-2 overflow-hidden rounded-card border border-line bg-surface">
            {searching ? (
              <p className="px-4 py-3 text-sm text-ink-soft">{t("friends.searching")}</p>
            ) : results && results.length === 0 ? (
              <p className="px-4 py-3 text-sm text-ink-soft">{t("friends.noOneFound")}</p>
            ) : (
              results?.map((r, i) => {
                const alreadyFriend = friendIds.has(r.id);
                const pendingOutgoing = data.outgoing.some((o) => o.username === r.username);
                const pendingIncoming = data.incoming.some((inc) => inc.username === r.username);
                return (
                  <div
                    key={r.id}
                    className={`flex items-center gap-3 px-4 py-3 ${i === 0 ? "" : "border-t border-line"}`}
                  >
                    <Avatar username={r.username} />
                    <p className="min-w-0 flex-1 truncate font-medium text-foreground">{r.username}</p>
                    {alreadyFriend ? (
                      <span className="shrink-0 text-xs text-ink-soft">{t("friends.friendsStatus")}</span>
                    ) : pendingOutgoing ? (
                      <span className="shrink-0 text-xs text-ink-soft">{t("friends.requestSent")}</span>
                    ) : pendingIncoming ? (
                      <span className="shrink-0 text-xs text-ink-soft">{t("friends.respondInRequests")}</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => sendRequest(r.id)}
                        disabled={busyId === `search-${r.id}`}
                        className="flex shrink-0 items-center gap-1.5 rounded-full bg-navy px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-navy-dark disabled:opacity-60"
                      >
                        <PersonPlusIcon />
                        {t("common.add")}
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      <div className="flex gap-1 rounded-full bg-bg-soft p-1">
        {TABS.map((tabDef) => (
          <button
            key={tabDef.id}
            type="button"
            onClick={() => setTab(tabDef.id)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-1.5 text-sm font-semibold transition ${
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

      {tab === "friends" &&
        (data.friends.length === 0 ? (
          <EmptyState icon={<PersonPlusIcon />} text={t("friends.noFriendsYet")} />
        ) : (
          <div className="overflow-hidden rounded-card border border-line bg-surface">
            {data.friends.map((f, i) => (
              <div key={f.id} className={`flex items-center gap-3 px-4 py-3 ${i === 0 ? "" : "border-t border-line"}`}>
                <Avatar username={f.username} />
                <p className="min-w-0 flex-1 truncate font-medium text-foreground">{f.username}</p>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => toggleFamily(f.id, f.is_family)}
                    disabled={busyId === `family-${f.id}`}
                    aria-label={f.is_family ? `Remove ${f.username} from Family` : `Add ${f.username} to Family`}
                    className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-semibold transition disabled:opacity-60 ${
                      f.is_family
                        ? "bg-navy/10 text-navy dark:text-blue-300"
                        : "text-ink-soft hover:bg-[var(--nav-hover-bg)] hover:text-foreground"
                    }`}
                  >
                    <HomeHeartIcon />
                    {f.is_family ? t("friends.familyTab") : t("friends.addToFamily")}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeFriend(f.id)}
                    disabled={busyId === `remove-${f.id}`}
                    aria-label={`Remove ${f.username}`}
                    className="rounded-full p-2 text-ink-soft transition hover:bg-red-50 hover:text-red-600 disabled:opacity-60 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}

      {tab === "family" &&
        (data.family.length === 0 ? (
          <EmptyState icon={<HomeHeartIcon />} text={t("friends.noFamilyYet")} />
        ) : (
          <div className="overflow-hidden rounded-card border border-line bg-surface">
            {data.family.map((f, i) => (
              <div key={f.id} className={`flex items-center gap-3 px-4 py-3 ${i === 0 ? "" : "border-t border-line"}`}>
                <Avatar username={f.username} />
                <p className="min-w-0 flex-1 truncate font-medium text-foreground">{f.username}</p>
                <button
                  type="button"
                  onClick={() => toggleFamily(f.id, true)}
                  disabled={busyId === `family-${f.id}`}
                  aria-label={`Remove ${f.username} from Family`}
                  className="rounded-full p-2 text-ink-soft transition hover:bg-red-50 hover:text-red-600 disabled:opacity-60 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                >
                  <TrashIcon />
                </button>
              </div>
            ))}
          </div>
        ))}

      {tab === "requests" &&
        (requestCount === 0 ? (
          <EmptyState icon={<SearchIcon />} text={t("friends.noPendingRequests")} />
        ) : (
          <div className="space-y-5">
            {data.incoming.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">{t("friends.received")}</h3>
                <div className="overflow-hidden rounded-card border border-line bg-surface">
                  {data.incoming.map((req, i) => (
                    <div key={req.id} className={`flex items-center gap-3 px-4 py-3 ${i === 0 ? "" : "border-t border-line"}`}>
                      <Avatar username={req.username} />
                      <p className="min-w-0 flex-1 truncate font-medium text-foreground">{req.username}</p>
                      <div className="flex shrink-0 gap-1.5">
                        <button
                          type="button"
                          onClick={() => acceptRequest(req.id)}
                          disabled={busyId === `accept-${req.id}`}
                          className="rounded-full bg-navy px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-navy-dark disabled:opacity-60"
                        >
                          {t("friends.accept")}
                        </button>
                        <button
                          type="button"
                          onClick={() => declineOrCancelRequest(req.id)}
                          disabled={busyId === `decline-${req.id}`}
                          className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-[var(--nav-hover-bg)] disabled:opacity-60"
                        >
                          {t("friends.decline")}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.outgoing.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">{t("friends.sent")}</h3>
                <div className="overflow-hidden rounded-card border border-line bg-surface">
                  {data.outgoing.map((req, i) => (
                    <div key={req.id} className={`flex items-center gap-3 px-4 py-3 ${i === 0 ? "" : "border-t border-line"}`}>
                      <Avatar username={req.username} />
                      <p className="min-w-0 flex-1 truncate font-medium text-foreground">{req.username}</p>
                      <button
                        type="button"
                        onClick={() => declineOrCancelRequest(req.id)}
                        disabled={busyId === `decline-${req.id}`}
                        className="shrink-0 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-[var(--nav-hover-bg)] disabled:opacity-60"
                      >
                        {t("common.cancel")}
                      </button>
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
