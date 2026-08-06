import { NextRequest, NextResponse } from "next/server";
import { ApiError } from "@google/genai";
import { extractTransaction } from "@/lib/gemini";
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

const MAX_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);

// Gemini calls cost money — cap interactive scans (this route + extract-voice
// share the same daily bucket, see countRecentGeminiUsage) well above normal
// usage but well below what a scripted client could rack up.
const MAX_GEMINI_CALLS_PER_DAY = 60;

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
    const extraction = await extractTransaction(base64, file.type, categories, walletRows.map((w) => w.name));
    const result = await maybeAutoConvert(extraction, defaultCurrency, autoConvertEnabled);
    return NextResponse.json({ extraction: result });
  } catch (err) {
    if (err instanceof ApiError && (err.status === 429 || err.status === 503)) {
      return NextResponse.json(
        { error: "Gemini is busy right now. Please try again in a moment." },
        { status: 502 },
      );
    }
    // Gemini's SDK throws a plain Error for non-retryable (e.g. 4xx) API
    // responses with a message like "Non-retryable exception Bad Request
    // sending request" — an internal detail, not something a user can act
    // on. Log the real error for us, but never surface raw SDK text to the
    // client; a Bad Request from Gemini here almost always means it
    // rejected the image itself (unreadable/unsupported despite passing our
    // own type check), so point the user at the two things actually worth
    // trying.
    console.error("extract-receipt: Gemini request failed:", err);
    const message =
      err instanceof Error && /non-retryable/i.test(err.message)
        ? "Gemini couldn't process that image. Try a different photo, or use manual entry instead."
        : "Failed to read the document. Please try again.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
