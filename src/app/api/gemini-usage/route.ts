import { NextResponse } from "next/server";
import { countRecentGeminiUsage } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { MAX_GEMINI_CALLS_PER_DAY } from "@/lib/gemini-usage";

// Read-only view of the same daily counter extract-receipt/extract-voice/
// assistant/generate-pattern all check before running — used by the new
// AI settings panel to show "X of Y used today" instead of the user only
// finding out when a scan/voice entry/question is rejected with "Daily
// limit reached."
export async function GET() {
  const userId = await getUserId();
  const used = await countRecentGeminiUsage(userId, 24);
  return NextResponse.json({ used, limit: MAX_GEMINI_CALLS_PER_DAY });
}
