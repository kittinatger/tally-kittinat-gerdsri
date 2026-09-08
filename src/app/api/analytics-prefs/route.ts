import { NextRequest, NextResponse } from "next/server";
import { getAnalyticsPrefs, setAnalyticsPrefs } from "@/lib/db";
import { analyticsPrefsInputSchema } from "@/lib/validation";
import { getUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getUserId();
  const prefs = await getAnalyticsPrefs(userId);
  return NextResponse.json(prefs);
}

export async function PATCH(req: NextRequest) {
  const userId = await getUserId();
  const body = await req.json().catch(() => null);
  const parsed = analyticsPrefsInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const prefs = await setAnalyticsPrefs(userId, parsed.data);
  return NextResponse.json(prefs);
}
