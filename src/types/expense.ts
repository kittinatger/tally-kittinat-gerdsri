import { isTransactionType, isTransferDirection, type TransactionType, type TransferDirection } from "@/lib/categories";

/** Coerces an API/DB row's raw type & direction strings into typed values, defaulting to "expense" for anything unrecognized. */
export function normalizeExpenseType(rawType: string): TransactionType {
  return isTransactionType(rawType) ? rawType : "expense";
}

export function normalizeDirection(rawDirection: string | null | undefined): TransferDirection | null {
  return typeof rawDirection === "string" && isTransferDirection(rawDirection) ? rawDirection : null;
}

export type Expense = {
  id: number;
  type: TransactionType;
  /** Only meaningful when type is "transfer". */
  direction: TransferDirection | null;
  date: string;
  amount: number;
  merchant: string;
  category: string;
  notes: string | null;
  tags: string[];
  hasReceipt: boolean;
  walletId: number | null;
  walletName: string | null;
  splitGroupId: string | null;
  /** Where it happened — a place name and/or coordinates. Optional: only the
   * screens that show transaction details populate these. */
  locationName?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  /** When it was saved (ISO, UTC) — only set on the details page, which
   * shows the time alongside the date when it was logged on that day. */
  createdAt?: string | null;
};

/** Maps a DB/API row's location columns onto Expense's location fields. */
export function locationFromRow(row: {
  location_name?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
}): Pick<Expense, "locationName" | "latitude" | "longitude"> {
  const lat = row.latitude == null ? null : Number(row.latitude);
  const lng = row.longitude == null ? null : Number(row.longitude);
  return {
    locationName: row.location_name ?? null,
    latitude: lat != null && Number.isFinite(lat) ? lat : null,
    longitude: lng != null && Number.isFinite(lng) ? lng : null,
  };
}

export function signedAmount(expense: Expense): number {
  if (expense.type === "transfer") {
    return expense.direction === "in" ? expense.amount : -expense.amount;
  }
  return expense.type === "income" ? expense.amount : -expense.amount;
}
