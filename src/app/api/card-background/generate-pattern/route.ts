import { NextRequest, NextResponse } from "next/server";
import { generateCardPatternImage } from "@/lib/gemini-pattern";
import { describeGeminiError } from "@/lib/gemini-error";
import { countRecentGeminiUsage, recordGeminiUsage } from "@/lib/db";
import { getUserId } from "@/lib/auth";

const MAX_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

// Shares the same daily bucket as extract-receipt/extract-voice (see
// countRecentGeminiUsage) — all three are interactive Gemini calls a user
// can trigger from the UI, so one combined cap is simpler than a separate
// counter per feature and still well above normal usage.
const MAX_GEMINI_CALLS_PER_DAY = 60;

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  const formData = await req.formData().catch(() => null);
  const file = formData?.get("image");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No image file was uploaded." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Unsupported image type. Use JPEG, PNG, or WEBP." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image is too large (max 8MB)." }, { status: 400 });
  }

  const recentCalls = await countRecentGeminiUsage(userId, 24);
  if (recentCalls >= MAX_GEMINI_CALLS_PER_DAY) {
    return NextResponse.json({ error: "Daily scan limit reached. Try again tomorrow." }, { status: 429 });
  }

  try {
    await recordGeminiUsage(userId);
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");
    const result = await generateCardPatternImage(base64, file.type);
    return NextResponse.json({ image: `data:${result.mimeType};base64,${result.data}` });
  } catch (err) {
    const { message, log } = describeGeminiError(err, "image");
    if (log) console.error("generate-pattern: Gemini request failed:", err);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
