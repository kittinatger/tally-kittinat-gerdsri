import { listQueuedMutations, markMutationFailed, removeQueuedMutation, requeueMutation, type QueuedMutation } from "./mutation-queue";

// Client-side throttle for replaying queued mutations — must stay well
// under src/lib/mutation-rate-limit.ts's server-side cap (30 mutations per
// 10s window per user) so a large queue flushing on reconnect doesn't
// immediately get 429'd. One request every 400ms is ~25/10s, comfortably
// under that with room for the user's own live traffic too.
const REPLAY_INTERVAL_MS = 400;
const MAX_RETRIES = 3;

export type QueueState = { pending: number; failed: number; syncing: boolean };

const listeners = new Set<(state: QueueState) => void>();
let syncing = false;
let started = false;

async function computeState(): Promise<QueueState> {
  const all = await listQueuedMutations();
  return {
    pending: all.filter((m) => m.status === "pending").length,
    failed: all.filter((m) => m.status === "failed").length,
    syncing,
  };
}

async function emit() {
  const state = await computeState();
  for (const l of listeners) l(state);
}

export function subscribeQueueState(cb: (state: QueueState) => void): () => void {
  listeners.add(cb);
  emit();
  return () => listeners.delete(cb);
}

// Called by fetch-wrapper.ts right after queuing something, and by the
// "online" listener below — both are "something might need syncing now".
export function notifyQueueChanged() {
  emit();
  if (typeof navigator !== "undefined" && navigator.onLine) {
    void flushQueue();
  }
}

async function replayOne(entry: QueuedMutation): Promise<void> {
  const headers: HeadersInit = {};
  if (entry.contentType) headers["Content-Type"] = entry.contentType;
  const res = await fetch(entry.url, { method: entry.method, headers, body: entry.body ?? undefined });
  if (res.ok) {
    if (entry.id !== undefined) await removeQueuedMutation(entry.id);
    return;
  }
  if (res.status === 429) {
    // Rate-limited despite the client-side throttle — leave it pending
    // (not failed) so the next flush pass retries it without counting
    // against MAX_RETRIES; this is expected to be transient.
    throw new Error("rate-limited");
  }
  let message = `Server rejected the change (${res.status}).`;
  try {
    const data = await res.json();
    if (typeof data.error === "string") message = data.error;
  } catch {
    // Non-JSON error body — keep the generic message above.
  }
  if (entry.id !== undefined) {
    if (entry.retries + 1 >= MAX_RETRIES) {
      await markMutationFailed(entry.id, message);
    } else {
      await markMutationFailed(entry.id, message);
      await requeueMutation(entry.id); // stays visible as pending for another attempt
    }
  }
}

export async function flushQueue(): Promise<void> {
  if (syncing) return;
  const pending = (await listQueuedMutations()).filter((m) => m.status === "pending");
  if (pending.length === 0) return;

  syncing = true;
  await emit();
  try {
    for (const entry of pending) {
      if (typeof navigator !== "undefined" && !navigator.onLine) break;
      try {
        await replayOne(entry);
      } catch {
        // A thrown rate-limit/network error here just means "stop this
        // pass" — whatever's left stays pending for the next trigger,
        // rather than being marked failed for a transient condition.
        break;
      }
      await new Promise((r) => setTimeout(r, REPLAY_INTERVAL_MS));
    }
  } finally {
    syncing = false;
    await emit();
  }
}

export function retryFailed(id: number): Promise<void> {
  return requeueMutation(id).then(() => {
    void flushQueue();
  });
}

export function discardFailed(id: number): Promise<void> {
  return removeQueuedMutation(id).then(() => emit());
}

// Call once from OfflineProvider on mount — wires the browser's online
// event to trigger a flush. Idempotent so remounts (e.g. React strict
// mode) don't double-register.
export function startSyncManager() {
  if (started || typeof window === "undefined") return;
  started = true;
  window.addEventListener("online", () => void flushQueue());
  if (navigator.onLine) void flushQueue();
}
