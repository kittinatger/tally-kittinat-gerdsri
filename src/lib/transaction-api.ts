// Client-side calls for saving new transactions — shared by the Add page's
// composer (manual entry, receipt scans and voice entries all save the same
// way). Moved out of the old Add modal when that became a page.
import { locationFromRow, normalizeExpenseType, normalizeDirection, type Expense } from "@/types/expense";
import type { ExpenseFormValues } from "@/components/ExpenseForm";
import { mutateFetch } from "@/lib/offline/fetch-wrapper";
import { downscaleImage } from "@/lib/image-downscale";

export type DuplicateMatch = { id: number; date: string; amount: string; merchant: string };

// Thrown by createExpense() when the server flags a likely duplicate
// (409, see api/expenses/route.ts) — carries the existing match so the
// caller can show what it collided with and offer "Add anyway".
export class DuplicateExpenseError extends Error {
  duplicate: DuplicateMatch;
  constructor(duplicate: DuplicateMatch) {
    super("duplicate");
    this.duplicate = duplicate;
  }
}

export async function createExpense(values: ExpenseFormValues, confirmDuplicate = false): Promise<Expense> {
  // Note: the server-side duplicate check (409) needs a live round trip, so
  // it's simply skipped while offline — mutateFetch queues the request
  // instead of reaching the server at all (see fetch-wrapper.ts).
  const res = await mutateFetch("/api/expenses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: values.type,
      direction: values.type === "transfer" ? values.direction : undefined,
      date: values.date,
      amount: Number(values.amount),
      merchant: values.merchant,
      category: values.category,
      notes: values.notes || undefined,
      tags: values.tags,
      walletId: values.walletId,
      locationName: values.locationName?.trim() ? values.locationName.trim() : null,
      latitude: values.latitude ?? null,
      longitude: values.longitude ?? null,
      confirmDuplicate,
    }),
  });
  const data = await res.json();
  if (res.status === 409 && data.duplicate) {
    throw new DuplicateExpenseError(data.duplicate);
  }
  if (!res.ok) {
    throw new Error(typeof data.error === "string" ? data.error : "Could not save that entry.");
  }
  // data.expense is absent when this was queued offline — return a
  // placeholder with a negative temp id so the UI can show it right away;
  // it's superseded by the real row (and its real id) the next time this
  // account's data is refreshed after the queue syncs.
  if (!data.expense) {
    return {
      id: -Date.now(),
      type: normalizeExpenseType(values.type),
      direction: normalizeDirection(values.type === "transfer" ? (values.direction ?? null) : null),
      date: values.date,
      amount: Number(values.amount),
      merchant: values.merchant,
      category: values.category,
      notes: values.notes || null,
      tags: values.tags,
      hasReceipt: false,
      walletId: values.walletId ?? null,
      walletName: null,
      splitGroupId: null,
      locationName: values.locationName?.trim() || null,
      latitude: values.latitude ?? null,
      longitude: values.longitude ?? null,
    };
  }
  return {
    id: data.expense.id,
    type: normalizeExpenseType(data.expense.type),
    direction: normalizeDirection(data.expense.direction),
    date: data.expense.date,
    amount: Number(data.expense.amount),
    merchant: data.expense.merchant,
    category: data.expense.category,
    notes: data.expense.notes,
    tags: data.expense.tags ?? [],
    hasReceipt: data.expense.has_receipt ?? false,
    walletId: data.expense.wallet_id ?? null,
    walletName: data.expense.wallet_name ?? null,
    splitGroupId: data.expense.split_group_id ?? null,
    ...locationFromRow(data.expense),
  };
}

// One transaction split across several categories — saved as linked rows.
export async function createSplitExpense(values: ExpenseFormValues): Promise<Expense[]> {
  const res = await fetch("/api/expenses/split", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: values.type,
      date: values.date,
      merchant: values.merchant,
      notes: values.notes || undefined,
      tags: values.tags,
      walletId: values.walletId,
      lines: (values.splitLines ?? []).map((l) => ({ category: l.category, amount: Number(l.amount) })),
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(typeof data.error === "string" ? data.error : "Could not save that split transaction.");
  }
  return (data.expenses as Record<string, unknown>[]).map((e) => ({
    id: e.id as number,
    type: normalizeExpenseType(e.type as string),
    direction: normalizeDirection(e.direction as string | null),
    date: e.date as string,
    amount: Number(e.amount),
    merchant: e.merchant as string,
    category: e.category as string,
    notes: e.notes as string | null,
    tags: (e.tags as string[]) ?? [],
    hasReceipt: (e.has_receipt as boolean) ?? false,
    walletId: (e.wallet_id as number | null) ?? null,
    walletName: (e.wallet_name as string | null) ?? null,
    splitGroupId: (e.split_group_id as string | null) ?? null,
  }));
}

// Creates the shared Split bills record for a "split this bill with
// friends" expense: the friends' amounts came straight from the form, but
// for a custom split the creator's own share is never asked for directly
// (it's just "whatever's left") -- so it's computed here as the remainder
// and the creator's own account id is fetched to attach it, since
// POST /api/splits requires every participant's share to be given
// explicitly and to sum to exactly the total.
export async function createSplitWithFriends(
  totalAmount: number,
  title: string,
  date: string,
  splitWithFriends: NonNullable<ExpenseFormValues["splitWithFriends"]>,
): Promise<void> {
  let customOwed: { userId: number; amount: number }[] | undefined;
  if (splitWithFriends.splitMethod === "custom") {
    const accountRes = await fetch("/api/account");
    const account = await accountRes.json();
    const friendsOwed = splitWithFriends.participantIds.map((id) => ({
      userId: id,
      amount: splitWithFriends.customOwed?.find((e) => e.userId === id)?.amount ?? 0,
    }));
    const friendsTotal = friendsOwed.reduce((sum, e) => sum + e.amount, 0);
    const myShare = Math.round((totalAmount - friendsTotal) * 100) / 100;
    customOwed = [...friendsOwed, { userId: account.id, amount: myShare }];
  }
  const res = await fetch("/api/splits", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: title || "Split bill",
      totalAmount,
      splitMethod: splitWithFriends.splitMethod,
      paymentMethod: "single_payer",
      date,
      participantIds: splitWithFriends.participantIds,
      customOwed,
    }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(typeof data.error === "string" ? data.error : "Could not create the split.");
  }
}

// Attaches a scanned receipt photo to a saved transaction. Best-effort:
// returns whether it worked, never throws.
export async function attachReceipt(expenseId: number, file: File): Promise<boolean> {
  try {
    const receiptData = new FormData();
    receiptData.append("image", await downscaleImage(file));
    const res = await fetch(`/api/expenses/${expenseId}/receipt`, { method: "POST", body: receiptData });
    return res.ok;
  } catch {
    return false;
  }
}
