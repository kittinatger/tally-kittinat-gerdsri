import { GoogleGenAI, Type, ApiError } from "@google/genai";
import { isTransactionType, isTransferDirection, type TransactionType, type TransferDirection } from "@/lib/categories";
import { MODEL, LITE_MODEL, REQUEST_TIMEOUT_MS } from "@/lib/gemini-models";

export { MODEL, LITE_MODEL, REQUEST_TIMEOUT_MS };

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

export function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set.");
  }
  // NOTE: httpOptions.retryOptions is intentionally NOT set here. When it is,
  // the SDK's retry-capable fetch path (`apiCall` in the SDK) throws a bare
  // Error containing only the HTTP statusText (e.g. "Bad Request") and
  // discards the actual JSON error body from Google -- it never constructs
  // an ApiError. That made every real failure reason invisible to us (and to
  // describeGeminiError's ApiError-specific branches). Without retryOptions,
  // the SDK uses `throwErrorIfNotOK`, which parses the real error body into
  // a proper ApiError with the true status/message.
  return new GoogleGenAI({ apiKey });
}

// "Gemini is busy right now" (429/503, see describeGeminiError) is often
// transient — a momentary overload on Google's end clears within a couple
// seconds — but every call here previously surfaced it to the user on the
// very first attempt with no retry at all, so anyone hitting a brief blip
// saw a hard failure instead of it just working a second later. Retries
// only 429 (rate limit) and 503 (overloaded); anything else (bad input,
// auth/config problems, a genuinely exhausted quota that won't clear in
// seconds) fails immediately, same as before.
function isRetryableGeminiError(err: unknown): boolean {
  return err instanceof ApiError && (err.status === 429 || err.status === 503);
}

export async function withGeminiRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (!isRetryableGeminiError(err) || attempt === attempts) throw err;
      const delayMs = 500 * 2 ** (attempt - 1); // 500ms, 1000ms, ...
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  // Unreachable — the loop always either returns or throws — but keeps
  // TypeScript happy about every code path returning a value.
  throw new Error("withGeminiRetry: exhausted attempts without returning or throwing.");
}

// Runs `run` against MODEL with a retry (3x by default); if every attempt
// is still rate-limited/overloaded, makes one more attempt against
// LITE_MODEL instead of giving up. `run` takes the model id so the same
// logical request (single call, or — for askAssistant's two-step
// tool-calling exchange — the whole exchange) can be replayed against
// whichever model ends up serving it, rather than mixing models
// mid-conversation. Returns which model actually answered so callers can
// surface that to the user. On a failure that ISN'T rate-limiting (bad
// input, auth/config, a genuinely exhausted quota), or if the lite
// attempt also fails, the original MODEL error propagates — LITE_MODEL is
// never the error the user sees, since it's not the model they expect
// results from.
//
// `attempts` defaults to 3 but askAssistant passes 1: each of its "calls"
// is actually 2 sequential generateContent round trips (the tool-call
// exchange), so 3 retries of that would be 6 calls before ever reaching
// the lite fallback — multiplied by REQUEST_TIMEOUT_MS per call, that
// risks exceeding the serverless function's own execution time limit
// (see maxDuration in the API routes that call into this), which kills
// the request outright and leaves the client with no response at all —
// not a clean error, just a hang. Single-call callers keep the default.
export async function withGeminiFallback<T>(run: (model: string) => Promise<T>, attempts = 3): Promise<{ result: T; model: string }> {
  try {
    const result = await withGeminiRetry(() => run(MODEL), attempts);
    return { result, model: MODEL };
  } catch (err) {
    if (!isRetryableGeminiError(err)) throw err;
    try {
      const result = await run(LITE_MODEL);
      return { result, model: LITE_MODEL };
    } catch {
      // The lite attempt failed too (including for reasons unrelated to
      // rate limiting) — surface the original, more informative error
      // about the model the user actually expects to be used.
      throw err;
    }
  }
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
      // No empty-string sentinel in the enum -- Gemini's schema validation
      // now rejects empty-string enum values outright. `wallet` is omitted
      // from `required` below, so the model can just leave the field out
      // entirely when it can't tell which wallet was used.
      ...(walletNames.length > 0 ? { wallet: { type: Type.STRING, enum: walletNames } } : {}),
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

function parseOne(
  record: Record<string, unknown>,
  categories: CategoriesByType,
  walletNames: string[],
  fallbackDate: string,
): TransactionExtraction {
  const typeRaw = typeof record.type === "string" ? record.type.trim().toLowerCase() : "";
  const type: TransactionType = isTransactionType(typeRaw) ? typeRaw : "expense";
  const directionRaw = typeof record.direction === "string" ? record.direction.trim().toLowerCase() : "";
  const direction: TransferDirection | undefined =
    type === "transfer" ? (isTransferDirection(directionRaw) ? directionRaw : "out") : undefined;
  const merchant =
    typeof record.merchant === "string" && record.merchant.trim() ? record.merchant.trim() : "Unknown";
  const amount = typeof record.amount === "number" && Number.isFinite(record.amount) ? Math.abs(record.amount) : 0;
  const dateRaw = typeof record.date === "string" ? record.date.trim() : "";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(dateRaw) ? dateRaw : fallbackDate;
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

function parseExtraction(
  text: string,
  categories: CategoriesByType,
  walletNames: string[],
  fallbackDate: string,
): TransactionExtraction {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("The model returned a response that was not valid JSON.");
  }
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("Unexpected response shape from the model.");
  }
  return parseOne(parsed as Record<string, unknown>, categories, walletNames, fallbackDate);
}

function parseExtractions(
  text: string,
  categories: CategoriesByType,
  walletNames: string[],
  fallbackDate: string,
): TransactionExtraction[] {
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
    .map((item) => parseOne(item, categories, walletNames, fallbackDate));
  if (results.length === 0) {
    throw new Error("Unexpected response shape from the model.");
  }
  return results;
}

// Server time zone won't match the user's — used only when the client didn't
// supply its own local "today" as fallbackDate.
function serverTodayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function extractTransaction(
  imageBase64: string,
  mimeType: string,
  categories: CategoriesByType,
  walletNames: string[] = [],
  fallbackDate: string = serverTodayIso(),
): Promise<{ extraction: TransactionExtraction; model: string }> {
  const allCategories = [...new Set([...categories.expense, ...categories.income, ...categories.transfer])];
  const ai = getClient();

  const { result: text, model } = await withGeminiFallback(async (model) => {
    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          role: "user",
          parts: [{ text: buildPrompt(categories, walletNames) }, { inlineData: { mimeType, data: imageBase64 } }],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema(allCategories, false, walletNames),
        httpOptions: { timeout: REQUEST_TIMEOUT_MS },
      },
    });
    if (!response.text) {
      throw new Error("The vision model returned an empty response.");
    }
    return response.text;
  });

  return { extraction: parseExtraction(text, categories, walletNames, fallbackDate), model };
}

// Voice entry supports logging several transactions in one recording (e.g.
// "twelve fifty on coffee, then forty on lunch"), so this always returns an
// array — one item for a single-transaction recording, more for a bulk one.
export async function extractTransactionsFromAudio(
  audioBase64: string,
  mimeType: string,
  categories: CategoriesByType,
  walletNames: string[] = [],
  fallbackDate: string = serverTodayIso(),
): Promise<{ extractions: TransactionExtraction[]; model: string }> {
  const allCategories = [...new Set([...categories.expense, ...categories.income, ...categories.transfer])];
  const ai = getClient();

  const { result: text, model } = await withGeminiFallback(async (model) => {
    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          role: "user",
          parts: [{ text: buildVoicePrompt(categories, walletNames) }, { inlineData: { mimeType, data: audioBase64 } }],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: arrayResponseSchema(allCategories, walletNames),
        httpOptions: { timeout: REQUEST_TIMEOUT_MS },
      },
    });
    if (!response.text) {
      throw new Error("The model returned an empty response. Try recording again with a clearer description.");
    }
    return response.text;
  });

  return { extractions: parseExtractions(text, categories, walletNames, fallbackDate), model };
}
