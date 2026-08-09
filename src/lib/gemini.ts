import { GoogleGenAI, Type } from "@google/genai";
import { isTransactionType, isTransferDirection, type TransactionType, type TransferDirection } from "@/lib/categories";

export type TransactionExtraction = {
  type: TransactionType;
  /** Only present when type is "transfer". */
  direction?: TransferDirection;
  merchant: string;
  amount: number;
  date: string;
  category: string;
  notes?: string;
  /** ISO 4217 code of the currency the amount was originally denominated in, if detected. */
  currency?: string;
  /** Name of one of the user's existing wallets, if mentioned/shown (e.g. "paid with cash", "on my Kasikorn card"). */
  wallet?: string;
};

export type CategoriesByType = {
  expense: string[];
  income: string[];
  transfer: string[];
};

// A stable alias (rather than a pinned version) so this doesn't go stale the
// same way "gemini-2.5-flash" did — that model was quietly retired for new
// API keys/projects while staying listed in the models API, which is what
// broke scanning/voice entry for weeks with no code change on our end.
const MODEL = "gemini-flash-latest";

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set.");
  }
  // Gemini occasionally returns transient 429/503 "overloaded" errors;
  // retrying with the SDK's built-in backoff avoids surfacing those to the
  // user as a hard failure on the first blip.
  return new GoogleGenAI({ apiKey, httpOptions: { retryOptions: { attempts: 3 } } });
}

function buildPrompt(categories: CategoriesByType, walletNames: string[]): string {
  const currentYear = new Date().getFullYear();
  const allCategories = [...new Set([...categories.expense, ...categories.income, ...categories.transfer])];

  return `You are reading a photo of a financial document for a personal finance tracker. It is one of:
- an EXPENSE document: a purchase receipt
- an INCOME document: a payslip, an invoice the user sent to a client, a freelance/platform payment confirmation, or money received from someone else
- a TRANSFER document: a receipt for moving the user's own money between their own accounts/wallets -- e.g. an e-wallet top-up, a self-transfer between two of the user's own bank accounts, or a savings deposit. This is NOT income and NOT an expense, since the money is still theirs.

First decide which of the three it is, then extract:
- type: exactly "expense", "income", or "transfer"
- direction: ONLY if type is "transfer" -- "out" if money left the account/cash the user tracks in this app (e.g. topping up an e-wallet), or "in" if money came back into it (e.g. withdrawing from the e-wallet back to the tracked account). Omit this field entirely if type is not "transfer".
- merchant: for an expense, the store or business name; for income, the source of the money (employer, client, company, or platform); for a transfer, a short description of where the money went/came from (e.g. "E-wallet top-up", "Savings transfer"). Cleaned up (title case, no trailing numbers/codes).
- amount: the total amount (paid, for an expense; received, for income; moved, for a transfer), as a plain number (no currency symbols, no thousands separators)
- date: the transaction/payment date in strict YYYY-MM-DD format. If the year is missing, assume the current year: ${currentYear}.
- category: the single best-fit category.
  - If type is "expense", choose EXACTLY one from: ${categories.expense.join(", ")}.
  - If type is "income", choose EXACTLY one from: ${categories.income.join(", ")}.
  - If type is "transfer", choose EXACTLY one from: ${categories.transfer.join(", ")}.
  - Only use values from this combined list: ${allCategories.join(", ")}.
- currency: the ISO 4217 currency code (e.g. USD, EUR, GBP, THB, JPY) the amount is denominated
  in, inferred from any symbol ($, €, £, ¥, ฿, etc.), currency name/code text, or country context
  on the document. Empty string if you genuinely cannot tell.
${walletNames.length > 0 ? `- wallet: which of the user's own wallets this was paid with/into, if the document indicates it (e.g. a card name/number matching a wallet, "cash" for a cash receipt). Choose EXACTLY one from: ${walletNames.join(", ")}. Empty string if you can't tell.` : ""}

If any field is illegible or absent, make your best reasonable guess rather than leaving it blank.
Respond with JSON only, matching the provided schema.`;
}

function buildVoicePrompt(categories: CategoriesByType, walletNames: string[]): string {
  const currentYear = new Date().getFullYear();
  const allCategories = [...new Set([...categories.expense, ...categories.income, ...categories.transfer])];

  return `You are listening to a voice memo where someone is logging financial transactions out
loud for a personal finance tracker. They may describe just ONE transaction, e.g. "I spent twelve
fifty on coffee at Starbucks this morning", or SEVERAL in one recording, e.g. "I spent twelve fifty
on coffee at Starbucks, then forty on lunch at Chipotle, and got paid two thousand dollars from my
freelance client yesterday". Treat each distinct transaction mentioned as a separate entry --
do not merge them into one, and do not invent transactions that weren't actually described.

For EACH transaction, first decide whether it's:
- an EXPENSE (money they spent to someone/somewhere else)
- INCOME (money they received from someone/somewhere else)
- a TRANSFER (money moved between their OWN accounts/wallets -- e.g. an e-wallet top-up, moving
  money to savings, a self-transfer between their own bank accounts. This is NOT income and NOT
  an expense, since it's still their money.)

then extract, for that transaction:
- type: exactly "expense", "income", or "transfer"
- direction: ONLY if type is "transfer" -- "out" if the money left the account/cash tracked in this
  app (e.g. topping up an e-wallet), or "in" if it came back into it (e.g. withdrawing from the
  e-wallet). Omit this field entirely if type is not "transfer".
- merchant: for an expense, the store/business/person paid; for income, the source of the money
  (employer, client, company, platform); for a transfer, a short description (e.g. "E-wallet top-up",
  "Savings transfer"). Cleaned up (title case). If genuinely not mentioned, use a short generic
  label like "Cash purchase" or "Cash received".
- amount: the amount spoken (handle spoken numbers like "twelve fifty" -> 12.50, "twenty bucks" ->
  20), as a plain number, no currency symbols.
- date: the transaction date in strict YYYY-MM-DD format. Resolve relative terms like "today",
  "yesterday", or a weekday name relative to right now: ${new Date().toISOString()}. If nothing is
  said about timing, assume today. If only a year is missing, assume ${currentYear}.
- category: the single best-fit category.
  - If type is "expense", choose EXACTLY one from: ${categories.expense.join(", ")}.
  - If type is "income", choose EXACTLY one from: ${categories.income.join(", ")}.
  - If type is "transfer", choose EXACTLY one from: ${categories.transfer.join(", ")}.
  - Only use values from this combined list: ${allCategories.join(", ")}.
- notes: any extra context mentioned that isn't captured above (who it was with, what it was for,
  why), as a short phrase. Empty string if nothing extra was said.
- currency: the ISO 4217 currency code (e.g. USD, EUR, GBP, THB, JPY) if a specific currency was
  named or clearly implied (e.g. "euros", "baht", "quid"). Empty string if no currency was
  specified — do not guess one from context alone.
${walletNames.length > 0 ? `- wallet: which of the user's own wallets this was paid with/into, if they said so (e.g. "with cash", "on my Kasikorn card", "from savings"). Choose EXACTLY one from: ${walletNames.join(", ")}. Empty string if not mentioned — do not guess.` : ""}

If any field is unclear, make your best reasonable guess rather than leaving it blank.
Respond with a JSON array with one entry per transaction described (a single-item array if only
one was mentioned), matching the provided schema.`;
}

function responseSchema(allCategories: string[], includeNotes: boolean, walletNames: string[]) {
  return {
    type: Type.OBJECT,
    properties: {
      type: { type: Type.STRING, enum: ["expense", "income", "transfer"] },
      direction: { type: Type.STRING, enum: ["out", "in"] },
      merchant: { type: Type.STRING },
      amount: { type: Type.NUMBER },
      date: { type: Type.STRING },
      category: { type: Type.STRING, enum: allCategories },
      currency: { type: Type.STRING },
      ...(includeNotes ? { notes: { type: Type.STRING } } : {}),
      ...(walletNames.length > 0 ? { wallet: { type: Type.STRING, enum: [...walletNames, ""] } } : {}),
    },
    required: ["type", "merchant", "amount", "date", "category"],
  };
}

function arrayResponseSchema(allCategories: string[], walletNames: string[]) {
  return {
    type: Type.ARRAY,
    items: responseSchema(allCategories, true, walletNames),
    minItems: 1,
  };
}

function parseOne(record: Record<string, unknown>, categories: CategoriesByType, walletNames: string[]): TransactionExtraction {
  const typeRaw = typeof record.type === "string" ? record.type.trim().toLowerCase() : "";
  const type: TransactionType = isTransactionType(typeRaw) ? typeRaw : "expense";
  const directionRaw = typeof record.direction === "string" ? record.direction.trim().toLowerCase() : "";
  const direction: TransferDirection | undefined =
    type === "transfer" ? (isTransferDirection(directionRaw) ? directionRaw : "out") : undefined;
  const merchant =
    typeof record.merchant === "string" && record.merchant.trim() ? record.merchant.trim() : "Unknown";
  const amount = typeof record.amount === "number" && Number.isFinite(record.amount) ? Math.abs(record.amount) : 0;
  const dateRaw = typeof record.date === "string" ? record.date.trim() : "";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(dateRaw) ? dateRaw : new Date().toISOString().slice(0, 10);
  const categoryRaw = typeof record.category === "string" ? record.category.trim() : "";
  const validNames = type === "income" ? categories.income : type === "transfer" ? categories.transfer : categories.expense;
  const category = validNames.includes(categoryRaw) ? categoryRaw : (validNames.includes("Other") ? "Other" : (validNames[0] ?? "Other"));
  const notes = typeof record.notes === "string" ? record.notes.trim() : "";
  const currencyRaw = typeof record.currency === "string" ? record.currency.trim().toUpperCase() : "";
  const currency = /^[A-Z]{3}$/.test(currencyRaw) ? currencyRaw : undefined;
  const walletRaw = typeof record.wallet === "string" ? record.wallet.trim() : "";
  const wallet = walletNames.find((w) => w.toLowerCase() === walletRaw.toLowerCase());

  return { type, direction, merchant, amount, date, category, notes: notes || undefined, currency, wallet };
}

function parseExtraction(text: string, categories: CategoriesByType, walletNames: string[]): TransactionExtraction {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("The model returned a response that was not valid JSON.");
  }
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("Unexpected response shape from the model.");
  }
  return parseOne(parsed as Record<string, unknown>, categories, walletNames);
}

function parseExtractions(text: string, categories: CategoriesByType, walletNames: string[]): TransactionExtraction[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("The model returned a response that was not valid JSON.");
  }
  // The model can return a single object instead of a one-item array despite
  // the schema when there's clearly only one transaction — tolerate that.
  const items = Array.isArray(parsed) ? parsed : [parsed];
  const results = items
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item) => parseOne(item, categories, walletNames));
  if (results.length === 0) {
    throw new Error("Unexpected response shape from the model.");
  }
  return results;
}

export async function extractTransaction(
  imageBase64: string,
  mimeType: string,
  categories: CategoriesByType,
  walletNames: string[] = [],
): Promise<TransactionExtraction> {
  const allCategories = [...new Set([...categories.expense, ...categories.income, ...categories.transfer])];
  const ai = getClient();

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      {
        role: "user",
        parts: [{ text: buildPrompt(categories, walletNames) }, { inlineData: { mimeType, data: imageBase64 } }],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: responseSchema(allCategories, false, walletNames),
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("The vision model returned an empty response.");
  }

  return parseExtraction(text, categories, walletNames);
}

// Voice entry supports logging several transactions in one recording (e.g.
// "twelve fifty on coffee, then forty on lunch"), so this always returns an
// array — one item for a single-transaction recording, more for a bulk one.
export async function extractTransactionsFromAudio(
  audioBase64: string,
  mimeType: string,
  categories: CategoriesByType,
  walletNames: string[] = [],
): Promise<TransactionExtraction[]> {
  const allCategories = [...new Set([...categories.expense, ...categories.income, ...categories.transfer])];
  const ai = getClient();

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      {
        role: "user",
        parts: [{ text: buildVoicePrompt(categories, walletNames) }, { inlineData: { mimeType, data: audioBase64 } }],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: arrayResponseSchema(allCategories, walletNames),
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("The model returned an empty response. Try recording again with a clearer description.");
  }

  return parseExtractions(text, categories, walletNames);
}
