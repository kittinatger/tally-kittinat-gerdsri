import { extractTransaction } from "@/lib/gemini";
import { maybeAutoConvert } from "@/lib/exchange-rate";
import {
  listCategories,
  getCurrency,
  getAutoConvertCurrency,
  listWallets,
  createExpense,
  attachReceiptImage,
  type Expense as DbExpense,
} from "@/lib/db";
import { isTransactionType, isTransferDirection } from "@/lib/categories";
import type { ExpenseInput } from "@/lib/validation";

// Shared by every "unattended" intake path (the token-authenticated
// /api/intake/receipt for Shortcuts automations, and the Android Share
// Target route) — unlike the interactive scan flow in
// /api/extract-receipt, there's no one present to review the extraction
// before it becomes a real transaction, so this creates it directly.
// Tagged "auto-import" and keeps the source photo attached so mistakes are
// easy to spot and fix afterward in Activities.
export async function importReceiptImage(
  userId: number,
  buffer: Buffer,
  mimeType: string,
): Promise<{ ok: true; expense: DbExpense } | { ok: false; error: string }> {
  try {
    const [categoryRows, defaultCurrency, autoConvertEnabled, walletRows] = await Promise.all([
      listCategories(userId),
      getCurrency(userId),
      getAutoConvertCurrency(userId),
      listWallets(userId),
    ]);
    const categories = {
      expense: categoryRows.filter((c) => c.type === "expense").map((c) => c.name),
      income: categoryRows.filter((c) => c.type === "income").map((c) => c.name),
      transfer: categoryRows.filter((c) => c.type === "transfer").map((c) => c.name),
    };

    const base64 = buffer.toString("base64");
    const extraction = await extractTransaction(base64, mimeType, categories, walletRows.map((w) => w.name));
    const converted = await maybeAutoConvert(extraction, defaultCurrency, autoConvertEnabled);

    const type = isTransactionType(converted.type) ? converted.type : "expense";
    const categoryValid = categoryRows.some((c) => c.type === type && c.name === converted.category);
    const matchedWallet = walletRows.find((w) => w.name === converted.wallet);

    const sharedFields = {
      date: converted.date,
      amount: converted.amount,
      merchant: converted.merchant,
      category: categoryValid ? converted.category : "Other",
      tags: ["auto-import"],
      walletId: matchedWallet?.id ?? null,
    };
    const input: ExpenseInput =
      type === "transfer"
        ? {
            type: "transfer",
            direction: converted.direction && isTransferDirection(converted.direction) ? converted.direction : "out",
            ...sharedFields,
          }
        : { type, ...sharedFields };

    const expense = await createExpense(userId, input);
    await attachReceiptImage(userId, expense.id, buffer, mimeType);
    return { ok: true, expense };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to read the document." };
  }
}
