"use client";

import { describeFetchError } from "@/lib/fetch-error";
import { useEffect, useRef, useState } from "react";

type Friend = { id: number; username: string; is_family: boolean };
type FriendRequest = { id: number; username: string; created_at: string };
type SearchResult = { id: number; username: string };

type FriendsData = {
  friends: Friend[];
  family: Friend[];
  incoming: FriendRequest[];
  outgoing: FriendRequest[];
};

function PersonPlusIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <circle cx="7.5" cy="6.5" r="3" />
      <path d="M1.5 17c0-3 2.7-5 6-5s6 2 6 5M15.5 6.5v5M13 9h5" />
    </svg>
  );
}

export default function FriendsManager() {
  const [data, setData] = useState<FriendsData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
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
        if (!cancelled) setLoadError("Could not load friends.");
      });
    return () => {
      cancelled = true;
    };
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
    return <p className="text-sm text-ink-soft">Loading…</p>;
  }

  const friendIds = new Set(data.friends.map((f) => f.id));

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-soft">
          Find people
        </label>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            const value = e.target.value;
            setQuery(value);
            scheduleSearch(value.trim());
          }}
          placeholder="Search by username or email"
          className="w-full rounded-card border border-line bg-bg-soft px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
        />
        {searching && <p className="mt-2 text-xs text-ink-soft">Searching…</p>}
        {results && results.length === 0 && !searching && (
          <p className="mt-2 text-xs text-ink-soft">No one found.</p>
        )}
        {results && results.length > 0 && (
          <div className="mt-2 space-y-1.5">
            {results.map((r) => {
              const alreadyFriend = friendIds.has(r.id);
              const pendingOutgoing = data.outgoing.some((o) => o.username === r.username);
              const pendingIncoming = data.incoming.some((i) => i.username === r.username);
              return (
                <div
                  key={r.id}
                  className="flex items-center justify-between gap-3 rounded-card border border-line bg-surface px-3.5 py-2.5"
                >
                  <span className="truncate text-sm font-medium text-foreground">{r.username}</span>
                  {alreadyFriend ? (
                    <span className="shrink-0 text-xs text-ink-soft">Friends</span>
                  ) : pendingOutgoing ? (
                    <span className="shrink-0 text-xs text-ink-soft">Request sent</span>
                  ) : pendingIncoming ? (
                    <span className="shrink-0 text-xs text-ink-soft">Respond below</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => sendRequest(r.id)}
                      disabled={busyId === `search-${r.id}`}
                      className="flex shrink-0 items-center gap-1.5 rounded-full bg-navy px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-navy-dark disabled:opacity-60"
                    >
                      <PersonPlusIcon />
                      Add
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {data.incoming.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">Friend requests</h3>
          <div className="space-y-1.5">
            {data.incoming.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between gap-3 rounded-card border border-line bg-surface px-3.5 py-2.5"
              >
                <span className="truncate text-sm font-medium text-foreground">{req.username}</span>
                <div className="flex shrink-0 gap-1.5">
                  <button
                    type="button"
                    onClick={() => acceptRequest(req.id)}
                    disabled={busyId === `accept-${req.id}`}
                    className="rounded-full bg-navy px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-navy-dark disabled:opacity-60"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => declineOrCancelRequest(req.id)}
                    disabled={busyId === `decline-${req.id}`}
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

      {data.outgoing.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">Sent requests</h3>
          <div className="space-y-1.5">
            {data.outgoing.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between gap-3 rounded-card border border-line bg-surface px-3.5 py-2.5"
              >
                <span className="truncate text-sm font-medium text-foreground">{req.username}</span>
                <button
                  type="button"
                  onClick={() => declineOrCancelRequest(req.id)}
                  disabled={busyId === `decline-${req.id}`}
                  className="shrink-0 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-[var(--nav-hover-bg)] disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">
          Friends {data.friends.length > 0 && `(${data.friends.length})`}
        </h3>
        {data.friends.length === 0 ? (
          <p className="text-sm text-ink-soft">
            No friends yet — search above to find people already using Tally.
          </p>
        ) : (
          <div className="space-y-1.5">
            {data.friends.map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between gap-3 rounded-card border border-line bg-surface px-3.5 py-2.5"
              >
                <span className="truncate text-sm font-medium text-foreground">{f.username}</span>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => toggleFamily(f.id, f.is_family)}
                    disabled={busyId === `family-${f.id}`}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition disabled:opacity-60 ${
                      f.is_family
                        ? "bg-navy text-white hover:bg-navy-dark"
                        : "border border-line text-foreground hover:bg-[var(--nav-hover-bg)]"
                    }`}
                  >
                    {f.is_family ? "In Family" : "Add to Family"}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeFriend(f.id)}
                    disabled={busyId === `remove-${f.id}`}
                    className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-500/10 disabled:opacity-60 dark:text-red-400"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">
          Family {data.family.length > 0 && `(${data.family.length})`}
        </h3>
        {data.family.length === 0 ? (
          <p className="text-sm text-ink-soft">
            No one in your Family list yet — add a friend above to include them here.
          </p>
        ) : (
          <div className="space-y-1.5">
            {data.family.map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between gap-3 rounded-card border border-line bg-surface px-3.5 py-2.5"
              >
                <span className="truncate text-sm font-medium text-foreground">{f.username}</span>
                <button
                  type="button"
                  onClick={() => toggleFamily(f.id, true)}
                  disabled={busyId === `family-${f.id}`}
                  className="shrink-0 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-[var(--nav-hover-bg)] disabled:opacity-60"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
