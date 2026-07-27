import { GoogleGenAI, Type } from "@google/genai";
import { isTransactionType, type TransactionType } from "@/lib/categories";

export type TransactionExtraction = {
  type: TransactionType;
  merchant: string;
  amount: number;
  date: string;
  category: string;
  notes?: string;
};

export type CategoriesByType = {
  expense: string[];
  income: string[];
};

const MODEL = "gemini-3.5-flash";

function buildPrompt(categories: CategoriesByType): string {
  const currentYear = new Date().getFullYear();
  const allCategories = [...new Set([...categories.expense, ...categories.income])];

  return `You are reading a photo of a financial document for a personal finance tracker. It is either:
- an EXPENSE document: a purchase receipt
- an INCOME document: a payslip, an invoice the user sent to a client, a freelance/platform payment confirmation, or a bank deposit or transfer receipt showing money the user received

First decide which of the two it is, then extract:
- type: exactly "expense" or "income"
- merchant: for an expense, the store or business name; for income, the source of the money (employer, client, company, or platform). Cleaned up (title case, no trailing numbers/codes).
- amount: the total amount (paid, for an expense; received, for income), as a plain number (no currency symbols, no thousands separators)
- date: the transaction/payment date in strict YYYY-MM-DD format. If the year is missing, assume the current year: ${currentYear}.
- category: the single best-fit category.
  - If type is "expense", choose EXACTLY one from: ${categories.expense.join(", ")}.
  - If type is "income", choose EXACTLY one from: ${categories.income.join(", ")}.
  - Only use values from this combined list: ${allCategories.join(", ")}.

If any field is illegible or absent, make your best reasonable guess rather than leaving it blank.
Respond with JSON only, matching the provided schema.`;
}

function buildVoicePrompt(categories: CategoriesByType): string {
  const currentYear = new Date().getFullYear();
  const allCategories = [...new Set([...categories.expense, ...categories.income])];

  return `You are listening to a short voice memo where someone is logging a single financial
transaction out loud for a personal finance tracker, e.g. "I spent twelve fifty on coffee at
Starbucks this morning" or "got paid two thousand dollars from my freelance client yesterday".

First decide whether they are describing an EXPENSE (money they spent) or INCOME (money they
received), then extract:
- type: exactly "expense" or "income"
- merchant: for an expense, the store/business/person paid; for income, the source of the money
  (employer, client, company, platform). Cleaned up (title case). If genuinely not mentioned, use
  a short generic label like "Cash purchase" or "Cash received".
- amount: the amount spoken (handle spoken numbers like "twelve fifty" -> 12.50, "twenty bucks" ->
  20), as a plain number, no currency symbols.
- date: the transaction date in strict YYYY-MM-DD format. Resolve relative terms like "today",
  "yesterday", or a weekday name relative to right now: ${new Date().toISOString()}. If nothing is
  said about timing, assume today. If only a year is missing, assume ${currentYear}.
- category: the single best-fit category.
  - If type is "expense", choose EXACTLY one from: ${categories.expense.join(", ")}.
  - If type is "income", choose EXACTLY one from: ${categories.income.join(", ")}.
  - Only use values from this combined list: ${allCategories.join(", ")}.
- notes: any extra context mentioned that isn't captured above (who it was with, what it was for,
  why), as a short phrase. Empty string if nothing extra was said.

If any field is unclear, make your best reasonable guess rather than leaving it blank.
Respond with JSON only, matching the provided schema.`;
}

function responseSchema(allCategories: string[], includeNotes: boolean) {
  return {
    type: Type.OBJECT,
    properties: {
      type: { type: Type.STRING, enum: ["expense", "income"] },
      merchant: { type: Type.STRING },
      amount: { type: Type.NUMBER },
      date: { type: Type.STRING },
      category: { type: Type.STRING, enum: allCategories },
      ...(includeNotes ? { notes: { type: Type.STRING } } : {}),
    },
    required: ["type", "merchant", "amount", "date", "category"],
  };
}

function parseExtraction(text: string, categories: CategoriesByType): TransactionExtraction {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("The model returned a response that was not valid JSON.");
  }

  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("Unexpected response shape from the model.");
  }

  const record = parsed as Record<string, unknown>;
  const typeRaw = typeof record.type === "string" ? record.type.trim().toLowerCase() : "";
  const type: TransactionType = isTransactionType(typeRaw) ? typeRaw : "expense";
  const merchant =
    typeof record.merchant === "string" && record.merchant.trim() ? record.merchant.trim() : "Unknown";
  const amount = typeof record.amount === "number" && Number.isFinite(record.amount) ? Math.abs(record.amount) : 0;
  const dateRaw = typeof record.date === "string" ? record.date.trim() : "";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(dateRaw) ? dateRaw : new Date().toISOString().slice(0, 10);
  const categoryRaw = typeof record.category === "string" ? record.category.trim() : "";
  const validNames = type === "income" ? categories.income : categories.expense;
  const category = validNames.includes(categoryRaw) ? categoryRaw : (validNames.includes("Other") ? "Other" : (validNames[0] ?? "Other"));
  const notes = typeof record.notes === "string" ? record.notes.trim() : "";

  return { type, merchant, amount, date, category, notes: notes || undefined };
}

export async function extractTransaction(
  imageBase64: string,
  mimeType: string,
  categories: CategoriesByType,
): Promise<TransactionExtraction> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set.");
  }

  const allCategories = [...new Set([...categories.expense, ...categories.income])];
  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      {
        role: "user",
        parts: [{ text: buildPrompt(categories) }, { inlineData: { mimeType, data: imageBase64 } }],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: responseSchema(allCategories, false),
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("The vision model returned an empty response.");
  }

  return parseExtraction(text, categories);
}

export async function extractTransactionFromAudio(
  audioBase64: string,
  mimeType: string,
  categories: CategoriesByType,
): Promise<TransactionExtraction> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set.");
  }

  const allCategories = [...new Set([...categories.expense, ...categories.income])];
  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      {
        role: "user",
        parts: [{ text: buildVoicePrompt(categories) }, { inlineData: { mimeType, data: audioBase64 } }],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: responseSchema(allCategories, true),
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("The model returned an empty response. Try recording again with a clearer description.");
  }

  return parseExtraction(text, categories);
}
