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
import { getUserId, guestBlockedResponse } from "@/lib/auth";
import { MAX_GEMINI_CALLS_PER_DAY } from "@/lib/gemini-usage";

const MAX_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);

// The model race in gemini.ts (withGeminiHedge) runs MODEL (45s cap, up to
// two attempts on a rate limit) and LITE_MODEL (30s cap) side by side, so
// it settles well inside this; it has to stay above that worst case, or the
// platform kills the function mid-request and the client gets no response
// at all instead of a clean error.
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  // Everything the prompt needs is looked up while the upload is still
  // being read, rather than one round trip after another.
  const contextPromise = Promise.all([
    listCategories(userId),
    getCurrency(userId),
    getAutoConvertCurrency(userId),
    listWallets(userId),
    listDistinctMerchants(userId),
  ]);
  contextPromise.catch(() => {}); // awaited below; avoids an unhandled rejection on early returns
  const [blocked, recentCalls, formData] = await Promise.all([
    guestBlockedResponse(userId),
    countRecentGeminiUsage(userId, 24),
    req.formData().catch(() => null),
  ]);
  if (blocked) return blocked;
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
    const [[categoryRows, defaultCurrency, autoConvertEnabled, walletRows, knownMerchants]] = await Promise.all([
      contextPromise,
      recordGeminiUsage(userId),
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
