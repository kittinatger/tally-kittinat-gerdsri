import { NextRequest, NextResponse } from "next/server";
import { extractTransactionsFromAudio } from "@/lib/gemini";
import { describeGeminiError } from "@/lib/gemini-error";
import {
  getAutoConvertCurrency,
  getCurrency,
  listCategories,
  listWallets,
  countRecentGeminiUsage,
  recordGeminiUsage,
} from "@/lib/db";
import { maybeAutoConvert } from "@/lib/exchange-rate";
import { getUserId } from "@/lib/auth";

const MAX_BYTES = 15 * 1024 * 1024; // 15MB
const ALLOWED_TYPES = new Set([
  "audio/webm",
  "audio/mp4",
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/ogg",
  "audio/x-m4a",
]);

// Shares its daily bucket with extract-receipt — see countRecentGeminiUsage.
const MAX_GEMINI_CALLS_PER_DAY = 60;

// See extract-receipt/route.ts's comment — same retry/fallback worst case.
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  const formData = await req.formData().catch(() => null);
  const file = formData?.get("audio");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No audio recording was uploaded." }, { status: 400 });
  }

  // Browsers report MediaRecorder mime types with a codecs suffix (e.g.
  // "audio/webm;codecs=opus"), so match on the base type only.
  const baseType = file.type.split(";")[0].trim().toLowerCase();

  if (!ALLOWED_TYPES.has(baseType)) {
    return NextResponse.json({ error: `Unsupported audio format: ${file.type || "unknown"}.` }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Recording is too long (max 15MB)." }, { status: 400 });
  }

  const recentCalls = await countRecentGeminiUsage(userId, 24);
  if (recentCalls >= MAX_GEMINI_CALLS_PER_DAY) {
    return NextResponse.json({ error: "Daily scan limit reached. Try again tomorrow." }, { status: 429 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");

  // The client's own local "today" (see todayInputValue in lib/format.ts) —
  // used only as a fallback when Gemini can't extract a date, so a scan near
  // midnight lands on the user's calendar day, not the server's UTC one.
  const fallbackDateRaw = formData?.get("fallbackDate");
  const fallbackDate =
    typeof fallbackDateRaw === "string" && /^\d{4}-\d{2}-\d{2}$/.test(fallbackDateRaw) ? fallbackDateRaw : undefined;

  try {
    await recordGeminiUsage(userId);
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
    const { extractions, model } = await extractTransactionsFromAudio(
      base64,
      baseType,
      categories,
      walletRows.map((w) => w.name),
      fallbackDate,
    );
    const results = await Promise.all(
      extractions.map((extraction) => maybeAutoConvert(extraction, defaultCurrency, autoConvertEnabled)),
    );
    return NextResponse.json({ extractions: results, model });
  } catch (err) {
    const { message, log } = describeGeminiError(err, "audio");
    if (log) console.error("extract-voice: Gemini request failed:", err);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
