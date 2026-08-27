import { idbDelete, idbGetAll, idbPut, offlineDbAvailable, QUEUE_STORE } from "./db";

export type QueuedMutation = {
  id?: number; // set once persisted (IndexedDB autoIncrement key)
  method: string;
  url: string;
  body: string | null;
  contentType: string | null;
  createdAt: number;
  retries: number;
  status: "pending" | "failed";
  /** Last error message, shown to the user for a failed item. */
  lastError?: string;
};

export async function enqueueMutation(entry: Omit<QueuedMutation, "id" | "createdAt" | "retries" | "status">): Promise<QueuedMutation> {
  const record: QueuedMutation = { ...entry, createdAt: Date.now(), retries: 0, status: "pending" };
  const id = await idbPut(QUEUE_STORE, record);
  return { ...record, id: id as number };
}

export async function listQueuedMutations(): Promise<QueuedMutation[]> {
  if (!offlineDbAvailable()) return [];
  const all = await idbGetAll<QueuedMutation>(QUEUE_STORE);
  return all.sort((a, b) => a.createdAt - b.createdAt);
}

export async function removeQueuedMutation(id: number): Promise<void> {
  await idbDelete(QUEUE_STORE, id);
}

export async function markMutationFailed(id: number, error: string): Promise<void> {
  const all = await idbGetAll<QueuedMutation>(QUEUE_STORE);
  const entry = all.find((m) => m.id === id);
  if (!entry) return;
  entry.status = "failed";
  entry.retries += 1;
  entry.lastError = error;
  await idbPut(QUEUE_STORE, entry);
}

export async function requeueMutation(id: number): Promise<void> {
  const all = await idbGetAll<QueuedMutation>(QUEUE_STORE);
  const entry = all.find((m) => m.id === id);
  if (!entry) return;
  entry.status = "pending";
  await idbPut(QUEUE_STORE, entry);
}
