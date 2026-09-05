import { NextRequest, NextResponse } from "next/server";
import { extractTransaction } from "@/lib/gemini";
import { describeGeminiError } from "@/lib/gemini-error";
import {
  getAutoConvertCurrency,
  getCurrency,
  listCategories,
  listWallets,
  listDistinctMerchants,
  countRecentGeminiUsage,
  recordGeminiUsage,
} from "@/lib/db";
import { maybeAutoConvert } from "@/lib/exchange-rate";
import { getUserId } from "@/lib/auth";
import { MAX_GEMINI_CALLS_PER_DAY } from "@/lib/gemini-usage";

const MAX_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);

// Worst case here is 3 retries against MODEL plus one fallback attempt
// against LITE_MODEL (see withGeminiFallback in gemini.ts), each capped at
// REQUEST_TIMEOUT_MS — comfortably under this, but without it the platform's
// own default function timeout (much shorter) could kill the request mid-
// retry, which looks to the client like a request that never resolves at
// all (no response, no error) rather than a clean failure.
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  const formData = await req.formData().catch(() => null);
  const file = formData?.get("image");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No image file was uploaded." }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Unsupported image type. Use JPEG, PNG, WEBP, or HEIC." }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image is too large (max 8MB)." }, { status: 400 });
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
    const [categoryRows, defaultCurrency, autoConvertEnabled, walletRows, knownMerchants] = await Promise.all([
      listCategories(userId),
      getCurrency(userId),
      getAutoConvertCurrency(userId),
      listWallets(userId),
      listDistinctMerchants(userId),
    ]);
    const categories = {
      expense: categoryRows.filter((c) => c.type === "expense").map((c) => c.name),
      income: categoryRows.filter((c) => c.type === "income").map((c) => c.name),
      transfer: categoryRows.filter((c) => c.type === "transfer").map((c) => c.name),
    };
    const { extraction, model } = await extractTransaction(
      base64,
      file.type,
      categories,
      walletRows.map((w) => w.name),
      knownMerchants,
      fallbackDate,
    );
    const result = await maybeAutoConvert(extraction, defaultCurrency, autoConvertEnabled);
    return NextResponse.json({ extraction: result, model });
  } catch (err) {
    const { message, log } = describeGeminiError(err, "image");
    if (log) console.error("extract-receipt: Gemini request failed:", err);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
