import { NextRequest, NextResponse } from "next/server";
import { askAssistant } from "@/lib/assistant";
import { countRecentGeminiUsage, recordGeminiUsage } from "@/lib/db";
import { getUserId } from "@/lib/auth";

// Shares the same daily Gemini-usage bucket as receipt scanning/voice entry
// (see extract-receipt/route.ts) — one combined cap on paid-API calls per
// user per day, not a separate quota per feature.
const MAX_GEMINI_CALLS_PER_DAY = 60;
const MAX_QUESTION_LENGTH = 300;

// askAssistant's worst case (1 try against MODEL + 1 fallback try against
// LITE_MODEL, each 2 sequential calls capped at gemini.ts's
// REQUEST_TIMEOUT_MS) stays comfortably under this — see
// extract-receipt/route.ts's comment for why this needs to be set at all.
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  const body = await req.json().catch(() => null);
  const question = typeof (body as Record<string, unknown> | null)?.question === "string" ? (body as { question: string }).question.trim() : "";
  const today = typeof (body as Record<string, unknown> | null)?.today === "string" ? (body as { today: string }).today : undefined;

  if (!question) {
    return NextResponse.json({ error: "Ask a question first." }, { status: 400 });
  }
  if (question.length > MAX_QUESTION_LENGTH) {
    return NextResponse.json({ error: `Keep questions under ${MAX_QUESTION_LENGTH} characters.` }, { status: 400 });
  }

  const recentCalls = await countRecentGeminiUsage(userId, 24);
  if (recentCalls >= MAX_GEMINI_CALLS_PER_DAY) {
    return NextResponse.json({ error: "Daily assistant limit reached. Try again tomorrow." }, { status: 429 });
  }

  try {
    await recordGeminiUsage(userId);
    const todayIso = today && /^\d{4}-\d{2}-\d{2}$/.test(today) ? today : new Date().toISOString().slice(0, 10);
    const { answer, model } = await askAssistant(userId, question, todayIso);
    return NextResponse.json({ answer, model });
  } catch (err) {
    console.error("Assistant request failed:", err);
    return NextResponse.json({ error: "Could not get an answer right now. Please try again." }, { status: 502 });
  }
}
