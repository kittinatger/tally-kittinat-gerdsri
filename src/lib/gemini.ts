import { GoogleGenAI, Type } from "@google/genai";
import { isTransactionType, type TransactionType } from "@/lib/categories";

export type TransactionExtraction = {
  type: TransactionType;
  merchant: string;
  amount: number;
  date: string;
  category: string;
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
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, enum: ["expense", "income"] },
          merchant: { type: Type.STRING },
          amount: { type: Type.NUMBER },
          date: { type: Type.STRING },
          category: { type: Type.STRING, enum: allCategories },
        },
        required: ["type", "merchant", "amount", "date", "category"],
      },
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("The vision model returned an empty response.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("The vision model returned a response that was not valid JSON.");
  }

  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("Unexpected response shape from the vision model.");
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

  return { type, merchant, amount, date, category };
}
