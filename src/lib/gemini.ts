import { GoogleGenAI, Type } from "@google/genai";
import { CATEGORIES, isCategory } from "@/lib/categories";

export type ReceiptExtraction = {
  merchant: string;
  amount: number;
  date: string;
  category: string;
  notes?: string;
};

const MODEL = "gemini-3.5-flash";

const PROMPT = `You are reading a photo of a purchase receipt for a personal expense tracker.
Extract the following fields:
- merchant: the store or business name, cleaned up (title case, no trailing numbers/codes)
- amount: the final total amount paid, as a plain number (no currency symbols, no thousands separators)
- date: the transaction date in strict YYYY-MM-DD format. If the year is missing, assume the current year: ${new Date().getFullYear()}.
- category: the single best-fit category, chosen from EXACTLY this list: ${CATEGORIES.join(", ")}.

If any field is illegible or absent, make your best reasonable guess rather than leaving it blank.
Respond with JSON only, matching the provided schema.`;

export async function extractReceipt(imageBase64: string, mimeType: string): Promise<ReceiptExtraction> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      {
        role: "user",
        parts: [{ text: PROMPT }, { inlineData: { mimeType, data: imageBase64 } }],
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
          category: { type: Type.STRING, enum: [...CATEGORIES] },
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
  const merchant = typeof record.merchant === "string" && record.merchant.trim() ? record.merchant.trim() : "Unknown merchant";
  const amount = typeof record.amount === "number" && Number.isFinite(record.amount) ? Math.abs(record.amount) : 0;
  const dateRaw = typeof record.date === "string" ? record.date.trim() : "";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(dateRaw) ? dateRaw : new Date().toISOString().slice(0, 10);
  const categoryRaw = typeof record.category === "string" ? record.category.trim() : "";
  const category = isCategory(categoryRaw) ? categoryRaw : "Other";

  return { merchant, amount, date, category };
}
