import { GoogleGenAI, Type } from "@google/genai";
import { categoriesForType, isCategory, type TransactionType } from "@/lib/categories";

export type TransactionExtraction = {
  merchant: string;
  amount: number;
  date: string;
  category: string;
};

const MODEL = "gemini-3.5-flash";

function buildPrompt(type: TransactionType): string {
  const categories = categoriesForType(type);
  const currentYear = new Date().getFullYear();

  if (type === "income") {
    return `You are reading a photo of a document showing money the user received — a payslip, an invoice they sent to a client, a freelance/platform payment confirmation, or a bank deposit or transfer receipt — for a personal finance tracker.
Extract the following fields:
- merchant: the source of the money (employer, client, company, or platform name), cleaned up (title case, no trailing numbers/codes)
- amount: the net or total amount received, as a plain number (no currency symbols, no thousands separators)
- date: the payment date in strict YYYY-MM-DD format. If the year is missing, assume the current year: ${currentYear}.
- category: the single best-fit category, chosen from EXACTLY this list: ${categories.join(", ")}.

If any field is illegible or absent, make your best reasonable guess rather than leaving it blank.
Respond with JSON only, matching the provided schema.`;
  }

  return `You are reading a photo of a purchase receipt for a personal expense tracker.
Extract the following fields:
- merchant: the store or business name, cleaned up (title case, no trailing numbers/codes)
- amount: the final total amount paid, as a plain number (no currency symbols, no thousands separators)
- date: the transaction date in strict YYYY-MM-DD format. If the year is missing, assume the current year: ${currentYear}.
- category: the single best-fit category, chosen from EXACTLY this list: ${categories.join(", ")}.

If any field is illegible or absent, make your best reasonable guess rather than leaving it blank.
Respond with JSON only, matching the provided schema.`;
}

export async function extractTransaction(
  imageBase64: string,
  mimeType: string,
  type: TransactionType,
): Promise<TransactionExtraction> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set.");
  }

  const categories = categoriesForType(type);
  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      {
        role: "user",
        parts: [{ text: buildPrompt(type) }, { inlineData: { mimeType, data: imageBase64 } }],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          merchant: { type: Type.STRING },
          amount: { type: Type.NUMBER },
          date: { type: Type.STRING },
          category: { type: Type.STRING, enum: [...categories] },
        },
        required: ["merchant", "amount", "date", "category"],
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
  const merchant =
    typeof record.merchant === "string" && record.merchant.trim() ? record.merchant.trim() : "Unknown";
  const amount = typeof record.amount === "number" && Number.isFinite(record.amount) ? Math.abs(record.amount) : 0;
  const dateRaw = typeof record.date === "string" ? record.date.trim() : "";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(dateRaw) ? dateRaw : new Date().toISOString().slice(0, 10);
  const categoryRaw = typeof record.category === "string" ? record.category.trim() : "";
  const category = isCategory(type, categoryRaw) ? categoryRaw : "Other";

  return { merchant, amount, date, category };
}
